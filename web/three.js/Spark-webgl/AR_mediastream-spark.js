/*
 * Spark - Agent-based electrical circuit environment
 *
 * Elham Beheshti, 2015
 * Northwestern University
 * beheshti@u.northwestern.edu
 *
 * Spark is an interactive learning environment in which users interact with electrical circuits at two levels: 
 * Circuit-level and the level that shows interactions between electrons and ions as they move through circuit components.
 * This project has been conducted in TIDAL lab (Tangible Interaction Design and Learning Lab) at Northwestern University.
 */


var parameters, detector;
var imageReader, resultMatrix;
var input;
var inputWidth = 320;
var inputHeight = 240;
var inputCapture, inputTexture, inputPlane;

function JsArInit() {
    $('#loading').hide();
    threshold = 128;

	// Set this to true and the JSARToolkit will output some debug information to
	// the console and copy a visualisation of its analysis results to the
	// debugCanvas.
    DEBUG = false;
    if (DEBUG) {
        $("#debugCanvas").show();
    }

    // Set up the JSARToolkit detector...
    // ...this is what analyses the canvas images for AR markers
    // (You can adjust markerWidth so that your objects appear
    // the right size relative to your markers)
    var markerWidth = 120;
    parameters = new FLARParam( inputWidth, inputHeight );
    detector = new FLARMultiIdMarkerDetector(parameters, markerWidth);

    // The three.js camera for rendering the overlay on the input images
    // (We need to give it the same projection matrix as the detector
    // so the overlay will line up with what the detector is 'seeing')
    camera.setJsArMatrix(parameters);
    
    // This is the canvas that we draw our input image on & pass
    // to the detector to analyse for markers...
    inputCapture = $('#inputCapture')[0];
	
    // Set up another three.js scene that just draws the inputCapture...
    inputCamera = new THREE.Camera();
    inputScene = new THREE.Scene();
    inputTexture = new THREE.Texture(inputCapture);
    inputPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 0), new THREE.MeshBasicMaterial({ map: inputTexture }));
    inputPlane.material.depthTest = false;
    inputPlane.material.depthWrite = false;
    inputScene.add(inputPlane);
    inputScene.add(inputCamera);

    // This JSARToolkit object reads image data from the input canvas...
    imageReader = new NyARRgbRaster_Canvas2D(inputCapture);

    // ...and we'll store matrix information about the detected markers here.
    resultMatrix = new NyARTransMatResult();

    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || function (type, success, error) { error(); };

    // Get permission to use the webcam video stream as input to the detector
    // (Otherwise we can fallback to a static image for the input)
    
    navigator.getUserMedia({ 'video': true }, function (stream) {
        input = $('#inputStream')[0];
        input.src = window.URL.createObjectURL(stream);
        // Start the animation loop (see below)
        jsFrames.start();
    }, function () {
        alert("Couldn't access webcam. Fallback to static image");
        input = $('#inputImage')[0];
        jsFrames.start();
    });

    // The animation loop...
    // (jsFrames comes from here - https://github.com/ianreah/jsFrames
    // but it's mostly just requestAnimationFrame wrapped up with a
    // polyfill)
    jsFrames.registerAnimation(function () {
        // Capture the current frame from the inputStream
        inputCapture.getContext('2d').drawImage(input, 0, 0, inputWidth, inputHeight);

        // then we need to tell the image reader and the input scene that the input has changed
        inputCapture.changed = true;
        inputTexture.needsUpdate = true;

        // Use the imageReader to detect the markers
        // (The 2nd parameter is a threshold)
        if (detector.detectMarkerLite(imageReader, threshold) > 0) {
            // If any markers were detected, get the transform matrix of the first one
            detector.getTransformMatrix(0, resultMatrix);

            allComponentsMesh.setJsArMatrix(resultMatrix);
            allComponentsMesh.matrixWorldNeedsUpdate = true;
            // and use it to transform our three.js object
            electrons.setJsArMatrix(resultMatrix);
            electrons.matrixWorldNeedsUpdate = true;



/*            var component = components[0];
            
            component.boxMesh.setJsArMatrix(resultMatrix);
            component.boxMesh.matrixWorldNeedsUpdate = true;*/



        }



    });
 }  

 function JsArAnimate() {

} 

