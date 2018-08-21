import "../sass/main.scss"
var SLICSuperPixels = require("./SLICSuperPixels")
var pixelDiff = require('./pixelDiff')
var drawCanvas = require('./drawCanvas')

//----------------------
// Not library code
//----------------------

// downsize images so stuff doesn't take long to process while dev'ing
var down_size = 1;

// controls
var uploader 	= document.getElementById("uploader");
var show 		= document.getElementById("show");
var scontrols   = document.getElementById("segment-controls");
var segment     = document.getElementById("segment");
var keep 		= document.getElementById("keep");
var cut 		= document.getElementById("cut");
var clear 		= document.getElementById("clear");
var segment 	= document.getElementById("segment");
var edges 		= document.getElementById("edges");
var crop 		= document.getElementById("crop");
var spixels 	= document.getElementById("superpixels");

// canvas stuff
var srcc = document.getElementById("src");
var mask = document.getElementById("mask");
var outc = document.getElementById("out");
var sctx = srcc.getContext("2d");
var mctx = mask.getContext("2d");
var octx = outc.getContext("2d");

// Draw canvas event handlers
keep.addEventListener("click", function() {
	drawCanvas.setColor("green")
})
cut.addEventListener("click", function() {
	drawCanvas.setColor("red")
})
clear.addEventListener("click", function() {
	drawCanvas.eraseAll()
})

show.addEventListener("click", function() {
	loadImage();
}, { passive: true });
segment.addEventListener("click", function() {
	drawSuperPixels();
}, {passive: true });


function loadImage() {
	var file = uploader.files[0];
	var reader = new FileReader();

	reader.onloadend = function() {
		var img = new Image();

		img.onload = function() {
			srcc.width = img.width / down_size;
			srcc.height = img.height / down_size;
			sctx.drawImage(img, 0, 0, srcc.width, srcc.height);
			
			mask.width = srcc.width;
			mask.height = srcc.height;

			// init mask drawing 
			drawCanvas.init(mask);

			// show keep, cut, clear, segment and edge controls
			scontrols.style.display = "inherit";
		};
		img.src = reader.result;
	};

	if (file) reader.readAsDataURL(file);
}

function drawSuperPixels() {
	var srcImageData = sctx.getImageData(0, 0, srcc.width, srcc.height);
	var options = {
		regionSize: ((srcc.width + srcc.height) / 2 / 10),
		callback: function(results) {
			results = renderSuperPixels(results);
			results = renderCrop(results);
			console.log('results', results);

			outc.width = results.width;
			outc.height = results.height;

			var outImageData = octx.createImageData(outc.width, outc.height);
			var srcImageData = sctx.getImageData(0, 0, srcc.width, srcc.height);

			// create reference variable that is mutable
			var odata = outImageData.data;
			var sdata = srcImageData.data;

			var showEdges = edges.checked || false;
			var showCrop = crop.checked || false;
			var showSuperPixels = spixels.checked || false;

			for(var i = 0; i < results.indexMap.length; ++i) {
				var seg = results.segments[results.indexMap[i]];

                odata[4 * i + 3] = 255;
				if(showCrop) {
					if(seg.cut) odata[4 * i + 3] = 0;
					if(seg.mixed) odata[4 * i + 3] = 0;
				}
				if(showEdges && results.indexMap[i] != results.indexMap[i + 1]) {
					odata[4 * i + 0] = 0;	
					odata[4 * i + 1] = 0;	
					odata[4 * i + 2] = 0;	
					odata[4 * i + 3] = 255;
				} else if(showSuperPixels) {
					odata[4 * i + 0] = seg.mp[0];
					odata[4 * i + 1] = seg.mp[1];
					odata[4 * i + 2] = seg.mp[2];
				} else {
					odata[4 * i + 0] = sdata[4 * i + 0];
					odata[4 * i + 1] = sdata[4 * i + 1];
					odata[4 * i + 2] = sdata[4 * i + 2];
				}

			}
			octx.putImageData(outImageData, 0, 0);
		},
    };
	SLICSuperPixels(srcImageData, options);
}

// calculates the average rgba of each superpixel
function renderSuperPixels(results) {
	results.segments = {};
    
	var l = results.indexMap.length;
	for (var i = 0; i < l; ++i) {
		var current = results.indexMap[i];
		if (!results.segments.hasOwnProperty(current)) {
			results.segments[current] = {
				count: 0,
				mp: [0, 0, 0]
			};
        }
        
		results.segments[current].count += 1;
		results.segments[current].mp[0] += results.rgbData[4 * i + 0]
		results.segments[current].mp[1] += results.rgbData[4 * i + 1]
        results.segments[current].mp[2] += results.rgbData[4 * i + 2]
	}
	for (var s in results.segments) {
		results.segments[s].mp[0] = results.segments[s].mp[0] / results.segments[s].count
		results.segments[s].mp[1] = results.segments[s].mp[1] / results.segments[s].count
		results.segments[s].mp[2] = results.segments[s].mp[2] / results.segments[s].count

		// // log edges of superpixel
		// results.segments[s].edges = {}
		// for(var a in results.segments) {
		// 	results.segments[s].edges[a] = 0
		// 	if(s != a) results.segments[s].edges[a] = 1
		// }
	}
	return results;
}

// classify each superpixel as keep/cut/mixed/unknown
function renderCrop(results) {
	var mask_data = mctx.getImageData(0, 0, mask.width, mask.height)
	var segments = results.segments
	var l = results.indexMap.length
	results.cut 	= []
	results.keep 	= []
	results.mixed 	= []
	results.unknown = []

	for(var s in segments) {
		var seg = segments[s]
		seg.mask = { 'c': 0, 'k': 0 }
		seg.cut 	= false;
		seg.keep 	= false;
		seg.mixed 	= false;
		seg.unknown = false;
	}

	// label segments as cut/keep
	for(var i = 0; i < l; i++) {
		var current = results.indexMap[i]
        if(mask_data.data[4 * i + 0] > 0) {
			results.segments[current].mask.c = 1;
		} 
        if(mask_data.data[4 * i + 1] > 0) {
			results.segments[current].mask.k = 1;
		}
	}

	// classify pixels as cut/keep/mixed/unknown
	for(var s in segments) {
		var seg = segments[s]

		if(seg.mask.k > 0 && seg.mask.c == 0) {
			seg.keep = true
			results.keep.push(s)
		}
		else if(seg.mask.c > 0 && seg.mask.k == 0) {
			seg.cut = true
			results.cut.push(s)
		}
		else if(seg.mask.k > 0 && seg.mask.c > 0) {
			seg.mixed = true
			results.mixed.push(s)
		}
		else {
			seg.unknown = true
			results.unknown.push(s)
		}
		results.segments[s] = seg
	}
	
	if(results.unknown.length > 0) {
		results = labelUnknownPixels(results)
	}

	return results
}

// use visual color distance to decide if
function labelUnknownPixels(results) {
	var segments = results.segments;

	// have to have cut and keep references
	if(results.cut.length == 0 || results.keep.length == 0) return results;

	for(var i = 0; i < results.unknown.length; i++) {
		var seg = segments[results.unknown[i]];

		var keepList = results.keep.map(function(index) {
			return pixelDiff(segments[index].mp, seg.mp);
		});
		var cutList = results.cut.map(function(index) {
			return pixelDiff(segments[index].mp, seg.mp);
		});

		var keepDist = Math.min.apply(null, keepList);
		var cutDist = Math.min.apply(null, cutList);

		if(keepDist > cutDist) {
			seg.keep = true;
			results.keep.push(results.unknown[i])
		} else {
			seg.cut = true;
			results.cut.push(results.unknown[i])
		}

		results.keep.sort(function(a, b) {
			return parseInt(a) - parseInt(b)
		})
		results.cut.sort(function(a, b) {
			return parseInt(a) - parseInt(b)
		})
		results.unknown.sort(function(a, b) {
			return parseInt(a) - parseInt(b)
		})
		// results.unknown.shift()
	}

	return results;
}
