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
var twoD = true; //electron movement is either 2D (z=0) or 3D

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
var compositeMesh;

var clock = new THREE.Clock();
var ticks = 0;





var updateFlag = false;
var markerDetectedFlag = false;
var markerRoot;  // the parent object of all the components and electrons for AR transformations

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var mouseFlag = 0; // this flag is used to distinguish a mouse drag from a mouse click

// COLORS:
var red = 0xD11919;
var darkRed = 0x990000;
var green = 0x008F00;
var darkGreen = 0x003300;
var gray = 0x808080;
var midnightBlue = 0x000099;
var backgroundBlue = 0x337586;
var orange = 0xFF9900;
var darkOrange = 0xFF6600;


function doInit() {	
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

	if (!ArFlag) {
		camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 10000 );
		//camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
		camera.position.z = 700;
	}

	if (ArFlag) {
		camera = new THREE.Camera();
	}
	
	
	raycaster = new THREE.Raycaster();
	scene = new THREE.Scene();
	
	//clock = new THREE.Clock();  //the clock automatically starts when instantiated
	
	THREE.ImageUtils.crossOrigin = 'anonymous';  	// enables using images from the image folder

	initComponents();

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor ( backgroundBlue ); 			//bluish background color
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth , window.innerHeight );
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
		components[k].init(electronGeometry, k); // sends k as the component ID				
	}
	for (k=0; k < components.length; k++) {
		components[k].updateJunctions();
	}
	
	if (!ArFlag) electronSize = 10;
	electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: sphere, sizeAttenuation: true, color: backgroundBlue , transparent: true } );
	electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );

	markerRoot = new THREE.Mesh();
	for (k=0; k < components.length; k++) {
		markerRoot.add(components[k].container); // add all the components to the parent object
	}
	//createConnectedMeshes();
	//markerRoot.add(compositeMesh);
	markerRoot.add(electrons);	
	if (ArFlag) markerRoot.matrixAutoUpdate = false;
	scene.add( markerRoot );
}

function doUpdate() {	
	update();
	//render();
}

function update() {
	// remove all children of scene
	for (c = scene.children.length-1; c >= 0; c--) { 
		var obj = scene.children[c];
		scene.remove(obj);
	}
	initComponents();
}

function animate() {

	requestAnimationFrame( animate );
	render(); 
	//deviceControls.update();
	//controls.update();
}

function render() {
	if (!updateFlag && !stop) {
        updateElectrons();
    }
 	renderer.autoClear = false;
	renderer.clear();
	var delta = clock.getDelta();
	var time = clock.getElapsedTime(); // time is in seconds
	//console.log(time);
/*	for (i=0; i < components.length; i++) { 
		if ( components[i].ammeter != null ) {
			var delta = clock.getDelta();
			var time = clock.getElapsedTime(); // time is in seconds
			// console.log(delta);

		}
	}*/
	/* order of rendering matters: first inputScene, then 3D scene overlayed on the inputScene */
	if (ArFlag) renderer.render(inputScene, inputCamera);
	/* if it is no-AR condition, render the scene; but if it is Ar condition, 
	wait until a marker is detected */
	//if ( (ArFlag && markerDetectedFlag) || (!ArFlag) ) renderer.render( scene, camera );
	renderer.render( scene, camera );

}


function updateElectrons() {
	ticks++;
	var eVertices = electrons.geometry.vertices;

	for ( k = 0; k < eVertices.length; k++ ) {
		var electron = eVertices[k];
		updateElectron(electron, components[electron.componentID] ); // the compoentID shows the 
																	// index for the components array
		//components[electron.componentID].updateElectron(electron); 																	
	}
	electrons.geometry.verticesNeedUpdate = true;
	if (watch) {
		//var randomIndex = Math.floor(Math.random() * eVertices.length);
		var electron = eVertices[0];
		// var dir = electron.velocity.normalize();
		// var length = electron.velocity.length();
		// var arrowHelper = new THREE.ArrowHelper( dir, electron, length, darkGreen );
		// scene.add(arrowHelper);
		var trackMaterial = new THREE.LineBasicMaterial({ color: darkOrange });
		var trackGeometry = new THREE.Geometry();
		trackGeometry.vertices.push(
			electron,
			new THREE.Vector3().addVectors(electron, electron.velocity)
		);
		var line = new THREE.Line( trackGeometry, trackMaterial );
		lines.add( line );
		// var geometry = new THREE.CircleGeometry( 5, 32 );
		// var material = new THREE.MeshBasicMaterial( { color: orange } );
		// var circle = new THREE.Mesh( geometry, material );
		halo.position.set(electron.x, electron.y, electron.z);
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
	
	//console.log('number of connected graphs: ' + connectedMeshes.length);
	//console.log(connectedMeshes);
	
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

function makeTextSprite( message, parameters )
{
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 4;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	//var spriteAlignment = THREE.SpriteAlignment.topLeft;
		
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture } ); // I removed: useScreenCoordinates: false, alignment: spriteAlignment
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;	
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}

var gridHelper = new THREE.GridHelper( window.innerWidth, 10, 0x0000ff, 0x808080 );
gridHelper.position.y = 0.0;
gridHelper.rotateX(Math.PI/2);
var toggle = true;

function displayGrid() {
	if (toggle) {scene.add(gridHelper);}
	else {scene.remove(gridHelper);}
	toggle = !toggle;
}

var stop = false;
function keepMoving() {
	stop = !stop;   // the stop flag is used in the rendering function as a condition for running updateElectrons()
}

var watch = false;
var halo;
var lines; // an object that holds the tracking lines as its children
function watchElectron() {
	if (!watch) {
		// add an object to hold the tracking lines
		lines = new THREE.Object3D();
		var geometry = new THREE.CircleGeometry( 5, 16 );
		var material = new THREE.MeshBasicMaterial( { color: darkOrange } );
		halo = new THREE.Mesh( geometry, material );
		halo.material.visible = false;
		// halo.material.transparent = true;
		// halo.material.opacity = 0.5;
		halo.material.visible = true;
		scene.add(halo);
		scene.add(lines);
	}
	else {
		scene.remove(lines);
		scene.remove(halo);
	}
	watch = !watch;
	
}