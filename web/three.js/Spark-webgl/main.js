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

var container;
var camera, scene, renderer, controls;
var pointLight;
var mouseX = 0, mouseY = 0;
var sphere; //image element for particles
var batteryImg, resistorImg;
var components = []; // an array of components
var electrons, electronGeometry, electronMaterial;
var raycaster;
var compositeMesh;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function doInit() {	
	//components = circuit;
	init();
	animate();
}

function doUpdate() {	
	//components = circuit;
	update();
	render();
}


function init() {
	sphere = THREE.ImageUtils.loadTexture( "textures/ball.png" );
	batteryImg = THREE.ImageUtils.loadTexture( "textures/battery3t.png" );
	resistorImg = THREE.ImageUtils.loadTexture( "textures/resistor2t.png" );	
	//container = document.createElement( 'div' );
	//document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 700;

	scene = new THREE.Scene();

	raycaster = new THREE.Raycaster();
	
	THREE.ImageUtils.crossOrigin = 'anonymous'; 	// enables using images from the image folder

	initComponents();

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor ( 0x337586 ); 			//bluish background color
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	// container.appendChild( renderer.domElement );
	document.body.appendChild( renderer.domElement );

	// Be aware that a light source is required for MeshPhongMaterial to work:
    pointLight = new THREE.PointLight(0xFFFFFF); 	// Set the color of the light source (white).
    pointLight.position.set(100, 100, 250); 		// Position the light source at (x, y, z).
    scene.add(pointLight); 							// Add the light source to the scene.

	//renderer.sortObjects = false; //this is to solve the rendering of transparent objects inside each other! 

	window.addEventListener( 'resize', onWindowResize, false );

	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
}

function update() {
	// remove all children of scene
	for (c = scene.children.length - 1; c >= 0; c--) { 
		var obj = scene.children[c];
		scene.remove(obj);
	}
	initComponents();
	scene.add(pointLight); 		// Add the light source to the scene.

}

function initComponents() {
	electronGeometry = new THREE.Geometry();
	var unsortedComponents = components;	// save a copy of original array of components
	// Sort the components based on their graphLabel number in ascending order
	components = components.sort(function(a, b) {
    return (a.graphLabel - b.graphLabel);
	});
	for (k=0; k < components.length; k++) {
		console.log('component ' + k + ' : ' + components[k].compType);
		components[k].init(electronGeometry, k); // sends k as the component ID
/*		if (components[k].compType != "Battery") {
			components[k].init(electronGeometry, k); // sends k as the component ID
		}
		else {
			components[k].initBattery(k);
		}		*/				
	}

	// create a list of connected meshes, 
	// each list contains the components that are connected as an array of [box, start, end] 
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
		var clonedComponent = components[k].boxMesh.clone(); // flag is by default true -> recursively clone the children
		connectedMeshes[labelCounter].push( clonedComponent );
	}
	
	console.log('number of connected graphs: ' + connectedMeshes.length);
	console.log(connectedMeshes);
	
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

		scene.add(compositeMesh);
	}

/*
	var composite = new THREE.Geometry();
	for (k=0; k < components.length; k++) {
		components[k].boxMesh.updateMatrix();
		composite.merge(components[k].boxMesh.geometry, components[k].boxMesh.matrix);
		//THREE.GeometryUtils.merge(components[0].boxMesh.geometry, components[1].boxMesh.geometry);
	}
	var boxMaterial = new THREE.MeshBasicMaterial( { color: 0xB2B2B2 } );
	boxMaterial.transparent = true;
	boxMaterial.opacity = 0.5;
	boxMaterial.depthWrite = false;
	composite.mergeVertices();
	var compositeMesh = new THREE.Mesh(composite, boxMaterial);

	scene.add(compositeMesh);
*/	
	electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: sphere, color: 0x000099 , transparent: true } );
	electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );
	scene.add ( electrons );
}

function createCSGComponent( c ) {
	var sj = c.children[0].clone();
	sj.applyMatrix(c.matrixWorld);
	var ej = c.children[1].clone();
	ej.applyMatrix(c.matrixWorld);
/*	console.log(c.matrixWorld);
	console.log(sj.matrixWorld);
	console.log(ej.matrixWorld);*/
	var box = new ThreeBSP( c ); // meshes[0] is the component box 

	box = box.union( new ThreeBSP( sj ) ); // unit it with the start junction
	box = box.union( new ThreeBSP( ej ) ); // unit it with the end junction
	return box;
}

function animate() {

	requestAnimationFrame( animate );
	render();
	//stats.update();
	//controls.update();
}

function render() {

	updateElectrons();
	renderer.render( scene, camera );

}


function updateElectrons() {
	var eVertices = electrons.geometry.vertices;
	for ( k = 0; k < eVertices.length; k++ ) {
		var electron = eVertices[k];
		components[electron.componentID].updateElectron(electron); // the compoentID shows the 
																	// index for the components array																	
	}
	electrons.geometry.verticesNeedUpdate = true;
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}