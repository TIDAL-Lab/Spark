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

var ionGeometry = new THREE.SphereGeometry( 4, 16, 16 );
var ionMaterial = new THREE.MeshBasicMaterial( {color: darkRed , transparent: true} ); // later: there was something wrong with MeshPhongMaterial that it did not change the color, so I changed it to basic material.
var standardLength = 200; // it is 100 multiplies by the factor (here 2) that it is scaled by when passed from Parse
var offsetZ = 0.00;

function Component(type, current, res, volt, startX, startY, endX, endY, direction, connections, graphLabel) {
 	this.compType = type; // "wire", "resistor", "bulb", "battery"
  	this.current = current;  // electric current measure
  	this.R = res;   // resistance measure
  	this.volt = volt; // voltage measure
  	this.startPoint = new THREE.Vector3( startX, startY, 0.0 );  // startX: X coordinate of start point
  	this.endPoint = new THREE.Vector3( endX, endY, 0.0 ); 
  	this.direction = direction; // 0 if no current; 1 if from Start to End; -1 if from End to Start
  	this.graphLabel = graphLabel;
  	this.ID;
  	this.electronCount; // Change it later
  	this.ionCount; //Change it later
  	this.l = Math.sqrt((endX-startX)*(endX-startX)+(endY-startY)*(endY-startY));
  	this.w = 110;
  	this.ions = [];
  	this.obstacles = [];
  	this.container;
  	this.startJunction;
  	this.endJunction;

   	this.connections = connections;

   	this.ammeter;
   	this.measureOn = false;
   	this.text2;
   	this.prevCount = 0;

   	// AR condition
   	this.initialMatrix = new THREE.Matrix4(); //the matrix for finding the world to local position of electrons

  	if (this.compType == "Wire") {
  		//this.electronCount = 1;
  		this.electronCount = Math.round( 15 * this.l/standardLength); // this.l might not be an integer
  	}
  	else if ( this.compType == "Battery" ) {
  		this.electronCount = 0;
  	}
  	else { 		// Resistor or Bulb
  		//this.electronCount = 1;
  		this.electronCount = 15;
  	}

  	this.init = function( ID ) {
  		this.ID = ID;		
		this.createContainer();
		this.createAmmeter();
		this.computeForce();
		this.createElectrons( this );
	}

	this.computeForce = function() {
		this.force = new THREE.Vector3();
	  	this.force.x = 0.0; 
	  	this.force.y = this.direction * this.current; // force is in y direction, because the cylinder's axis is initially in y then I rotate it
	  	if (this.compType == "Wire") { this.force.y *= 0.2; }
	  	this.force.z = 0.0;


	  	// transform the force vector --> world space
		var length = this.force.length();
		this.force.transformDirection(this.container.matrixWorld); //normalized
		this.force.multiplyScalar(length);

		this.velocityMax = velocity + this.current * 20;
	}

	this.createContainer = function() {
		var center = new THREE.Vector3( (this.startPoint.x + this.endPoint.x) / 2, 
										(this.startPoint.y + this.endPoint.y) / 2, 
										0.0 );

		/* CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
		* radiusSegment = 24 (default value: 8)
		* heightSegments = 1 (default value)
		* openEnded = true (default is false)
		*/

		// TEST: cone container for resistor
		var containerGeometry;
		var containerMaterial;
		if (this.compType == "Battery") { 
			containerGeometry = new THREE.CylinderGeometry( this.w/2, this.w/2, this.l, 32, 1, true);
			containerMaterial = new THREE.MeshBasicMaterial( { color: darkGreen } );
			this.container = new THREE.Mesh( containerGeometry, containerMaterial );
			var plusText = makeTextSprite( "+", 
				{ fontsize: 150, fontface: "arial", borderColor: {r:153, g:76, b:0, a:0.0}, backgroundColor: {r:255, g:128, b:0, a:0.0} } );
			plusText.position.set(-this.w*0.1, -this.l*0.1, 0);
			var minusText = makeTextSprite( "-", 
				{ fontsize: 150, fontface: "arial", borderColor: {r:153, g:76, b:0, a:0.0}, backgroundColor: {r:255, g:128, b:0, a:0.0} } );
			minusText.position.set(-this.w*0.1, this.l*0.5, 0);
			this.container.add(plusText);
			this.container.add(minusText);
		} 
		else {   // it's a wire, resistor, or a bulb
			containerGeometry = new THREE.CylinderGeometry( this.w/2, this.w/2, this.l, 32, 32, true);
			containerMaterial = new THREE.MeshBasicMaterial( { color: gray } );
			if (this.compType == "Wire") { containerMaterial.color.set(lightGray); }
			this.container = new THREE.Mesh( containerGeometry, containerMaterial );
		}

		containerMaterial.transparent = true;
		containerMaterial.opacity = 0.7;
		containerMaterial.depthTest = true;  // this seems to help with showing the electrons always on top
		containerMaterial.depthWrite = false;

		// now add the junctions to the box	
		var startJunction = this.createJunction(Math.PI/2, - this.l / 2);
		//startJunction.position.y = - this.l / 2; // I changed this from x to y (from BoxGeometry)
		//startJunction.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI); // rotate b/c it's a half sphere
		var endJunction = this.createJunction(0, this.l / 2);
        //endJunction.position.y = this.l / 2;	

        // update the junctions
		for (i=0; i < this.connections.length; i++) {
			var obj = this.connections[i];
			var key = i.toString();
			var code = obj[key];
			var index;
			if (code != -1 && code != 0) {			// if junction is connected
				if (code == 1 || code == 3) {		// start junction is connected
					startJunction.material.color.set(green);
					//startJunction.connectedComponentID = i;
					startJunction.connectedComponentIDs.push(i);
					startJunction.connectedComponents.push(components[i]);
				}
				else {								// end junction is connected
					endJunction.material.color.set(green);
					//endJunction.connectedComponentID = i;
					endJunction.connectedComponentIDs.push(i);
					endJunction.connectedComponents.push(components[i]);
				}
			}
		}
	    // add the junctions to the box
	    this.startJunction = startJunction;
		this.container.add(this.startJunction);
		this.endJunction = endJunction;
		this.container.add(this.endJunction);

		// create ions and add them to the box
		if (this.compType != "Battery") { this.createIons(); }
		


		//transform the container
		// first set its position
		this.container.position.set(center.x-400, center.y, center.z);
		// then rotates it
		// calculate the rotation angle of the component on the XY plane (-180 to 180 from +x axis)
		var startToEnd = new THREE.Vector3().subVectors( this.endPoint, this.startPoint );
		var xAxis = new THREE.Vector3(1, 0, 0);
		var angle = startToEnd.angleTo(xAxis);
		var vector = new THREE.Vector3();
		vector.crossVectors(xAxis, startToEnd);
		var sign = Math.sign(vector.z);		
		var rotationAngle = angle*sign;
		this.container.rotation.z = rotationAngle - Math.PI/2; // I added "-Math.PI/2" (from BoxGeometry)
		// I need to manually update the matrix for electrons

		

		this.container.updateMatrixWorld(); // because it is not in the render() loop yet 
		
		// set the matrix for finding the world to local position of electrons
		this.initialMatrix.copy(this.container.matrixWorld);


		this.container.material.side = THREE.BackSide;  // for collision detection code
  		this.obstacles.push(this.container); // for collision detection code
  		this.obstacles.push(this.startJunction);
  		this.obstacles.push(this.endJunction);
	}

	this.createJunction = function(thetaStart, yPos) {
		/* for the geometry make a half sphere, with vertical angel sweeping Math.PI:
		 * SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
		 here I changed the thetaLength from Math.PI (default) to Math.PI/2
		 --> the end junction is capped correctly, but I need to rotate the start junction along the y axis
		 */
		var junction = new THREE.Mesh( new THREE.SphereGeometry(this.w/2, 32, 32, 0, Math.PI*2, thetaStart, Math.PI/2), 
										new THREE.MeshBasicMaterial( { color: red } ));
		junction.material.transparent = false;
		junction.material.opacity = 0.7;
		junction.material.depthTest = true;
		junction.material.depthWrite = false;
		junction.material.side = THREE.BackSide;

		//junction.connectedComponentID = -1;
		junction.connectedComponentIDs = [];
		junction.connectedComponents = [];
		junction.currents = [];

		junction.outComponents = [];
		junction.outCurrents = [];
		junction.probabilities = [];

		junction.position.y = yPos;
		return junction;
	}

	// not being used right now
	this.updateJunctions = function() {
		this.formJunctionCurrents( this.startJunction, "start" );
		this.formJunctionCurrents( this.endJunction, "end" );
	}

	// not being used right now
	this.formJunctionCurrents = function ( junction, string ) {  // REMOVE STRING: it's only for testing
		for ( i = 0; i < junction.connectedComponents.length; i ++ ) {
			var component = junction.connectedComponents[i];
			if (component.startJunction.connectedComponents.includes(this)) {  //connected component is connected by
																				  // its start junction
				//var current = component.current * component.direction;																  
				junction.currents.push( component.current * component.direction ); 
			}
			else {  //connected component is connected by its end junction, so I need to multiply it by -1 to get to correct direction
				junction.currents.push( component.current * component.direction * -1 );

			}
		}

		for (i=0; i < junction.connectedComponents.length; i++) {
			if ( this.current != 0.0 && junction.currents[i] > 0.0 ) { // LATER: should it be this.current > 0.0 too? to avoid going back?
				junction.outComponents.push(junction.connectedComponents[i]);
				junction.outCurrents.push(junction.currents[i]);
			} 
			if (this.current == 0.0 && junction.currents[i] == 0.0 ) {
				junction.outComponents.push(junction.connectedComponents[i]);
				//junction.outCurrents.push(junction.currents[i]);
				junction.probabilities.push(1); // there is the same probability for going to each branch
			}
		}
		//console.log("out " + this.ID + " " + string + ": " + junction.outCurrents);
		if (this.current != 0.0) {
			var norm = Math.min.apply( Math, junction.outCurrents );
			junction.probabilities = junction.outCurrents.map(function(a) {
	    							return (a/norm);
								});
		}

		for (i=1; i < junction.probabilities.length; i++) {  // start from the second element
			junction.probabilities[i] += junction.probabilities[i-1];
		}
		//console.log("prob " + this.ID + " " + string + ": " + junction.probabilities);

		// var c = this.findNextComponent(junction);
		// if (c != null) {console.log("next " + this.ID + " " + string + ": " + c.ID);}
		// else {console.log("next " + this.ID + " " + string + ": " + c);}


	}

	this.createIons = function() {		
		var count = 0;
		var d2 = 50;
		var d = 0; // d is inverse of density of ions which is inversly proportional to resistance		
		if (this.compType == "Resistor" || this.compType == "Bulb") {
			var d2 = 20;
			var d = this.R + 1;
		}
		var halfL = Math.round(this.l/2);
		var halfW = Math.round(this.w/2);
		
		for ( i = - halfL; i <= halfL; i++) {
			for ( j = - halfW; j <= halfW; j++) {
				if (i % d2 == 0 & j % d2 == 0 & (i + j) % (20*(5-d)) == 0 ) {
					pos = new THREE.Vector3();
					pos.y = i; // I switched the order of x & y (from BoxGeometry)
					pos.x = j;
					pos.z = offsetZ;

					var ion = new THREE.Mesh( ionGeometry, ionMaterial );
					ion.position.set(pos.x, pos.y, pos.z);
					this.ions.push(ion);
					this.container.add(ion);
					count++;
				}
			}
		}

		this.ionCount = count;

  		for ( i = 0; i < this.ions.length; i ++ ) {
  			this.obstacles.push(this.ions[i]);	
  		}	
	}

	// not being used right now
	this.findNextComponent = function( junction ) {
		return junction.outComponents[0];
		if (junction.probabilities.length == 0) {
			//console.log("bug");
			return null;
		}
		else {
			//console.log("alright");
			var diceMax = junction.probabilities[junction.probabilities.length - 1]; // set diceMax to the last element of probabilites
			var diceRoll = Math.floor(Math.random() * diceMax); // floor(random(max-min)) + min
			//console.log("diceRoll: " + diceRoll);
			//console.log("prob= " + junction.probabilities);
			// console.log("length: " + junction.outComponents.length);
			if (diceRoll < junction.probabilities[0]) {return junction.outComponents[0];}
			else {
				for (i=1; i < junction.probabilities.length; i++) {
					if (diceRoll < junction.probabilities[i] ) {return junction.outComponents[i];} 
				} 
			}

			// var nextComponent = junction.connectedComponents[0];
		}

	}

	this.collideConnectedJunctionOld = function( electron, obstacle ) {
		var thisJunction = obstacle.object;
		var connectedComponent = components[thisJunction.connectedComponentID];
		//var connectedComponent = components[thisJunction.connectedComponentIDs[0]];
		//first check if the connected component is a battery
		// TEMP: for now, I assume that no more than one battery connected together
		if (connectedComponent.compType == "Battery") {
			if ( connectedComponent.startJunction.connectedComponentID == this.ID ) {
				// if the other end of battery is also connected to another component & it is a closed loop
				// then transfer the electron to the other side
				if (connectedComponent.endJunction.connectedComponentID != -1
					&& this.force.length() != 0.0) {
					this.passFromBattery( electron, connectedComponent.startJunction, connectedComponent.endJunction, connectedComponent);
					//electron.componentID = thisJunction.connectedComponentID;
					var nextComponent = components[electron.componentID];
					var nextObstacle = collision(electron, nextComponent.obstacles);
					if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
						if ( nextObstacle.object == nextComponent.startJunction 
							|| nextObstacle.object == nextComponent.endJunction ) {
							bounceBack(electron, nextObstacle, this);
						}
					}
                }
				else {  // if the battery is not connected from the other side, bounce back the electron
					bounceBack(electron, obstacle, this);
				}
			}
			else {     //it is connected to battery's end junction
				if (connectedComponent.startJunction.connectedComponentID != -1
					&& this.force.length() != 0.0 ) {
					this.passFromBattery( electron, connectedComponent.endJunction, connectedComponent.startJunction, connectedComponent);
					//electron.componentID = thisJunction.connectedComponentID;
					var nextComponent = components[electron.componentID];
					var nextObstacle = collision(electron, nextComponent.obstacles);
					if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
						if ( nextObstacle.object == nextComponent.startJunction 
							|| nextObstacle.object == nextComponent.endJunction ) {
							bounceBack(electron, nextObstacle, this);
						}
					}
				}
				else { // if the battery is not connected from the other side, bounce back the electron
					bounceBack(electron, obstacle, this);
				}
			}

		}

		else {   // if the connected component is not a battery
			electron.componentID = thisJunction.connectedComponentID;
			var nextObstacle = collision(electron, connectedComponent.obstacles);
			if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
				if ( nextObstacle.object == connectedComponent.startJunction 
					|| nextObstacle.object == connectedComponent.endJunction ) {
					bounceBack(electron, obstacle, this);
				}
			}	
		}


	}

	this.createAmmeter = function() {
		var cylinderGeometry = new THREE.CylinderGeometry( this.w * 0.52, this.w * 0.52, standardLength/10, 24, 1, false);
	    var boxGeometry = new THREE.BoxGeometry(standardLength/5, standardLength/5, standardLength/5);
        var ammeterMaterial = new THREE.MeshBasicMaterial( { color: orange } );  // or darkGreen

        this.ammeter = new THREE.Mesh( cylinderGeometry, ammeterMaterial );
        //var object2 = new THREE.Mesh( boxGeometry, ammeterMaterial );
        //object2.position.set(-this.w*0.52 - standardLength/10, 0, 0);
        //object1.add(object2);
        this.ammeter.count = 0;

        ammeterMaterial.transparent = true;
	    ammeterMaterial.opacity = 0.6;

	    this.ammeter.visible = false;

    	        //this.ammeter = object1;
        this.container.add(this.ammeter);
        this.obstacles.push(this.ammeter);
       
        // Add text
        var randomColor = Math.floor( Math.random() * 255 );  // instead of r: 255
		// var spriteText1 = makeTextSprite( " I = " + this.current.toFixed(3) + " ", 
		// 	{ fontsize: 52, fontface: "arial", borderColor: {r:153, g:76, b:0, a:1.0}, backgroundColor: {r:155, g:128, b:0, a:0.8} } );
		// spriteText1.position.set(-this.w, -standardLength/5, 0);

		//this.text2 = " rate = " + this.ammeter.count.toFixed(2) + " ";
		// var rate = this.ammeter.count;
		// console.log(rate);

		// this.text2 = Math.abs(rate.toFixed(2)) + " electrons per clock tick";
		// //this.text2 = " 0 electrons per clock tick " ;
		// var spriteText2 = makeTextSprite( this.text2, 
		// 	{ fontsize: 52, fontface: "arial", borderColor: {r:153, g:76, b:0, a:1.0}, backgroundColor: {r:255, g:153, b:0, a:0.8} } );
		// spriteText2.position.set(-this.w, standardLength/5, 0);
		
	    //this.ammeter.add( spriteText1 );
	    //this.ammeter.add( spriteText2 );
	}

	this.updateAmmeter = function() {
		//var rate = this.ammeter.count/(ticks-10);
		var rate = (this.ammeter.count + this.prevCount)/2;


		//this.text2 = Math.abs(rate.toFixed(2)) + " electrons per clock tick ";
		//this.text2 = "Speed = " + Math.abs(rate.toFixed(0));
		if ( Math.round(Math.random()) == 1 ) {
			this.text2 = Math.floor(this.current * 20) + " electrons";
		}
		else {
			this.text2 = Math.ceil(this.current * 20) + " electrons";
		}
		
		this.ammeter.remove(this.ammeter.children[0]);  // used to be children[1] when I had text 1
		var spriteText2 = makeTextSprite( this.text2, 
			{ fontsize: 54, fontface: "arial", borderColor: {r:153, g:76, b:0, a:1.0}, backgroundColor: {r:255, g:153, b:0, a:0.8} } );
		spriteText2.position.set(this.w, 0, 0);
		
		this.ammeter.add( spriteText2 );
		this.ammeter.count = 0;
		this.prevCount = rate;

	}

	this.clicked2 = function() {
		if ( this.ammeter.visible == false ) {
			this.ammeter.visible = true;
		}
		else {
			this.ammeter.visible = false;
		}
	}

	this.showAmmeter = function( flag ) {
		if ( flag ) {
			this.ammeter.visible = true;
		}
		else {
			this.ammeter.visible = false;
		}
	}


	this.clicked = function() {
		if (this == clickedComponent) { // if this is the same component as clicked last time, unclick it
			clickedComponent = null;
			var receiver = window.parent;
			if (!twoScreen) receiver.postMessage(-1, 'http://localhost:8080');
			else { // clear the measures in the voltmeter image
				clearValues();
			}

			if (this.compType == "Battery") { this.container.material.color.set(darkGreen); }
			else if (this.compType == "Wire") { this.container.material.color.set(lightGray); }
			else { this.container.material.color.set(gray); }
			this.showAmmeter(false);
			return;
		}
		else { // if this is the first time this component is clicked
    		var receiver = window.parent;
			if (!twoScreen) receiver.postMessage(this.ID, 'http://localhost:8080');
			else { // show the measures in the voltmeter image
				showValues(this.compType, this.volt, this.current, this.R);
			}

			if (clickedComponent != null) {
				if (clickedComponent.compType == "Battery") { clickedComponent.container.material.color.set(darkGreen); }
				else if (clickedComponent.compType == "Wire") { clickedComponent.container.material.color.set(lightGray); }
				else { clickedComponent.container.material.color.set(gray); }
				clickedComponent.showAmmeter(false);
			}
			this.container.material.color.set(darkOrange);
			clickedComponent = this;
			if (this.compType != "Battery") this.showAmmeter(true);
		}
	}

	this.createElectrons = function( component ) {
			for ( i = 0; i < component.electronCount; i ++ ) {
				var electron = new Electron(component);
				electronObjects.push(electron);
				electronGeometry.vertices.push( electron.position );
			}
	}

}
