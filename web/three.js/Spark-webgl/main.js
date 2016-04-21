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

var ArFlag = false;

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var container;
var camera, scene, renderer, controls;
var inputScene, inputCamera;
var pointLight;
var mouseX = 0, mouseY = 0;
var sphere; //image element for particles
var batteryImg, resistorImg;
var components = []; // an array of components
var electrons, electronGeometry, electronMaterial;
var raycaster;
var compositeMeshes;


var updateFlag = false;
var markerDetectedFlag = false;
var markerRoot;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var mouseFlag = 0; // this flag is used to distinguish a mouse drag from a mouse click

function doInit() {	
	init();
	if (ArFlag) JsArInit();
	if (!ArFlag) animate(); //for non-AR condition; for AR condition the jsFrames.registerAnimation() function is used 
}

function init() {
	//sphere = new THREE.TextureLoader().load( "textures/ball.png" ); // this works for three.js-r75 (latest revision) 
	sphere = THREE.ImageUtils.loadTexture( "textures/ball.png" );
	batteryImg = THREE.ImageUtils.loadTexture( "textures/battery3t.png" ); // later: study the difference b/w ImageLoader and TexutreLoader
	resistorImg = THREE.ImageUtils.loadTexture( "textures/resistor2t.png" );	
	//container = document.createElement( 'div' );
	//document.body.appendChild( container );

/*	camera = new THREE.Camera();
	console.log(camera.getWorldDirection());
	console.log(camera.position);
*/
	//camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	if (!ArFlag) {
		camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
		camera.position.z = 700;
	}

	if (ArFlag) {
		camera = new THREE.Camera();
		//camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
		//camera.position.z = -700;
	}
	
	
	raycaster = new THREE.Raycaster();
	scene = new THREE.Scene();
	
	THREE.ImageUtils.crossOrigin = 'anonymous';  	// enables using images from the image folder

	initComponents();

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor ( 0x337586 ); 			//bluish background color
	renderer.setPixelRatio( window.devicePixelRatio );
	//renderer.setSize( window.innerWidth / 2 , window.innerHeight );
	renderer.setSize( width * 2 , height * 2 );
	
	document.body.appendChild( renderer.domElement );

	// Be aware that a light source is required for MeshPhongMaterial to work:
    pointLight = new THREE.PointLight(0xFFFFFF); 	// Set the color of the light source (white).
    pointLight.position.set(100, 100, 250); 		// Position the light source at (x, y, z).
    camera.add(pointLight); 							// Add the light source to the scene.


	window.addEventListener( 'resize', onWindowResize, false );

	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	
}

function initComponents() {
	electronGeometry = new THREE.Geometry();
	var unsortedComponents = components;	// save a copy of original array of components
	// Sort the components based on their graphLabel number in ascending order
	components = components.sort(function(a, b) {
    return (a.graphLabel - b.graphLabel);
	});
	for (k=0; k < components.length; k++) {
		components[k].init(electronGeometry, k); // sends k as the component ID				
	}
	//createConnectedMeshes();
	//note: I tried adding "sizeAttenuation: false" for the pointsmaterial, but did not work
	if (!ArFlag) electronSize = 10;
	electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: sphere, sizeAttenuation: true, color: 0x000099 , transparent: true } );
	electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );

	markerRoot = new THREE.Mesh();
	for (k=0; k < components.length; k++) {
		//scene.add(components[k].container);
		markerRoot.add(components[k].container);
	}
	markerRoot.add(electrons);	
	if (ArFlag) markerRoot.matrixAutoUpdate = false;
	scene.add( markerRoot );
	//if (ArFlag) scene.matrixAutoUpdate = false;
}

function doUpdate() {	
	update();
	//if (ArFlag) JsArUpdate();
	//render();
}

function update() {
	// remove all children of scene
	for (c = scene.children.length-1; c >= 0; c--) { 
		var obj = scene.children[c];
		scene.remove(obj);
	}
	initComponents();
	//scene.add(pointLight); 		// Add the light source to the scene.

}

function animate() {

	requestAnimationFrame( animate );
	render(); 
	//deviceControls.update();
	controls.update();
}

function render() {
	if (!updateFlag) {
        updateElectrons();
    }
 	renderer.autoClear = false;
	renderer.clear();
	/* order of rendering matters: first inputScene, then 3D scene overlayed on the inputScene */
	if (ArFlag) renderer.render(inputScene, inputCamera);
	/* if it is no-AR condition, render the scene; but if it is Ar condition, 
	wait until a marker is detected */
	//if ( (ArFlag && markerDetectedFlag) || (!ArFlag) ) renderer.render( scene, camera );
	renderer.render( scene, camera );

}


function updateElectrons() {
	var eVertices = electrons.geometry.vertices;
/*	var m = new THREE.Matrix4();
	m = m.getInverse(scene.matrix)*/
	for ( k = 0; k < eVertices.length; k++ ) {
		var electron = eVertices[k];
/*		// new code for AR (later check if I need to add the if (ArFlag) condition not to interfere with the non-AR condition)
		var length = electron.velocity.length();

		electron.velocity.transformDirection(m);
		electron.velocity.multiplyScalar(length);
		// end of new code for AR*/
		//console.log('velocity: ' + Math.round(electron.velocity.x * 100)/100 + ' ' + Math.round(electron.velocity.y*100)/100 + ' ' + Math.round(electron.velocity.z/100)*100);
		components[electron.componentID].updateElectron(electron); // the compoentID shows the 
																	// index for the components array																	
	}
	electrons.geometry.verticesNeedUpdate = true;
}

// create a list of connected meshes, 
// each list contains the components that are connected as an array of [box, start, end] 
function createConnectedMeshes() {
	var connectedMeshes = []; // this is an array of array of meshes.
							// Each element is an array of meshes that are connected		
	var labelCounter = 0;	// keeping track of which connected graph
	if ( components.length != 0 ) {
		connectedMeshes[labelCounter] = new Array(); 
	} 
	console.log('graph labels: ');	
	for (k=0; k < components.length; k++) {
		var gl = components[k].graphLabel;
		console.log(gl);
		if ( gl != labelCounter ) { // start the next list of connected components
			labelCounter++;
			connectedMeshes[labelCounter] = new Array();
		}
		var clonedComponent = components[k].container.clone(); // flag is by default true -> recursively clone the children
		connectedMeshes[labelCounter].push( clonedComponent );
	}
	
	console.log('number of connected graphs: ' + connectedMeshes.length);
	console.log(connectedMeshes);
	
	// Now, create a CSG union mesh
	compositeMeshes = new Array(connectedMeshes.length); // create an array of composite meshes, one for each connected graph
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
		var compositeMesh = compositeBSP.toMesh();
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
		if (ArFlag) compositeMesh.matrixAutoUpdate = false;
		compositeMeshes[m] = compositeMesh;
		scene.add(compositeMesh);

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

