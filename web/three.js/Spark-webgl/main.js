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
var camera, scene, renderer;
var mouseX = 0, mouseY = 0;
var sphere; //image element for particles
var components = []; // an array of components
var electrons, electronGeometry, electronMaterial;
var ions, ionGeometry, ionMaterial;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {
	
	sphere = THREE.ImageUtils.loadTexture( "textures/ball.png" );
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 3000 );
	camera.position.z = 1000;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xffffff, 0.0007 );
	
	THREE.ImageUtils.crossOrigin = 'anonymous'; // for using images from the image folder
	// component inputs (type, current, resistance, volt, startx, starty, endx, endy)
	var comp1 = new Component("wire", 0, 1, 0, 400, 300, -400, -300); 
	//var comp1 = new Component("wire", 0, 1, 0, -1010, 0, -10, 0);
	components.push(comp1);
	var comp2 = new Component("wire", 0, 1, 0, 10, 0, 1010, 0);
	components.push(comp2);
	console.log('# of components = ' + components.length);
	
	initComponents();


	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor ( 0x005368 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

// create a velocity vector
// particle.velocity = new THREE.Vector3(
// 	-Math.random(),  // x: random vel
//   	0, 				// y
// 	 	0);             // z

function animate() {

	requestAnimationFrame( animate );
	render();
	//stats.update();

}

function render() {

	var time = Date.now() * 0.00005;

	//camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	//camera.position.y += ( - mouseY - camera.position.y ) * 0.05;

	camera.lookAt( scene.position );
	renderer.render( scene, camera );

}

function initComponents() {
	electronGeometry = new THREE.Geometry();
	ionGeometry = new THREE.Geometry();
	for (k=0; k < components.length; k++) {
		console.log(k);
		components[k].init(electronGeometry, ionGeometry);	
		console.log(k);
	}
	console.log('# of electrons = ' + electronGeometry.vertices.length);
	console.log('# of ions = ' + ionGeometry.vertices.length);
	electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: sphere, color: 0x000099 , transparent: true } );
	electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );
	scene.add ( electrons ); 

	ionMaterial = new THREE.PointCloudMaterial( { size: ionSize, map: sphere, color: 0xCC0000 , transparent: true } );
	ions = new THREE.PointCloud ( ionGeometry, ionMaterial );
	scene.add ( ions ); 
}

function updateElectrons() {
	for (i=0; i < components.length; i++) {
		components[i].updateElectrons();
	}
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

// mouseX = event.clientX - windowHalfX;
// mouseY = event.clientY - windowHalfY;

}

function onDocumentTouchStart( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}

function onDocumentTouchMove( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}


