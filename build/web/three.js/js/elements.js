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
var interval;
var releaseText = "Tap on a component to learn more about it!";
var captureText = "Capture the circuit to explore it more!"
// set the voltmeter image
var image = document.querySelector("#legend-image");
image.src = "../images/legend-image.png";

// set the voltmeter image
var image = document.querySelector("#voltmeter-image");
image.src = "../images/buttons/voltmeter3.png";


var button = document.querySelector("#plus-button");
if (button != null) {
	//button.onclick = function() {zoom("in", "click")};
	//button.onmousedown = function() {zoom("in", "hold")};
	//button.onmouseup = function() {stopInterval()};
	button.ontouchstart = function() {zoom("in")};
	button.ontouchend = function() {stopInterval()};
}
button = document.querySelector("#minus-button");
if (button != null) {
	button.ontouchstart = function() {zoom("out")};
	button.ontouchend = function() {stopInterval()};
}
button = document.querySelector("#up-button");
if (button != null) {
	button.ontouchstart = function() {pan("up")};
	button.ontouchend = function() {stopInterval()};
}

button = document.querySelector("#down-button");
if (button != null) {
	button.ontouchstart = function() {pan("down")};
	button.ontouchend = function() {stopInterval()};
}

button = document.querySelector("#left-button");
if (button != null) {
	button.ontouchstart = function() {pan("left")};
	button.ontouchend = function() {stopInterval()};
}

button = document.querySelector("#right-button");
if (button != null) {
	button.ontouchstart = function() {pan("right")};
	button.ontouchend = function() {stopInterval()};
}

if (ArFlag) {
    //display the freeze button
    var button = document.querySelector("#freeze-button");
    button.style.display = "block";

    // button = document.querySelector("#reload-button");
    // button.style.visibility = "visible";
}

if (twoScreen) {
	// var button = document.querySelector("#page0-button");
 //    //button.addEventListener("click", showPage(0));
 //    if (button != null) button.style.display = "none";

 //   	button = document.querySelector("#page1-button");
 //    if (button != null) button.style.display = "none";

 //    button = document.querySelector("#page2-button");
 //    if (button != null) button.style.display = "none";

 //    button = document.querySelector("#page3-button");
 //    if (button != null) button.style.display = "none";

 //    button = document.querySelector("#back-button");
 //    if (button != null) button.style.display = "none";


 	// display reset button

    // set the help image
    var image = document.querySelector("#help-image");
	image.src = "../images/helps-components/bg.png";

	var button = document.querySelector("#reset-button");
	button.style.display = "block";


	var p = document.querySelector("#description");
	p.innerHTML = captureText;

	var button = document.querySelector("#watch-button");
	button.style.display = "none";

	var div = document.querySelector("#legend-box");
	div.style.display = "none";

	div = document.querySelector("#controls-panel");
	div.style.display = "none";

}        

function zoom( direction, state ) {
	//console.log("zoom is called");
	var delta;
	var scale = 20.0;
	if (ArFlag) scale /= arScale;
	if ((direction == "in" && !ArFlag) || (direction == "out" && ArFlag))  {
		delta = new THREE.Vector3(0.0, 0.0, -scale);
	}
	else {
		delta = new THREE.Vector3(0.0, 0.0, scale);
	}
	camera.position.add(delta);
	console.log("button zoom:", camera.position);
	interval = setInterval(function(){ camera.position.add(delta); }, 50);
	//else {camera.position.add(delta);}	
	//if (state == "hold") interval = setInterval(function(){ markerRootParent.position.add(delta); }, 100);
	//else {
		//markerRoot.position.add(delta);
		// markerRoot.rotation.z = Math.PI/2;
		// markerRoot.matrixWorldNeedsUpdate = true;
	//}	

	var message = [delta.z];
	if (!twoScreen) window.parent.postMessage(message, '*');	
}

function stopInterval() {
	clearInterval(interval);
}

function pan( direction, state ) {
	var delta;
	var sign = 1;
	var scale = 20.0;
	if (ArFlag) { sign = -1; scale /= arScale; }
	switch (direction) {
		case "up":
			delta = new THREE.Vector3(0.0, -scale, 0.0);
			break;
		case "down":
			delta = new THREE.Vector3(0.0, scale, 0.0);
			break;
		case "left":
			delta = new THREE.Vector3(scale*sign, 0.0, 0.0);
			break;
		case "right":
			delta = new THREE.Vector3(-scale*sign, 0.0, 0.0);
			break;
	}
	camera.position.add(delta);
	interval = setInterval(function(){ camera.position.add(delta); }, 50);

 	var message = [delta.x, delta.y];
	if (!twoScreen) window.parent.postMessage(message, '*');	
}

function showPageOld(page) {
	var image = document.querySelector("#help-image");
	image.src = "../../images/helps/help" + page.toString() + ".png";
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

    // var button = document.querySelector("#back-button");
    // button.style.display = "none";
    
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
	p.innerHTML = releaseText;
 
}

function flashValues() {

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
	p.innerHTML = "";
 
}

var watch = false;


var lines; // an object that holds the tracking lines as its children
var halo;
var randomElectronIndex;
function watchElectron() {
	if (ArFlag && !freezeFlag) return;
	if (!watch) {
		//change the style of watch-button to be active
		button = document.querySelector("#watch-button");
		button.style.background = "url('../../images/buttons/watch2-active2.png') 0 0 no-repeat"; 
		button.style.backgroundSize = "100%";
		if (electronObjects.length > 0) {
			// add an object to hold the tracking lines
			var geometry = new THREE.CircleGeometry( 10, 16 );
			var material = new THREE.MeshBasicMaterial( { color: lightGreen } );
			halo = new THREE.Mesh( geometry, material );
			halo.material.visible = false;
			lines = new THREE.Object3D();
			markerRoot.add(halo);
			markerRoot.add(lines);

			// pick a random number
			randomElectronIndex = Math.floor(Math.random() * electronObjects.length);
		}		
	}
	else {
		if (electronObjects.length > 0) {
			halo.material.visible = false;
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
		button.style.background = "url('../images/buttons/recapture.png') 0 0 no-repeat"; 
		button.style.backgroundSize = "100%";

		//zoom("in");
		//pan("up");
		//stopInterval();

		var p = document.querySelector("#description");
		p.innerHTML = releaseText;

		var button = document.querySelector("#watch-button");
		button.style.display = "block";

		var div = document.querySelector("#legend-box");
		div.style.display = "block";

		div = document.querySelector("#controls-panel");
		div.style.display = "block";


		// TEST: calibrate the speed of electrons with/without marker detector slowing down factor
		//var eVertices = electronVertices.geometry.vertices;
		// var electronObject;
		// for ( k = 0; k < electronObjects.length; k++ ) {
		// 	//var electron = eVertices[k];
		// 	electronObject = electronObjects[k];
		// 	electronObject.velocity.multiplyScalar(arSlowFactor);									
		// }
		freezeFlag = !freezeFlag;

	}

	else {   //unfreeze the scene
		window.location.reload();

/*		//change the style of freeze-button to be active
		button.style.background = "url('../images/buttons/capture2.png') 0 0 no-repeat"; 
		button.style.backgroundSize = "100%";

		camera.position.set(0, 0, 0);
		//arRenderFlag = true;

		// reset the clicked component, if any
		if (clickedComponent != null) unSelectComponent();

		// reset the watch-an-electron function, if it is active
		if (watch) watchElectron();

		var p = document.querySelector("#description");
		p.innerHTML = captureText;

		var button = document.querySelector("#watch-button");
		button.style.display = "none";

		var div = document.querySelector("#legend-box");
		div.style.display = "none";

		div = document.querySelector("#controls-panel");
		div.style.display = "none";*/
	}

	// freezeFlag = !freezeFlag;

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
	//texture.flipY = false;
	texture.needsUpdate = true;

	if (ArFlag) {
		var spriteMaterial = new THREE.SpriteMaterial( 
			{ map: texture, useScreenCoordinates: false, rotation: Math.PI } ); // I removed: useScreenCoordinates: false, alignment: spriteAlignment
	}
	else {
		var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture, useScreenCoordinates: false} ); // I removed: useScreenCoordinates: false, alignment: spriteAlignment

	}
	var sprite = new THREE.Sprite( spriteMaterial );


	if (ArFlag) sprite.scale.set(scaleFactor*0.5 * fontsize, -scaleFactor*0.25 * fontsize, scaleFactor*0.75 * fontsize);
	else sprite.scale.set(scaleFactor*0.5 * fontsize, scaleFactor*0.25 * fontsize, scaleFactor*0.75 * fontsize);
	//sprite.scale.set(100,50,1.0);
	return sprite;	

	// TEST
	var textbox = new THREE.Mesh(
		new THREE.BoxGeometry(30, 10, 1, 1, 1, 1),
		new THREE.MeshBasicMaterial({map: texture})
	);
	//textbox.scale.set(scaleFactor*0.5 * fontsize, scaleFactor*0.25 * fontsize, scaleFactor*0.75 * fontsize);
	textbox.scale.set(scaleFactor*0.5, scaleFactor*0.25, scaleFactor*0.75);
	//return textbox;
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
	if (ArFlag) window.location.reload();
}