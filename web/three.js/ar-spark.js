var markerRootParent;
var arController;
var arScale;
var markerID;
//window.ARThreeOnLoad = function() {
function JsArInit() {
	ARController.getUserMediaThreeScene({maxARVideoSize: 800, cameraParam: 'lib/jsartoolkit5-master/examples/Data/camera_para.dat', 
	onSuccess: function(arScene, arController, arCamera) {
		// temp
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
		// Testing Barcode marker: See artoolkit5/doc/patterns/Matrix code 3x3 (72dpi)/20.png
		markerRootParent = arController.createThreeBarcodeMarker(markerID, 1);
		markerRoot = new THREE.Mesh();
		initComponents();
		markerRootParent.add(markerRoot);
		scene.add(markerRootParent);

		arController.setPatternDetectionMode(artoolkit.AR_MATRIX_CODE_DETECTION);

		// markerRoot = new THREE.Mesh();
		// var markerLoaded = false;
		// // Testing Pattern marker:
		// arController.loadMarker('lib/jsartoolkit5-master/examples/Data/patt.hiro', function(markerId) {
		// 	markerLoaded = true;
		// 	markerRootParent = arController.createThreeMarker(markerId);			
		// 	initComponents();
		// 	markerRootParent.add(markerRoot);
		// 	scene.add(markerRootParent);
		// });

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
		//controls = new THREE.OrbitControls( camera, renderer.domElement );
		controls = new THREE.EditorControls( camera, renderer.domElement );

		// renderer.domElement.addEventListener('click', function(ev) {
		// 	ev.preventDefault();
		// 	console.log("touched");
		// }, false);
		// arController.setProjectionNearPlane(1);
		// arController.setProjectionFarPlane(10000);
		console.log("near", arController.getProjectionNearPlane());
		console.log("far", arController.getProjectionFarPlane());

		// if a marker is detected, enable updatingElectrons() to fire.
		arController.addEventListener('getMarker', function(ev) {
			if (ev.data.marker.id == markerID) {   
				markerDetectedFlag = true;
				//console.log("camera: ", camera.position);
				//console.log("controller getcameramatrix: ", arController.getCameraMatrix());
				//console.log("Detected marker with ids:", ev.data.marker.id, ev.data.marker.idPatt, ev.data.marker.idMatrix);
				//console.log("Marker data", ev.data.marker);
				//console.log("Marker transform matrix:", [].join.call(ev.data.matrix, ', '));
			}
		});

		var tick = function() {
			//if (markerLoaded) {   // the flag is for using pattern markers
				markerRoot.scale.set(1/arScale, 1/arScale, 1/arScale);
				electronVertices.material.size /= arScale;
				markerRoot.updateMatrixWorld();
				//markerRoot.matrixWorldNeedsUpdate = true;
				markerDetectedFlag = false;
				if (!freezeFlag) arScene.process();
				arScene.renderOn(renderer);
				if (!updateFlag && !stop) {
					markerRoot.scale.set(1, 1, 1);
					electronVertices.material.size *= arScale;
					markerRoot.updateMatrixWorld();
					//markerRoot.matrixWorldNeedsUpdate = true;
	        		if (freezeFlag || markerDetectedFlag) updateElectrons(); // update electrons only when a marker is detected or if it is freezed
	    		}
	    	//}
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
	//markerRootParent = arController.createThreeBarcodeMarker(20, 1);
	scene.remove(markerRootParent);
	initComponents();
	markerRootParent.add(markerRoot);
	scene.add(markerRootParent);
}

var createBox = function() {
	// The AR scene.
	//
	// The box object is going to be placed on top of the marker in the video.
	// I'm adding it to the markerRoot object and when the markerRoot moves,
	// the box and its children move with it.
	//
	var box = new THREE.Object3D();
	var boxWall = new THREE.Mesh(
		new THREE.BoxGeometry(100, 100, 1, 1, 1, 1),
		new THREE.MeshBasicMaterial({color: orange})
	);
	boxWall.material.transparent = true;
	boxWall.material.opacity = 0.8;
	
	boxWall.position.z = -50;
	box.add(boxWall);

	boxWall = boxWall.clone();
	boxWall.position.z = +50;
	//box.add(boxWall);

	boxWall = boxWall.clone();
	boxWall.position.z = 0;
	boxWall.position.x = -50;
	boxWall.rotation.y = Math.PI/2;
	box.add(boxWall);

	boxWall = boxWall.clone();
	boxWall.position.x = +50;
	box.add(boxWall);

	boxWall = boxWall.clone();
	boxWall.position.x = 0;
	boxWall.position.y = -50;
	boxWall.rotation.y = 0;
	boxWall.rotation.x = Math.PI/2;
	box.add(boxWall);

	// Keep track of the box walls to test if the mouse clicks happen on top of them.
	var walls = box.children.slice();

	// Create a pivot for the lid of the box to make it rotate around its "hinge".
	var pivot = new THREE.Object3D();
	pivot.position.y = 50;
	pivot.position.x = 50;

	// The lid of the box is attached to the pivot and the pivot is attached to the box.
	boxWall = boxWall.clone();
	boxWall.position.y = 0;
	boxWall.position.x = -50;
	pivot.add(boxWall);
	box.add(pivot);

	walls.push(boxWall);

	box.position.z = 50;
	//box.rotation.x = Math.PI/2;

	box.open = false;

	box.tick = function() {
		// Animate the box lid to open rotation or closed rotation, depending on the value of the open variable.
		pivot.rotation.z += ((box.open ? -Math.PI/1.5 : 0) - pivot.rotation.z) * 0.1;
	};

	return {box: box, walls: walls};
};