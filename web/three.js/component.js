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
var red = 0xD11919;
var darkRed = 0x990000;
var green = 0x008F00;
var darkGreen = 0x003300;
var gray = 0x808080;

var electronSize = 40;
var rectGeom, rectMesh;
var ionGeometry = new THREE.SphereGeometry( 5, 16, 16 );
var ionMaterial = new THREE.MeshBasicMaterial( {color: darkRed , transparent: true} ); // later: there was something wrong with MeshPhongMaterial that it did not change the color, so I changed it to basic material.
var velocity = 2;
var standardLength = 200; // it is 100 multiplies by the factor (here 2) that it is scaled by when passed from Parse


 /*
 * component inputs:
 * type: "Wire", "Resistor", "Bulb", or "Battery"
 * current: electric current measure
 * res: electric resistance measure
 * volt: voltage measure
 * startX: X coordinate of start point
 * startY: Y coordinate of start point
 * endX: X coordinate of end point
 * endY: Y coordinate of end point
 * direction: 1 if from start to end, -1 if from end to start, 0 if no current
 * connections: XXX
 * graphlabel: XXX
	
 */

function Component(type, current, res, volt, startX, startY, endX, endY, direction, connections, graphLabel) {
 	this.compType = type; // "wire", "resistor", "bulb", "battery"
  	this.current = current;
  	this.R = res;
  	this.volt = volt;
  	this.startPoint = new THREE.Vector3( startX, startY, 0.0 );
  	this.endPoint = new THREE.Vector3( endX, endY, 0.0 ); 
  	this.direction = direction; // 0 if v=0; 1 if from Start to End; -1 if from End to Start
  	this.graphLabel = graphLabel;
  	this.ID;
  	this.electronCount; // Change it later
  	this.ionCount; //Change it later
  	this.l = Math.sqrt((endX-startX)*(endX-startX)+(endY-startY)*(endY-startY));
  	this.w = 110;
  	this.h = 30; // height of box (i.e., depth of it in z direction)
  	this.ions = [];
  	this.obstacles = [];
  	this.container;
  	this.startJunction;
  	this.endJunction;

   	this.connections = connections;

   	console.log(this.compType + " :");
   	console.log(this.direction);

  	// calculate the rotation angle of the component on the XY plane (-180 to 180 from +x axis)
	var startToEnd = new THREE.Vector3( endX-startX, endY-startY, 0.0); // z is 0 (reading from Parse)
	var xAxis = new THREE.Vector3(1, 0, 0);
	var angle = startToEnd.angleTo(xAxis);
	var vector = new THREE.Vector3();
	vector.crossVectors(xAxis, startToEnd);
	var sign = Math.sign(vector.z);		
	var rotationAngle = angle*sign;
	this.rotationAngle = rotationAngle;

  	if (this.compType == "Wire") {
  		//this.electronCount = 1;
  		this.electronCount = Math.round( 10 * this.l/standardLength); // this.l might not be an integer
  	}
  	else if ( this.compType == "Battery" ){
  		this.electronCount = 0;
  	}
  	else { 		// Resistor or Bulb
  		this.electronCount = 10;
  	}
 

  	this.init = function( electronGeometry, ID ) {
  		this.ID = ID;
  		this.computeForce();		
		this.createContainer();
		// transform the force vector
		var length = this.force.length();
		this.force.transformDirection(this.container.matrixWorld); //normalized
		this.force.multiplyScalar(length); 
		//if (this.compType != 'Battery') {
			this.createElectrons(electronGeometry);
		//}
	}

	this.computeForce = function() {
		this.force = new THREE.Vector3();
	  	this.force.x = 0.0; 
	  	this.force.y = this.direction * this.volt; // force is in y direction, because the cylinder's axis is initially in y then I rotate it
	  	//if (this.compType == "Wire") { this.force.y *= 1000; }
	  	this.force.z = 0.0;
	}

	this.createContainer = function() {
		var center = new THREE.Vector3( (this.startPoint.x + this.endPoint.x) / 2, 
										(this.startPoint.y + this.endPoint.y) / 2, 
										0.0 );

		// var containerGeometry = new THREE.BoxGeometry( this.l, this.w, this.h);
		/* CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
		* radiusSegment = 24 (default value: 8)
		* heightSegments = 1 (default value)
		* openEnded = true (default is false)
		*/
		var containerGeometry = new THREE.CylinderGeometry( this.w/2, this.w/2, this.l, 24, 1, true); 

/*		if (this.compType == "Resistor" || this.compType == "Bulb") {
			var containerMaterial = new THREE.MeshBasicMaterial( { map: resistorImg, color: 0xCCCC00 } );
		}
		else */if (this.compType == "Battery") {
			var containerMaterial = new THREE.MeshBasicMaterial( { color: darkGreen } );
		}
		else {
			var containerMaterial = new THREE.MeshBasicMaterial( { color: 0xB2B2B2 } );
			containerMaterial.transparent = false;
			containerMaterial.opacity = 0.7;
			//containerMaterial.depthTest = false;
			containerMaterial.depthWrite = false;
		}


		this.container = new THREE.Mesh( containerGeometry, containerMaterial );

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
		// console.log("component " + this.ID + ": ")
		// console.log(this.startJunction.connectedComponentIDs);

		// create ions and add them to the box
		if (this.compType != "Battery") { this.createIons(); }
		this.container.material.side = THREE.BackSide;  // for collision detection code
  		this.obstacles.push(this.container); // for collision detection code

		//transform the box
		this.container.position.set(center.x, center.y, center.z);
		this.container.rotation.z = this.rotationAngle - Math.PI/2; // I added "-Math.PI/2" (from BoxGeometry)
		this.container.updateMatrixWorld(); // because it is not in the render() loop yet, I need to manually update the matrix for electrons
	}

	this.createJunction = function(thetaStart, yPos) {
		/* for the geometry make a half sphere, with vertical angel sweeping Math.PI:
		 * SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
		 here I changed the thetaLength from Math.PI (default) to Math.PI/2
		 --> the end junction is capped correctly, but I need to rotate the start junction along the y axis
		 */
		var junction = new THREE.Mesh( new THREE.SphereGeometry(this.w/2, 64, 64, 0, Math.PI*2, thetaStart, Math.PI/2), 
										new THREE.MeshBasicMaterial( { color: red } ));
		junction.material.transparent = true;
		junction.material.opacity = 0.5;
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

	this.updateJunctions = function() {
		this.formJunctionCurrents( this.startJunction, "start" );
		this.formJunctionCurrents( this.endJunction, "end" );
	} 
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

/*		// TEST
		if (this.ID == 0) { this.current = 1.5; junction.currents = [0.4, 0.1, 1];}
		if (this.ID == 1) { this.current = 0.4; junction.currents = [-1.5, 0.1, 1];}
		if (this.ID == 2) { this.current = 0.1; junction.currents = [-1.5, 0.4, 1];}
		if (this.ID == 3) { this.current = 1; junction.currents = [-1.5, 0.4, 0.1];}

		console.log("component " + this.ID + " " + string + ": " + junction.currents);*/

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
		console.log("out " + this.ID + " " + string + ": " + junction.outCurrents);
		if (this.current != 0.0) {
			var norm = Math.min.apply( Math, junction.outCurrents );
			junction.probabilities = junction.outCurrents.map(function(a) {
	    							return (a/norm);
								});
		}

		for (i=1; i < junction.probabilities.length; i++) {  // start from the second element
			junction.probabilities[i] += junction.probabilities[i-1];
		}
		console.log("prob " + this.ID + " " + string + ": " + junction.probabilities);

		// var c = this.findNextComponent(junction);
		// if (c != null) {console.log("next " + this.ID + " " + string + ": " + c.ID);}
		// else {console.log("next " + this.ID + " " + string + ": " + c);}


	}

	this.createIons = function() {		
		var count = 0;
		var d = 40; // d is inverse of density of ions which is inversly proportional to resistance		
		if (this.compType == "Resistor" || this.compType == "Bulb") {
			var d = 30 - 5 * this.R;
		}
		for ( i = 1; i < this.l/d; i ++ ) {
			for (j = 1; j < this.w/d; j++) {
				var pos;
				if ((i+j) % 3 == 0) {
					pos = new THREE.Vector3();
					pos.y = -this.l/2 + i * d; // I switched the order of x & y (from BoxGeometry)
					pos.x = -this.w/2 + j * d;
					pos.z = 0.002;

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
  			//this.obstacles.push(this.ions[i]);	
  		}	
	}

	this.createElectrons = function( electronGeometry ) {
		for ( i = 0; i < this.electronCount; i ++ ) {

			var electron = new THREE.Vector3();
/*			// I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
			electron.x = Math.random() * (this.l - 5) - (this.l - 5) /2; //the x coordinate changes based on component length 
			electron.y = Math.random() * (this.w - 5) - (this.w - 5)/2; // component width 
			//electron.z = 0.0;
			electron.z = Math.random() * (this.h - 5) - (this.h - 5)/2; // component width*/

			// I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
			electron.x = Math.random() * (this.w - 5) - (this.w - 5)/2; //the x coordinate changes based on component length 
			electron.y = Math.random() * (this.l - 5) - (this.l - 5)/2; // component width 
			
			if (twoD) {
				electron.z = 0.002;
			}	
			else {
				//electron.z = Math.random() * (this.w - 5) - (this.w - 5)/2;
				var zLimit = Math.sqrt((this.w - 5) * (this.w - 5) - (4*electron.x * electron.x));
				electron.z = Math.random() * zLimit - zLimit/2; // calculations of random xz coordinate on a circle shape (cross section of a cylinder on xz plane)
			}	

			// now initiate electron velocity
			if (twoD) {
				// initiate a 2D velocity (no z direction)
				var vX = Math.random() * velocity * 2 - velocity;
			    var vY = Math.sqrt( velocity * velocity - vX*vX);   // this results in a constant velocity	
				// I need to give a random sign to vY with 50-50 probability
			    if ( Math.round(Math.random()) == 1 ) vY *= -1;
			    vZ = 0.0;
			}
			else {
				// initiate a 3D velocity
				var vX = Math.random() * velocity * 2 - velocity;
				var vYZ = Math.sqrt( velocity * velocity - vX * vX );
				var vY = Math.random() * vYZ * 2 - vYZ;
				var vZ = Math.sqrt( vYZ * vYZ - vY * vY); // this results in a constant velocity in 3D		    
			    // I need to give a random sign to vY & vZ with 50-50 probability
			    if ( Math.round(Math.random()) == 1 ) vY *= -1;
			    if ( Math.round(Math.random()) == 1 ) vZ *= -1;
			}

			electron.velocity = new THREE.Vector3(
		    	vX,		// x
		    	vY,		//  
		    	vZ);		// z

			//translate the electron to be inside the component
			//this.container.localToWorld(electron); // this changes the position of electron from local to world
			electron.applyMatrix4( this.container.matrixWorld );
			electron.componentID = this.ID;
			electronGeometry.vertices.push( electron );
		}	

	}


	this.updateElectron = function ( electron ) {
		var obstacle = this.collision(electron);
		if (obstacle == null) { 	// no colision
			this.moveElectron(electron);
		}
		else {   // a collision is detected
			
			if ( obstacle.object == this.startJunction || 
				 obstacle.object == this.endJunction ) {
				if ( obstacle.object.connectedComponentIDs.length > 0 ) { // if it is connected to another component, change the electron's component ID
															   // and wait for it to move next time
				    this.collideConnectedJunction( electron, obstacle );
				}
				else {   // if the junction is not connected, bounce back the electron

					this.bounceBack(electron, obstacle);
				}
			}
			else {  // the obstacle is either component walls or ions, so bounce it back
				this.bounceBack(electron, obstacle);
			}
			
		}
	}

	this.collideConnectedJunction = function( electron, obstacle ) {
		var thisJunction = obstacle.object;
		//var connectedComponent = thisJunction.connectedComponents[0];
		var nextComponent = this.findNextComponent( thisJunction );
		if ( nextComponent == null ) {this.bounceBack(electron, obstacle);}	
		else {

			//first check if the connected component is a battery
			// TEMP: for now, I assume that no more than one battery connected together
			if (nextComponent.compType == "Battery") {
				if ( nextComponent.startJunction.connectedComponentIDs[0] == this.ID ) {
					// if the other end of battery is also connected to another component & it is a closed loop
					// then transfer the electron to the other side
					if (nextComponent.endJunction.connectedComponentIDs.length > 0
						&& this.force.length() != 0.0) {
						this.passFromBattery( electron, nextComponent.startJunction, nextComponent.endJunction, nextComponent);
						//electron.componentID = thisJunction.connectedComponentID;
						var afterComponent = components[electron.componentID];
						var afterObstacle = afterComponent.collision(electron);
						if (afterObstacle != null) {    // this is to avoid electrons stucking in overlap area
							if ( afterObstacle.object == afterComponent.startJunction 
								|| afterObstacle.object == afterComponent.endJunction ) {
								this.bounceBack(electron, afterObstacle);
							}
						}
	                }
					else {  // if the battery is not connected from the other side (or is connected but I=0)
							//	 bounce back the electron
						this.bounceBack(electron, obstacle);
					}
				}
				else {     //it is connected to battery's end junction
					if (nextComponent.startJunction.connectedComponentIDs.length > 0
						&& this.force.length() != 0.0 ) {
						this.passFromBattery( electron, nextComponent.endJunction, nextComponent.startJunction, nextComponent);
						//electron.componentID = thisJunction.connectedComponentID;
						var afterComponent = components[electron.componentID];
						var afterObstacle = afterComponent.collision(electron);
						if (afterObstacle != null) {    // this is to avoid electrons stucking in overlap area
							if ( afterObstacle.object == afterComponent.startJunction 
								|| afterObstacle.object == afterComponent.endJunction ) {
								this.bounceBack(electron, afterObstacle);
							}
						}
					}
					else { // if the battery is not connected from the other side, bounce back the electron
						this.bounceBack(electron, obstacle);
					}
				}

			}

			else {   // if the connected component is not a battery
				electron.componentID = thisJunction.connectedComponentIDs[0];
				var nextObstacle = nextComponent.collision(electron);
				if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
					if ( nextObstacle.object == nextComponent.startJunction 
						|| nextObstacle.object == nextComponent.endJunction ) {
						this.bounceBack(electron, obstacle);
					}
				}	
			}
		}


	}

	this.findNextComponent = function( junction ) {
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

	this.passFromBattery = function( thisElectron, firstJunction, secondJunction, battery ) {
		var pushVector = new THREE.Vector3();
		pushVector.subVectors(secondJunction.position, firstJunction.position);
		var length = pushVector.length();  // TEST: 1.01
 		pushVector.transformDirection(battery.container.matrixWorld); //normalized 
		pushVector.multiplyScalar(length);

		if (ArFlag) {  //AR condition
			// first transform the electron position with the world matrix, move it to the next component
			// then use inverse matrix to transform the position back to the electrons local position
			thisElectron.applyMatrix4(electrons.matrixWorld);
			thisElectron.add(pushVector);
			var m = new THREE.Matrix4();
			m = m.getInverse(electrons.matrixWorld);
			thisElectron.applyMatrix4(m);
		}
		else {   // non-AR condition
			thisElectron.add(pushVector);
		}	

		thisElectron.componentID = secondJunction.connectedComponentIDs[0];	
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
					var nextObstacle = nextComponent.collision(electron);
					if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
						if ( nextObstacle.object == nextComponent.startJunction 
							|| nextObstacle.object == nextComponent.endJunction ) {
							this.bounceBack(electron, nextObstacle);
						}
					}
                }
				else {  // if the battery is not connected from the other side, bounce back the electron
					this.bounceBack(electron, obstacle);
				}
			}
			else {     //it is connected to battery's end junction
				if (connectedComponent.startJunction.connectedComponentID != -1
					&& this.force.length() != 0.0 ) {
					this.passFromBattery( electron, connectedComponent.endJunction, connectedComponent.startJunction, connectedComponent);
					//electron.componentID = thisJunction.connectedComponentID;
					var nextComponent = components[electron.componentID];
					var nextObstacle = nextComponent.collision(electron);
					if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
						if ( nextObstacle.object == nextComponent.startJunction 
							|| nextObstacle.object == nextComponent.endJunction ) {
							this.bounceBack(electron, nextObstacle);
						}
					}
				}
				else { // if the battery is not connected from the other side, bounce back the electron
					this.bounceBack(electron, obstacle);
				}
			}

		}

		else {   // if the connected component is not a battery
			electron.componentID = thisJunction.connectedComponentID;
			var nextObstacle = connectedComponent.collision(electron);
			if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
				if ( nextObstacle.object == connectedComponent.startJunction 
					|| nextObstacle.object == connectedComponent.endJunction ) {
					this.bounceBack(electron, obstacle);
				}
			}	
		}


	}

	this.moveElectron = function (electron) {
		// // transform the force vector
		// var length = this.force.length();
		// this.force.transformDirection(this.container.matrixWorld); //normalized
		// this.force.multiplyScalar(length); 

		// update velocity
		electron.velocity.add( this.force );

		var v = electron.velocity.length();
			if (v > 4) {	// don't allow the speed to become more than 10, which is the distance for raycaster
				
				electron.velocity.sub( this.force );
			}

		// move the electron
		electron.add( electron.velocity );
	}
	
	/* here instead of computing the ray vector in local space, I am computing the face normal
	* in world coordinates and then I use the .reflect() method to calculate the reflection of 
	* the ray. 
	* reflection formula:  r=d−2(d⋅n)n (where d is the ray, and n is a normalized normal, and d.n is a dot product)
	*/
	
	this.bounceBack = function( electron, obstacle ) {
		// first, calculate the normal vector in world coordinate
		var normalMatrix = new THREE.Matrix3().getNormalMatrix( this.container.matrixWorld ); // the normal matrix (upper left 3x3) of the passed matrix4. The normal matrix is the inverse transpose of the matrix m.

		var n = obstacle.face.normal;
		// this part is for 2D movement of electrons (z=0)
		if (twoD) {
			n.z = 0.0; // project the normal vector on the xy plane (in local space of container)
		}
		var worldNormal = n.clone().applyMatrix3( normalMatrix ).normalize();
		if (obstacle.object == this.container) worldNormal.multiplyScalar( -1 ); // reverse the direction of normal for container, as the normal vector for the container is towards outside
		if (obstacle.object == this.startJunction || obstacle.object == this.endJunction) worldNormal.multiplyScalar( -1 );    // check this later!



		// now calculate the reflection, non-AR condtion
		if (!ArFlag) {
		var reflection = electron.velocity.clone().reflect(worldNormal);
		electron.velocity = reflection;
		}

		// calculate the reflection for AR condition
		if (ArFlag) {
			var length = electron.velocity.length();
			var direction = new THREE.Vector3();
			direction.copy(electron.velocity);
			direction.transformDirection(electrons.matrixWorld); //transform direction also normalizes the vector
			var reflection = direction.reflect(worldNormal);
			var m = new THREE.Matrix4();
			m = m.getInverse(electrons.matrixWorld);
			reflection.transformDirection(m);
			electron.velocity = reflection.multiplyScalar(length);
		}	


	 }
	 
	
	// here instead of computing the face normal in world coordinate, I am computing the ray vector
	// i.e., the electron velocity vector in box's local space.
	// obstacle.face.normal --> returns the face normal in local space 
	
	this.bounceBackOld = function ( electron, obstacle ) {
		var n = obstacle.face.normal; // it returns the face normal in box's local space
		//console.log(n.x + ' ' + n.y + ' ' + n.z);
		//n.z = 0; // we just want the image of the normal vector on the XY plane with Z = 0
		var localVelocity = new THREE.Vector3(); 
		localVelocity.copy(electron.velocity);
		//localVelocity.applyMatrix4(electrons.matrixWorld); // apply JsAr transformations
		var length = localVelocity.length();
		localVelocity.transformDirection(this.container.matrix.transpose()); //later: check why I needed to add transpose
		localVelocity.multiplyScalar(length);
		//localVelocity.applyAxisAngle(new THREE.Vector3(0, 0, -1), this.rotationAngle); //worked before adding AR

		var theta = localVelocity.angleTo(n);
		var Beta = (2 * theta) - Math.PI ;
		var rotationAxis = new THREE.Vector3(); // 
		rotationAxis.crossVectors( localVelocity, n );
		if (Beta == Math.PI/2) { 	// if velocity is tangential to the ion sphere
			this.moveElectron(electron);
		}
		if (rotationAxis.length() == 0) {	// if Beta is 180 degrees the cross vector is zero, set rotation axis to z axis (sign does not matter anymore)
			rotationAxis = (0,0,1);
		}
		else {
			rotationAxis = rotationAxis.normalize(); 
		}
		//rotationAxis = rotationAxis.normalize();
		electron.velocity.applyAxisAngle( rotationAxis, Beta );
	}		

	this.collision = function ( electron ) {
		var direction = new THREE.Vector3();
		direction.copy(electron.velocity);
		direction.transformDirection(electrons.matrixWorld); //transform direction also normalizes the vector
		var origin = new THREE.Vector3();
		origin.copy(electron);
		origin.applyMatrix4(electrons.matrixWorld);
		raycaster.set(origin, direction);
		//var distance = 10;
		raycaster.near = 0;
		raycaster.far = 5;
		var collisions = raycaster.intersectObjects(this.obstacles, true);
		// if (collisions.length > 0 && collisions[0].distance <= distance) {
		if ( collisions.length > 0 ) {
			//console.log(collisions[0].faceIndex);	
		 	return collisions[0];
		 }
		 else {
		 	return null;
		 }
	}

}
