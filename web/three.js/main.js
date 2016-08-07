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

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// Static flags
var ArFlag = false;
var twoScreen = false;
var twoD = true; //electron movement is either 2D (z=0) or 3D

// Dynamic FLAGS
var updateFlag = false;  //(launch): when updating the circuit, updateFlag = true => pause the rendering while the circuit object is being parsed
var markerDetectedFlag = false;  //not being used now
var freezeFlag = false;

var WIDTH_RATIO;

// COLORS:
var red = 0xDA4747;
var darkRed = 0x990000;
var green = 0x008F00;
var lightGreen = 0xbfff80;
var darkGreen = 0x003300;
var gray = 0x808080;
var midnightBlue = 0x000099;
var blue = 0x337586;
var backgroundBlue = 0x5C919E;
var orange = 0xFF9900;
var darkOrange = 0xFF6600;
var lightGray = 0xB2B2B2;

var container;
var camera, scene, renderer, controls;
var inputScene, inputCamera;
var pointLight;
var mouseX = 0, mouseY = 0;
var sphere; //image element for particles
var batteryImg, resistorImg;
var components = []; // an array of components
var electronVertices, electronGeometry, electronMaterial;
var electronObjects = [];
var raycaster;
//var compositeMesh;

var ticks = 0;


var markerRoot;  // the parent object of all the components and electrons for AR transformations

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var clickedComponent = null;   // the component that is tapped on to show information

function doInit() {	
	if (twoScreen) {
		WIDTH_RATIO = 0.65;	
		var width = window.innerWidth;
		var height = window.innerHeight;
		var h = height;
		var w = width*(1-WIDTH_RATIO);

		var helpDiv = document.querySelector("#help-window");
		helpDiv.style.width = w.toString() + "px";
		helpDiv.style.height = h.toString() + "px";

	}
	else {
		WIDTH_RATIO = 1;
		var helpDiv = document.querySelector("#help-window");
		helpDiv.style.display = "none";
	}

	init();
	if (ArFlag) JsArInit();
	if (!ArFlag) animate(); //for non-AR condition; for AR condition the jsFrames.registerAnimation() function is used 
}

function init() {
	//sphere = new THREE.TextureLoader().load( "textures/ball.png" ); // this works for three.js-r75 (latest revision) 
	sphere = THREE.ImageUtils.loadTexture( "textures/ball.png" );
	batteryImg = THREE.ImageUtils.loadTexture( "textures/battery3t-twin.png" ); // later: study the difference b/w ImageLoader and TexutreLoader
	resistorImg = THREE.ImageUtils.loadTexture( "textures/resistor2t.png" );	
	//container = document.createElement( 'div' );
	//document.body.appendChild( container );

	if (ArFlag) { 
		//camera = new THREE.Camera(); 
		//camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
		camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 10000 );
		camera.position.z = 900;
	}
	else {
		camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 10000 );
		//camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
		camera.position.z = 700;	
	}

	raycaster = new THREE.Raycaster();
	scene = new THREE.Scene();
	
	THREE.ImageUtils.crossOrigin = 'anonymous';  	// enables using images from the image folder

	initComponents();

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor ( backgroundBlue ); 			//bluish background color
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth , window.innerHeight );

	//if (twoScreen) renderer.setViewport ( 0, 0, window.innerWidth*0.6, window.innerHeight );
	//renderer.setSize( width * 2 , height * 2 );
	
	document.body.appendChild( renderer.domElement );

	// Be aware that a light source is required for MeshPhongMaterial to work:
    pointLight = new THREE.PointLight(0xFFFFFF); 	// Set the color of the light source (white).
    pointLight.position.set(100, 100, 250); 		// Position the light source at (x, y, z).
    camera.add(pointLight); 							// Add the light source to the scene.

	window.addEventListener( 'resize', onWindowResize, false );

	// CONTROLS
	//controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls = new THREE.EditorControls( camera, renderer.domElement );
	
}

function initComponents() {
	electronGeometry = new THREE.Geometry();
/*	var unsortedComponents = components;	// save a copy of original array of components
	// Sort the components based on their graphLabel number in ascending order
	components = components.sort(function(a, b) {
    return (a.graphLabel - b.graphLabel);
	});*/
	for (k=0; k < components.length; k++) {
		components[k].init(k); // sends k as the component ID				
	}
	for (k=0; k < components.length; k++) {
		components[k].updateJunctions();
	}
	
	if (!ArFlag) electronSize = 8;
	electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: sphere, sizeAttenuation: true, color: blue , transparent: true } );
	electronVertices = new THREE.PointCloud ( electronGeometry, electronMaterial );

	markerRoot = new THREE.Mesh();
	for (k=0; k < components.length; k++) {
		markerRoot.add(components[k].container); // add all the components to the parent object
	}
	//createConnectedMeshes();
	//markerRoot.add(compositeMesh);
	markerRoot.add(electronVertices);	
	if (ArFlag) markerRoot.matrixAutoUpdate = false;
	scene.add( markerRoot );
}

function doUpdate() {	
	update();
	//render();
}

function update() {
	//change the style of watch-button to be normal
	button = document.querySelector("#watch-button");
	button.style.background = "url('../../images/buttons/watch2.png') 0 0 no-repeat / 100%"; // 100% is the size

	// remove all children of scene
	for (c = scene.children.length-1; c >= 0; c--) { 
		var obj = scene.children[c];
		scene.remove(obj);
	}
	electronObjects = [];
	initComponents();

}

function animate() {

	requestAnimationFrame( animate );
	render(); 
}

function render() {
	if (!updateFlag && !stop) {
        updateElectrons();
    }
 	renderer.autoClear = false;
	renderer.clear();
	/* order of rendering matters: first inputScene, then 3D scene overlayed on the inputScene */
	if (ArFlag && !freezeFlag) renderer.render(inputScene, inputCamera);
	/* if it is no-AR condition, render the scene; but if it is Ar condition, 
	wait until a marker is detected */
	//if ( (ArFlag && markerDetectedFlag) || (!ArFlag) ) renderer.render( scene, camera );
	renderer.render( scene, camera );

}


function updateElectrons() {
	ticks++;
	if ( ticks % 10 == 0) {
		for (i = 0; i < components.length; i++) {
			components[i].updateAmmeter();   //recalculates the rate of flow
		}
	}
	var eVertices = electronVertices.geometry.vertices;

	for ( k = 0; k < eVertices.length; k++ ) {
		var electron = eVertices[k];
		var electronObject = electronObjects[k];
		electronObject.updateElectron();
		electron = electronObject.position;									
	}
	electronVertices.geometry.verticesNeedUpdate = true;
	// ARTEST
	for ( k = 0; k < eVertices.length; k++ ) {
		var pos1 = eVertices[k];
		var pos2 = electronObjects[k].position;
		if (pos1 != pos2) {
			console.log("there is a bug here: " + pos1.x + " " + pos2.x); 
		}									
	}
	if (watch && electronObjects.length > 0) {
		//var randomIndex = Math.floor(Math.random() * eVertices.length);
		var electron = electronObjects[randomElectronIndex];
		var trackMaterial = new THREE.LineBasicMaterial({ color: lightGreen });
		var trackGeometry = new THREE.Geometry();
		trackGeometry.vertices.push(
			electron.position,
			new THREE.Vector3().addVectors(electron.position, electron.velocity)
		);
		var line = new THREE.Line( trackGeometry, trackMaterial );
		lines.add( line );
		if (lines.children.length > 10) {
			var first = lines.children[0];
			lines.remove(first);
		}
		// var geometry = new THREE.CircleGeometry( 5, 32 );
		// var material = new THREE.MeshBasicMaterial( { color: orange } );
		// var circle = new THREE.Mesh( geometry, material );
		halo.position.set(electron.position.x, electron.position.y, electron.position.z);
		// scene.add(circle);
		// halo.position = electron;
		// halo.needsUpdate = true;
	}
}

/* create a list of connected meshes, 
 each list contains the components that are connected as an array of [box, start, end] */
function createConnectedMeshes() {
	var connectedMeshes = []; // this is an array of array of meshes.
							// Each element is an array of meshes that are connected		
	var labelCounter = 0;	// keeping track of which connected graph
	if ( components.length != 0 ) {
		connectedMeshes[labelCounter] = new Array(); 
	} 
	//console.log('graph labels: ');	
	for (k=0; k < components.length; k++) {
		var gl = components[k].graphLabel;
		//console.log(gl);
		if ( gl != labelCounter ) { // start the next list of connected components
			labelCounter++;
			connectedMeshes[labelCounter] = new Array();
		}
		var clonedComponent = components[k].container.clone(); // flag is by default true -> recursively clone the children
		connectedMeshes[labelCounter].push( clonedComponent );
	}

	
	// Now, create a CSG union mesh
	var compositeMeshes = new Array(connectedMeshes.length); // create an array of composite meshes, one for each connected graph
															 // array length is equal to the number of CGs 	
	var startIndex = 0;
	for (m=0; m < compositeMeshes.length; m++) { // loop for the number of connected graphs
		var clonedComponent = connectedMeshes[m][0];
		var compositeBSP = createCSGComponent( clonedComponent ); //  
		for (n=1; n < connectedMeshes[m].length; n++ ) { // loop inside each connected graph
			//if ( components[k].compType != "Battery" ) {	// fix this later, what if components[0] is a battery?
				compositeBSP = compositeBSP.union( createCSGComponent( connectedMeshes[m][n] ) );
			//}
		}
		compositeMesh = compositeBSP.toMesh();
		compositeMesh.geometry.computeFaceNormals(); // highly recommended...
		compositeMesh.material = new THREE.MeshBasicMaterial( { color: 0xB2B2B2 } );
		compositeMesh.material.transparent = true;
		compositeMesh.material.opacity = 0.7;
		compositeMesh.material.depthWrite = false;
		compositeMesh.material.side = THREE.BackSide;

		for (k=startIndex; k < startIndex + connectedMeshes[m].length; k++ ) {
			components[k].obstacles.push(compositeMesh); // only add the composite mesh that the component belongs to as obstacle
		} 
		startIndex = startIndex + connectedMeshes[m].length;
		compositeMeshes[m] = compositeMesh;
		// scene.add(compositeMesh);

	}

}

function createCSGComponent( c ) {
	var sj = c.children[0].clone();
	sj.applyMatrix(c.matrixWorld);
	var ej = c.children[1].clone();
	ej.applyMatrix(c.matrixWorld);
	var box = new ThreeBSP( c ); // meshes[0] is the component box 

	box = box.union( new ThreeBSP( sj ) ); // unit it with the start junction
	box = box.union( new ThreeBSP( ej ) ); // unit it with the end junction
	return box;
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

