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

// set the voltmeter image
var image = document.querySelector("#legend-image");
image.src = "../images/legend-image.png";

var button = document.querySelector("#plus-button");
if (button != null) button.onclick = function() {zoom("in")};

button = document.querySelector("#minus-button");
if (button != null) button.onclick = function() {zoom("out")};

button = document.querySelector("#up-button");
if (button != null) button.onclick = function() {pan("up")};

button = document.querySelector("#down-button");
if (button != null) button.onclick = function() {pan("down")};

button = document.querySelector("#left-button");
if (button != null) button.onclick = function() {pan("left")};

button = document.querySelector("#right-button");
if (button != null) button.onclick = function() {pan("right")};

if (ArFlag) {
    //display the freeze button
    var button = document.querySelector("#freeze-button");
    button.style.display = "block";

    // button = document.querySelector("#reload-button");
    // button.style.visibility = "visible";
}

if (twoScreen) {
	var button = document.querySelector("#page0-button");
    //button.addEventListener("click", showPage(0));
    if (button != null) button.style.display = "none";

   	button = document.querySelector("#page1-button");
    if (button != null) button.style.display = "none";

    button = document.querySelector("#page2-button");
    if (button != null) button.style.display = "none";

    button = document.querySelector("#page3-button");
    if (button != null) button.style.display = "none";

    button = document.querySelector("#back-button");
    if (button != null) button.style.display = "none";

    // set the help image
    var image = document.querySelector("#help-image");
	image.src = "../images/helps-components/bg.png";

	// set the voltmeter image
    var image = document.querySelector("#voltmeter-image");
	image.src = "../images/buttons/voltmeter3.png";



	var p = document.querySelector("#description");
	p.innerHTML = "Tap on a component to see its measures";

}        

/*if (twoScreen) {
	var button = document.querySelector("#page0-button");
    //button.addEventListener("click", showPage(0));
    if (button != null) button.onclick = function() {showPage(0)};

   	button = document.querySelector("#page1-button");
    if (button != null) button.onclick = function() {showPage(1)};

    button = document.querySelector("#page2-button");
    if (button != null) button.onclick = function() {showPage(2)};

    button = document.querySelector("#page3-button");
    if (button != null) button.onclick = function() {showPage(3)};

    button = document.querySelector("#back-button");
    if (button != null) button.onclick = function() {back()};

    // set the help image
    var image = document.querySelector("#help-image");
	image.src = "../images/helps-components/bg.png";

	// set the voltmeter image
    var image = document.querySelector("#voltmeter-image");
	image.src = "../images/buttons/voltmeter3.png";



	var p = document.querySelector("#comp-type");
	p.innerHTML = "Tap on a component to see its measures";

}        */
    // button = document.querySelector("#close-help-button");
    // if (button != null) button.onClick.listen((e) => close());

function zoom( direction ) {
	var delta;
	if ((direction == "in" && !ArFlag) || (direction == "out" && ArFlag))  {
		delta = new THREE.Vector3(0.0, 0.0, -50);
	}
	else {
		delta = new THREE.Vector3(0.0, 0.0, 50);
	}
	camera.position.add(delta);
	var message = [delta.z];
	if (!twoScreen) window.parent.postMessage(message, 'http://localhost:8080');	
}

function pan( direction ) {
	var delta;
	var sign = 1;
	if (ArFlag) sign = -1;
	switch (direction) {
		case "up":
			delta = new THREE.Vector3(0.0, 10.0*sign, 0.0);
			break;
		case "down":
			delta = new THREE.Vector3(0.0, -10.0*sign, 0.0);
			break;
		case "left":
			delta = new THREE.Vector3(-10.0*sign, 0.0, 0.0);
			break;
		case "right":
			delta = new THREE.Vector3(10.0*sign, 0.0, 0.0);
			break;
	}
	camera.position.add(delta);
 	var message = [delta.x, delta.y];
	if (!twoScreen) window.parent.postMessage(message, 'http://localhost:8080');	
}

function showPageOld(page) {
	var image = document.querySelector("#help-image");
	image.src = "../images/helps/help" + page.toString() + ".png";
    var div = document.querySelector("#main-page");
    div.style.display = "none";
    
    var button = document.querySelector("#back-button");
    button.style.display = "inline";
}

function showPage(page) {
	var image = document.querySelector("#help-image");
	image.src = "../images/helps-components/help" + page.toString() + ".png";
    var div = document.querySelector("#main-page");
    div.style.display = "none";
    
    // var button = document.querySelector("#back-button");
    // button.style.display = "inline";
}

function back() {
	var image = document.querySelector("#help-image");
	image.src = "../images/helps-components/bg.png";

    var button = document.querySelector("#back-button");
    button.style.display = "none";
    
    var div = document.querySelector("#main-page");
    div.style.display = "block";
}


function showValues(type, v, i, r) {

	var brightness = i/0.3;
	var iFormated = i.toPrecision(3);
	var vFormated = v.toPrecision(3);
	var rFormated = r.toPrecision(1);
	var bFormated = brightness.toPrecision(2);

	var p = document.querySelector("#comp-type");
	p.innerHTML = type;

	p = document.querySelector("#current-value");
	p.innerHTML = "Current = " + iFormated.toString();

	p = document.querySelector("#resistance-value");
	p.innerHTML = "Resistance = " + rFormated.toString();

	p = document.querySelector("#voltage-value");
	if (type == 'Battery') p.innerHTML = "Voltage = " + vFormated.toString();
	//else p.innerHTML = "Voltage Drop = " + vFormated.toString();
	else p.innerHTML = "";

	p = document.querySelector("#brightness-factor");
	if (type == "Bulb") {		
		p.innerHTML = "Brightness Factor = " + bFormated.toString();
	}
	else {
		p.innerHTML = "";
 	}

 	if (twoScreen) {
 		switch (type) {
	        case "Wire":
	          showPage(0);
	          break;
	        case "Battery":
	          showPage(1);
	          break;
	        case "Resistor":
	          showPage(2);
	          break;
	        case "Bulb":
	          showPage(3);
	          break;
     	}
 	}

 	var p = document.querySelector("#description");
	p.innerHTML = "";
}
 

function clearValues() {

	var p = document.querySelector("#comp-type");
	//p.innerHTML = "Tap on a component to see its measures";
	p.innerHTML = "";

	p = document.querySelector("#current-value");
	p.innerHTML = "";

	p = document.querySelector("#resistance-value");
	p.innerHTML = "";

	p = document.querySelector("#voltage-value");
	p.innerHTML = "";

	p = document.querySelector("#brightness-factor");
	p.innerHTML = "";

	back();
	var p = document.querySelector("#description");
	p.innerHTML = "Tap on a component above to learn more about it!";
 
}

var watch = false;
var halo;
var lines; // an object that holds the tracking lines as its children
var randomElectronIndex;
function watchElectron() {
	if (!watch) {
		//change the style of watch-button to be active
		button = document.querySelector("#watch-button");
		button.style.background = "url('../../images/buttons/watch2-active.png') 0 0 no-repeat"; 
		button.style.backgroundSize = "100%";
		if (electronObjects.length > 0) {
			// add an object to hold the tracking lines
			lines = new THREE.Object3D();
			var geometry = new THREE.CircleGeometry( 10, 16 );
			var material = new THREE.MeshBasicMaterial( { color: lightGreen } );
			halo = new THREE.Mesh( geometry, material );
			halo.material.visible = true;

			markerRoot.add(halo);
			markerRoot.add(lines);

			// pick a random number
			randomElectronIndex = Math.floor(Math.random() * electronObjects.length);
		}		
	}
	else {
		if (electronObjects.length > 0) {
			markerRoot.remove(lines);
			markerRoot.remove(halo);
		}


		//change the style of watch-button to be normal
		button = document.querySelector("#watch-button");
		button.style.background = "url('../../images/buttons/watch2.png') 0 0 no-repeat / 100%"; // 100% is the size
	}
	watch = !watch;
	
}


function freezeAR() {
	button = document.querySelector("#freeze-button");
	if (!freezeFlag) {  // freeze the scene

		//change the style of freeze-button to be active		
		button.style.background = "url('../../images/buttons/capture.png') 0 0 no-repeat"; 
		button.style.backgroundSize = "100%";
		
	}

	else {   //unfreeze the scene

		//change the style of freeze-button to be active
		button.style.background = "url('../../images/buttons/freeze.png') 0 0 no-repeat"; 
		button.style.backgroundSize = "100%";
		camera.position.x = 0;
		camera.position.y = 0;
		camera.position.z = 700;


	}

	freezeFlag = !freezeFlag;

}



function makeTextSprite( message, message2, scaleFactor, parameters )
{
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 2;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	//var spriteAlignment = THREE.SpriteAlignment.topLeft;
		
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	//context.font = "Bold " + fontsize + "px " + fontface;
    context.font = fontsize + "px " + fontface;
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	//console.log(metrics.width);
	var textWidth = metrics.width;
	//var textWidth = 700;

	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + 2*borderThickness, 2 * fontsize * 1.4 + borderThickness, 10);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	context.fillText( message2, borderThickness, 2 * fontsize + borderThickness);
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas); 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture } ); // I removed: useScreenCoordinates: false, alignment: spriteAlignment
	var sprite = new THREE.Sprite( spriteMaterial );
	
	
	sprite.scale.set(scaleFactor*0.5 * fontsize, scaleFactor*0.25 * fontsize, scaleFactor*0.75 * fontsize);
	//sprite.scale.set(100,50,1.0);
	return sprite;	
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
	//console.log(w);
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

function reloadPage() {
	console.log("reload the page");
	if (ArFlag) window.location.reload();
}

