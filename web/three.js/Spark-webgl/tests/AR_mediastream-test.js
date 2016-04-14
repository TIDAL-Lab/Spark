function JsArTest() {
	if (!Detector.webgl) {
		$('#loading').hide();
		$('#nowebgl').hide();
		return;
	}
    
    threshold = 128;

	// Set this to true and the JSARToolkit will output some debug information to
	// the console and copy a visualisation of its analysis results to the
	// debugCanvas.
    DEBUG = false;
    if (DEBUG) {
        $("#debugCanvas").show();
    }

    var width = 320;
    var height = 240;

    // Set up the JSARToolkit detector...
    // ...this is what analyses the canvas images for AR markers
    // (You can adjust markerWidth so that your objects appear
    // the right size relative to your markers)
    var markerWidth = 10;
    var parameters = new FLARParam(width, height);
    var detector = new FLARMultiIdMarkerDetector(parameters, markerWidth);

    // The three.js camera for rendering the overlay on the input images
    // (We need to give it the same projection matrix as the detector
    // so the overlay will line up with what the detector is 'seeing')
    var overlayCamera = new THREE.Camera();
    overlayCamera.setJsArMatrix(parameters);

    // Now, set up the rest of the overlay scene just like any other
    // three.js scene...(renderer, light source, and 3D objects)
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width * 2, height * 2);
    //$('#result').append(renderer.domElement);
    document.body.appendChild( renderer.domElement );

    var ambientLight = new THREE.AmbientLight(0x555555);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0.3, 0.5, 2);
    overlayCamera.add(directionalLight);

    
    // now draw the particle system in a box
    // first draw the container (box)
    var red = 0xD11919;
    var green = 0x008F00;
    var gray = 0x808080;
    var blue = 0x000099;
    var batteryImg = THREE.ImageUtils.loadTexture( "textures/battery3t.png" );
    var cubeLength = 20;
    var cubeWidth = 10;
    var cubeGeometry = new THREE.BoxGeometry(cubeLength, cubeWidth, 5);
    // var cubeMaterial = new THREE.MeshBasicMaterial( { map: batteryImg } );
    var cubeMaterial = new THREE.MeshBasicMaterial();
    cubeMaterial.transparent = true;
    cubeMaterial.opacity = 0.9;
    cubeMaterial.depthWrite = false;
    var cube = new THREE.Mesh( cubeGeometry, cubeMaterial ); 
    cube.material.side = THREE.BackSide;
    
    var sphereGeometry = new THREE.SphereGeometry(cubeWidth/2, 16, 16);
    // var cubeMaterial = new THREE.MeshBasicMaterial( { map: batteryImg } );
    var sphereMaterial = new THREE.MeshBasicMaterial( { color: green });
    sphereMaterial.transparent = true;
    sphereMaterial.opacity = 0.9;
    sphereMaterial.depthWrite = false;
    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
    sphere.position.set(10, 0, 0);

    var sphere2 = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
    sphere2.position.set(-10, 0, 0);
    
    // now add the particle system (electrons)
    electronGeometry = new THREE.Geometry();
    for ( i = 0; i < 20; i ++ ) {

        var electron = new THREE.Vector3();
        // I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
        electron.x = Math.random() * (cubeLength - 1) - (cubeLength - 1) /2; //the x coordinate changes based on component length 
        electron.y = Math.random() * (cubeWidth - 1) - (cubeWidth - 1)/2; // component width 
        electron.z = 0;

        //translate the electron to be inside the component
        // ATTENTION: this seems to be unnecessary here, at least for now 
        //cube.localToWorld(electron); // this changes the position of electron from local to world
        var velocity = 1;
        var vX = Math.random() * velocity * 2 - velocity;
        var vY = Math.sqrt( velocity * velocity - vX*vX);   // this results in a constant velocity 
        electron.velocity = new THREE.Vector3(
            vX,     // x
            vY,     //  
            0);     // z
        electronGeometry.vertices.push( electron );
    }

    var electronBall = THREE.ImageUtils.loadTexture( "textures/ball.png" );
    electronMaterial = new THREE.PointCloudMaterial( { size: 5, map: electronBall, color: blue , transparent: true } );
    electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );
    cube.add(electrons);
    cube.add(sphere);
    cube.add(sphere2);
   
    cube.matrixAutoUpdate = false;
    //sphere.matrixAutoUpdate = false;
    //electrons.matrixAutoUpdate = false;

    $('#loading').hide();
    // Then put the scene together.
    var overlayScene = new THREE.Scene();
    overlayScene.add(ambientLight);
    //overlayScene.add(sphere);
    overlayScene.add(cube);
    //overlayScene.add( electrons );
    
    overlayScene.add(overlayCamera);

    // This is the canvas that we draw our input image on & pass
    // to the detector to analyse for markers...
    var inputCapture = $('#inputCapture')[0];
	
    // Set up another three.js scene that just draws the inputCapture...
    var inputCamera = new THREE.Camera();
    var inputScene = new THREE.Scene();
    var inputTexture = new THREE.Texture(inputCapture);
    var inputPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 0), new THREE.MeshBasicMaterial({ map: inputTexture }));
    inputPlane.material.depthTest = false;
    inputPlane.material.depthWrite = false;
    inputScene.add(inputPlane);
    inputScene.add(inputCamera);

    // This JSARToolkit object reads image data from the input canvas...
    var imageReader = new NyARRgbRaster_Canvas2D(inputCapture);

    // ...and we'll store matrix information about the detected markers here.
    var resultMatrix = new NyARTransMatResult();

    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || function (type, success, error) { error(); };

	// Get permission to use the webcam video stream as input to the detector
	// (Otherwise we can fallback to a static image for the input)
    var input;
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
        inputCapture.getContext('2d').drawImage(input, 0, 0, width, height);

        // then we need to tell the image reader and the input scene that the input has changed
        inputCapture.changed = true;
        inputTexture.needsUpdate = true;

        // Use the imageReader to detect the markers
        // (The 2nd parameter is a threshold)
        if (detector.detectMarkerLite(imageReader, threshold) > 0) {
            // If any markers were detected, get the transform matrix of the first one
            detector.getTransformMatrix(0, resultMatrix);

            // and use it to transform our three.js object

            cube.setJsArMatrix(resultMatrix);
            cube.matrixWorldNeedsUpdate = true;

            //electrons.setJsArMatrix(resultMatrix);
            //electrons.matrixWorldNeedsUpdate = true;
        }

        // Render the three.js scenes (the input image first overlaid with the
        // scene containing the transformed object)
        //updateElectrons(electrons, cube);
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(inputScene, inputCamera);
        renderer.render(overlayScene, overlayCamera);
    });
}

function updateElectrons(electrons, box) {
    var eVertices = electrons.geometry.vertices;
    for ( k = 0; k < eVertices.length; k++ ) {
        var electron = eVertices[k];
        var obstacle = collision(electron, box);
        if (obstacle == null) {     // no colision
            moveElectron(electron);
        }
        else {
            bounceBack(electron, obstacle);
        }                                                                   
    }
    electrons.geometry.verticesNeedUpdate = true;
}

function collision( electron, box ) {
        var ray = new THREE.Vector3(electron.velocity.x, electron.velocity.y, electron.velocity.z);
        var raycaster = new THREE.Raycaster();
        ray = ray.normalize(); // sends a normalized ray in the direction of moving particle and detect obstacles
        raycaster.set(electron, ray);
        //var distance = 10;
        raycaster.near = 0;
        raycaster.far = 10;
        var collisions = raycaster.intersectObject(box);
        // if (collisions.length > 0 && collisions[0].distance <= distance) {
        if ( collisions.length > 0 ) {  
            return collisions[0];
         }
         else {
            return null;
         }
    }

function bounceBack(electron, obstacle) {       // no use for type, remove it!
        var n = obstacle.face.normal;
        n.z = 0; // we just want the image of the normal vector on the XY plane with Z = 0
        var localVelocity = new THREE.Vector3(); 
        localVelocity.copy(electron.velocity);
        localVelocity.applyAxisAngle(new THREE.Vector3(0, 0, -1), this.rotationAngle);
        //this.boxMesh.worldToLocal(localVelocity);

        var theta = localVelocity.angleTo(n);
        var Beta = (2 * theta) - Math.PI ;
        var rotationAxis = new THREE.Vector3(); // 
        rotationAxis.crossVectors( localVelocity, n );
        if (Beta == Math.PI/2) {    // if velocity is tangential to the ion sphere
            moveElectron(electron);
        }
        if (rotationAxis.length() == 0) {   // if Beta is 180 degrees the cross vector is zero, set rotation axis to z axis (sign does not matter anymore)
            rotationAxis = (0,0,1);
        }
        else {
            rotationAxis = rotationAxis.normalize(); 
        }
        //rotationAxis = rotationAxis.normalize();
        electron.velocity.applyAxisAngle( rotationAxis, Beta );
    }     

function moveElectron(electron) {
            // update velocity
            //electron.velocity.x += this.forceX;
            //electron.velocity.y += this.forceY;
            var v = Math.sqrt(electron.velocity.x * electron.velocity.x + 
                                electron.velocity.y * electron.velocity.y);

            if (v > 8) {    // don't allow the speed to become more than 10, which is the distance for raycaster
                
                //electron.velocity.x -= this.forceX;
                //electron.velocity.y -= this.forceY;
            }

            // move the electron
            electron.x += electron.velocity.x; 
            electron.y += electron.velocity.y;
    }  
