/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
    Based on http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html
 */

// MAIN

// // standard global variables
// // var keyboard = new THREEx.KeyboardState();
// var clock = new THREE.Clock();
// // custom global variables
// var cube;
// // assign global variables to HTML elements
// var video = document.getElementById( 'monitor' );
// var videoCanvas = document.getElementById( 'videoCanvas' );
// var videoContext = videoCanvas.getContext( '2d' );

// var layer2Canvas = document.getElementById( 'layer2' );
// var layer2Context = layer2Canvas.getContext( '2d' );

// var blendCanvas  = document.getElementById( "blendCanvas" );
// var blendContext = blendCanvas.getContext('2d');
	
// var messageArea = document.getElementById( "messageArea" );

// var buttons;
// var lastImageData;


function blend() 
{
	var width  = videoCanvas.width;
	var height = videoCanvas.height;
	// get current webcam image data
	var sourceData = videoContext.getImageData(0, 0, width, height);
	// create an image if the previous image doesn't exist
	if (!lastImageData) lastImageData = videoContext.getImageData(0, 0, width, height);
	// create a ImageData instance to receive the blended result
	var blendedData = videoContext.createImageData(width, height);
	// blend the 2 images
	differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
	// draw the result in a canvas
	blendContext.putImageData(blendedData, 0, 0);
	// store the current webcam image
	lastImageData = sourceData;
}

function differenceAccuracy(target, data1, data2) 
{
	if (data1.length != data2.length) return null;
	var i = 0;
	while (i < (data1.length * 0.25)) 
	{
		var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
		var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
		var diff = threshold(fastAbs(average1 - average2));
		target[4*i]   = diff;
		target[4*i+1] = diff;
		target[4*i+2] = diff;
		target[4*i+3] = 0xFF;
		++i;
	}
}
function fastAbs(value) 
{
	return (value ^ (value >> 31)) - (value >> 31);
}
function threshold(value) 
{
	return (value > 0x15) ? 0xFF : 0;
}

// check if white region from blend overlaps area of interest (e.g. triggers)
function checkAreas() {}
