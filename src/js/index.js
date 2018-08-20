import "../sass/main.scss"
var SLICSuperPixels = require("./SLICSuperPixels")

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

// variables
var mask_color = "green"
var mask_width = 2
var mask_drawing = false
var prevx = 0
var prevy = 0
var currx = 0
var curry = 0
var mask_events = [
    { 
        event: "mousemove",
        action: "move",
    },
    {
        event: "mousedown",
        action: "down",
    },
    {
        event: "mouseup",
        action: "up",
    },
    {
        event: "mouseout",
        action: "out",
    },
]

mask_events.forEach(function(mevent) {
    mask.addEventListener(mevent.event, function(e) {
        findxy(mevent.action, e)
    }, false)
})

keep.addEventListener("click", function() {
    mask_color = "green"
})
cut.addEventListener("click", function() {
    mask_color = "red"
})
clear.addEventListener("click", function() {
    mctx.clearRect(0, 0, mask.width, mask.height)
})

function draw_mask() {
    mctx.beginPath()
    mctx.moveTo(prevx, prevy)
    mctx.lineTo(currx, curry)
    mctx.strokeStyle = mask_color
    mctx.lineWidth = mask_width
    mctx.stroke()
    mctx.closePath()
}

function findxy(action, e) {
    if(action == 'up' || action == 'out') {
        mask_drawing = false
        return
    }

    prevx = currx
    prevy = curry
    currx = e.clientX - mask.offsetParent.offsetLeft
    curry = e.clientY - mask.offsetParent.offsetTop

    if(action == 'down') {
        mask_drawing = true 

        mctx.beginPath() 
        mctx.fillStyle = mask_color 
        mctx.fillRect(currx, curry, mask_width, mask_width) 
        mctx.closePath() 
    }

    if(action == 'move' && mask_drawing) {
        draw_mask()
    }
}

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

