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
var raycaster;
var worldCenter;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
console.log('window half x is ' + windowHalfX);
console.log('window half y is ' + windowHalfY);


function doInit(circuit) {	
	components = circuit;
	init();
	animate();
}

function doUpdate(circuit) {	
	components = circuit;
	update();
	animate();
	//render();
}

// component inputs (type, current, resistance, volt, startx, starty, endx, endy, direction)
//var Circuit = [];
// var comp1 = new Component("Wire", 0, 1, 0, 0, -500, 800, 100, 0); 
// var comp2 = new Component("Resistor", 0, 1, 0, -1000, -200, -200, -200, 0);

// Circuit.push(comp1);
// Circuit.push(comp2);
// main(Circuit);

function init() {
	console.log('this is where init starts');
	console.log('# of components = ' + components.length);
	sphere = THREE.ImageUtils.loadTexture( "textures/ball.png" );
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0xffffff, 0.0007 );

	raycaster = new THREE.Raycaster();
	
	THREE.ImageUtils.crossOrigin = 'anonymous'; // enables using images from the image folder

	// draw a sphere to show the center of screen
	worldCenter = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), new THREE.MeshBasicMaterial( {color: 0x000000} ));
	scene.add (worldCenter);
	initComponents();


	renderer = new THREE.WebGLRenderer();
	//renderer.setClearColor ( 0x005368 );
	renderer.setClearColor ( 0x337586 ); //bluish background color
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	//renderer.sortObjects = false; //this is to solve the rendering of transparent objects inside each other! 

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );

	// need both for FF and Webkit - others I haven't tested
  	document.addEventListener('DOMMouseScroll', mousewheel, false);
  	document.addEventListener('mousewheel', mousewheel, false);

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function update() {
	//console.log('this is where update starts');
	console.log('# of components = ' + components.length);
	// remove all children of scene
	for (c = scene.children.length - 1; c >= 0; c--) { 
		var obj = scene.children[c];
		scene.remove(obj);
	}

	// draw a sphere to show the center of screen
	worldCenter = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), new THREE.MeshBasicMaterial( {color: 0x000000} ));
	scene.add (worldCenter);
	initComponents();

}

function initComponents() {
	electronGeometry = new THREE.Geometry();
	ionGeometry = new THREE.Geometry();
	for (k=0; k < components.length; k++) {
		console.log('component ' + k + ' : ' + components[k].compType);
		console.log('sx = ' + components[k].startPoint.x + ' and sy = ' + components[k].startPoint.y + 'and ex = ' + components[k].endPoint.x + ' and ey = ' + components[k].endPoint.y);
		console.log('sz = ' + components[k].startPoint.z + ' and ez = ' + components[k].endPoint.z);
		components[k].init(electronGeometry, ionGeometry);
		//console.log('component # of ions = ' + components[k].ionCount);	
	}
	console.log('# of electrons = ' + electronGeometry.vertices.length);
	console.log('# of ions = ' + ionGeometry.vertices.length);
	electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: sphere, color: 0x000099 , transparent: true } );
	electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );
	

	ionMaterial = new THREE.PointCloudMaterial( { size: ionSize, map: sphere, color: 0xCC0000 , transparent: true } );
	ions = new THREE.PointCloud ( ionGeometry, ionMaterial );
	scene.add ( electrons ); 
	scene.add ( ions ); 
	console.log('# of scene children are ' + scene.children.length);
}


function animate() {

	requestAnimationFrame( animate );
	render();
	//stats.update();

}

function render() {

	var time = Date.now() * 0.00005;

	camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	camera.position.y += ( - mouseY - camera.position.y ) * 0.05;


	camera.lookAt( scene.position );

	updateElectrons();

	renderer.render( scene, camera );

}


function updateElectrons() {
	//console.log('I get this far, so electrons should move!');
	var startIndex = 0
	for (k=0; k < components.length; k++) {
		var endIndex = startIndex + components[k].electronCount; 
		var electronVertices = electrons.geometry.vertices.slice(startIndex, endIndex);
		components[k].updateElectrons(electronVertices); 
		startIndex = endIndex; 
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



function mousewheel( e )
{
  var amount = 100; // parameter

  // get wheel direction 
   var d = ((typeof e.wheelDelta != "undefined")?(-e.wheelDelta):e.detail);
    d = 100 * ((d>0)?1:-1);

    // do calculations, I'm not using any three.js internal methods here, maybe there is a better way of doing this
    // applies movement in the direction of (0,0,0), assuming this is where the camera is pointing
    var cPos = camera.position;
    var r = cPos.x*cPos.x + cPos.y*cPos.y;
    var sqr = Math.sqrt(r);
    var sqrZ = Math.sqrt(cPos.z*cPos.z + r);

    var nx = cPos.x + ((r==0)?0:(d * cPos.x/sqr));
    var ny = cPos.y + ((r==0)?0:(d * cPos.y/sqr));
    var nz = cPos.z + ((sqrZ==0)?0:(d * cPos.z/sqrZ));

    // verify we're applying valid numbers
    if (isNaN(nx) || isNaN(ny) || isNaN(nz))
      return;

    cPos.x = nx;
    cPos.y = ny;
    cPos.z = nz;
}


