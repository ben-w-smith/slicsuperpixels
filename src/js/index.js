import "../sass/main.scss"
var SLICSuperPixels = require("./SLICSuperPixels")
var pixelDiff = require('./pixelDiff')
var drawCanvas = require('./drawCanvas')

//----------------------
// Not library code
//----------------------

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

// canvas stuff
var srcc = document.getElementById("src");
var mask = document.getElementById("mask");
var outc = document.getElementById("out");
var sctx = srcc.getContext("2d");
var mctx = mask.getContext("2d");
var octx = outc.getContext("2d");

keep.addEventListener("click", function() {
	drawCanvas.setColor = "green"
})
cut.addEventListener("click", function() {
	drawCanvas.setColor = "red"
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
			srcc.width = img.width / 2;
			srcc.height = img.height / 2;
			sctx.drawImage(img, 0, 0, srcc.width, srcc.height);
			
			mask.width = srcc.width;
			mask.height = srcc.height;
			drawCanvas.init(mask);

			// show keep, cut, clear, segment and edge controls
			scontrols.style.display = "inherit";
		};
		img.src = reader.result;
	};

	if (file) reader.readAsDataURL(file);
}

function drawSuperPixels() {
	var imageData = sctx.getImageData(0, 0, srcc.width, srcc.height);
	var options = {
		callback: function(results) {
			results = callbackSegmentation(results);
			console.log('results', results);
			outc.width = results.width;
			outc.height = results.height;
			var imageData = octx.createImageData(outc.width, outc.height);
			var data = imageData.data;
			var seg;
			var showEdges = edges.checked;
			for(var i = 0; i < results.indexMap.length; ++i) {
				seg = results.segments[results.indexMap[i]];
				if(showEdges && results.indexMap[i] != results.indexMap[i + 1]) {
					data[4 * i + 0] = 255;	
					data[4 * i + 1] = 255;	
					data[4 * i + 2] = 255;	
				} else {
					data[4 * i + 0] = seg.mp[0];	
					data[4 * i + 1] = seg.mp[1];	
					data[4 * i + 2] = seg.mp[2];	
				}
                data[4 * i + 3] = 255;
			}
			// imageData.data = data;
			octx.putImageData(imageData, 0, 0);
		}
    };
	SLICSuperPixels(imageData, options);
}

function callbackSegmentation(results) {
    results.segments = {};
    
    var mask_data = mctx.getImageData(0, 0, mask.width, mask.height)

	var w = results.width;
	var h = results.height;
	var l = results.indexMap.length;
	for (var i = 0; i < l; ++i) {
		var current = results.indexMap[i];
		if (!results.segments.hasOwnProperty(current)) {
			results.segments[current] = {
				mask: { cut: 0, keep: 0 },
				count: 0,
				mp: [0, 0, 0]
			};
        }
        
		results.segments[current].count += 1;
		results.segments[current].mp[0] += results.rgbData[4 * i + 0];
		results.segments[current].mp[1] += results.rgbData[4 * i + 1];
        results.segments[current].mp[2] += results.rgbData[4 * i + 2];
        
        if(mask_data.data[4 * i + 0] > 0) results.segments[current].mask.cut = 1;
        if(mask_data.data[4 * i + 1] > 0) results.segments[current].mask.keep = 1;
	}
	for (var s in results.segments) {
		results.segments[s].mp[0] = results.segments[s].mp[0] / results.segments[s].count;
		results.segments[s].mp[1] = results.segments[s].mp[1] / results.segments[s].count;
		results.segments[s].mp[2] = results.segments[s].mp[2] / results.segments[s].count;
	}
	return results;
}

