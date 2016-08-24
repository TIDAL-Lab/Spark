var markerRootParent;
var arController;
var arScale;
var markerID;
var arRenderFlag = true;

var barcodeMarker = false;  // either barcode marker or pattern marker
//window.ARThreeOnLoad = function() {
function JsArInit() {
	ARController.getUserMediaThreeScene({maxARVideoSize: 800, cameraParam: 'lib/jsartoolkit5-master/examples/Data/camera_para.dat', 
	onSuccess: function(arScene, arController, arCamera) {
		
		scene = arScene.scene;
		camera = arScene.camera;
		arController = arController;
		raycaster = new THREE.Raycaster();

		// Create a couple of lights for our AR scene.
		var light = new THREE.PointLight(0xffffff);
		light.position.set(400, 500, 100);
		scene.add(light);
		var light = new THREE.PointLight(0xffffff);
		light.position.set(-400, -500, -100);
		scene.add(light);

		// set the scale based on the markerwidth = 1 
		arScale = 100;
		markerID = 56;
		markerRoot = new THREE.Mesh();
		// Testing Barcode marker: See artoolkit5/doc/patterns/Matrix code 3x3 (72dpi)/20.png
		if (barcodeMarker) {
			markerRootParent = arController.createThreeBarcodeMarker(markerID, 1);	
			markerLoaded = true;		
			initComponents();
			markerRootParent.add(markerRoot);
			scene.add(markerRootParent);

			arController.setPatternDetectionMode(artoolkit.AR_MATRIX_CODE_DETECTION);
		}

		else {
			var markerLoaded = false;
			// Testing Pattern marker:
			arController.loadMarker('markers/spark16v3.pat', function(markerId) {
				markerLoaded = true;
				console.log(markerId);
				markerID = markerId;
				markerRootParent = arController.createThreeMarker(markerId);			
				initComponents();
				markerRootParent.add(markerRoot);
				scene.add(markerRootParent);
			});
		}

		//EB: set width and height of renderer
		arController.videoWidth = modelWidth;
		arController.videoHeight = modelHeight;

		document.body.className = arController.orientation;		

		var renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setClearColor ( backgroundBlue ); 			//bluish background color
		renderer.setPixelRatio( window.devicePixelRatio );
		
		// EB: removed the settings for mobile and portrait orientations
		renderer.setSize(arController.videoWidth, arController.videoHeight);
		//if (twoScreen) renderer.setViewport ( 0, 0, window.innerWidth, window.innerHeight );
		document.body.className += ' desktop';

		var container = document.querySelector("#container");
		container.appendChild(renderer.domElement);
		//document.body.insertBefore(renderer.domElement, document.body.firstChild);

		//CONTROLS
		controls = new THREE.EditorControls( camera, renderer.domElement );


		// if a marker is detected, enable updatingElectrons() to fire.
		arController.addEventListener('getMarker', function(ev) {
			if (ev.data.marker.id == markerID) {   
				markerDetectedFlag = true;
				arRenderFlag = true;
			}
		});

		var tick = function() {
			if (markerLoaded) {   // the flag is for using pattern markers
				markerRoot.scale.set(1/arScale, 1/arScale, 1/arScale);
				electronVertices.material.size /= arScale;
				markerRoot.updateMatrixWorld();				
				markerDetectedFlag = false;
				if (!freezeFlag) arScene.process();
				arScene.renderOn(renderer);
				if (!updateFlag && !stop) {
					markerRoot.scale.set(1, 1, 1);
					electronVertices.material.size *= arScale;
					markerRoot.updateMatrixWorld();
	        		if (freezeFlag || markerDetectedFlag) updateElectrons(); // update electrons only when a marker is detected or if it is freezed
	    		}
	    	}
			requestAnimationFrame(tick);
		};

		tick();

	}});

	delete window.ARThreeOnLoad;

}


if (window.ARController && ARController.getUserMediaThreeScene) {
	//ARThreeOnLoad();
}

function updateAR() {
	scene.remove(markerRootParent);
	markerRootParent.remove(markerRoot);
	arRenderFlag = false;
	initComponents();
	markerRootParent.add(markerRoot);
	scene.add(markerRootParent);	
}