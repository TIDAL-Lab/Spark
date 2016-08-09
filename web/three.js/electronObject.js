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

var electronSize = 40;
var velocity = 4;
//var velocityMax = 20;
var lossFactor = 0.9;

function Electron( component ) {
		this.position = new THREE.Vector3();

		// INIT XYZ POSITION

		// I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
		this.position.x = Math.random() * (component.w - 5) - (component.w - 5)/2; //the x coordinate changes based on component length 
		this.position.y = Math.random() * (component.l - 5) - (component.l - 5)/2; // component width 
		
		if (twoD) {
			this.position.z = offsetZ;
		}	
		else { // 3D movement of electrons
			var zLimit = Math.sqrt((component.w - 5) * (component.w - 5) - (4*this.position.x * this.position.x));
			this.position.z = Math.random() * zLimit - zLimit/2; // calculations of random xz coordinate on a circle shape (cross section of a cylinder on xz plane)
		}	

		// INIT VELOCITY

		if (twoD) { // initiate a 2D velocity (no z direction)
			
			var vX = Math.random() * velocity * 2 - velocity; // a random value b/w -velocity & velocity
		    var vY = Math.sqrt( velocity * velocity - vX*vX);   // component.results in a constant velocity	
		    if ( Math.round(Math.random()) == 1 ) vY *= -1; // I need to give a random sign to vY with 50-50 probability
		    vZ = 0.0;
		}
		else { // initiate a 3D velocity		
			var vX = Math.random() * velocity * 2 - velocity;
			var vYZ = Math.sqrt( velocity * velocity - vX * vX );
			var vY = Math.random() * vYZ * 2 - vYZ;
			var vZ = Math.sqrt( vYZ * vYZ - vY * vY); // component.results in a constant velocity in 3D		     
		    if ( Math.round(Math.random()) == 1 ) vY *= -1; // I need to give a random sign to vY & vZ with 50-50 probability
		    if ( Math.round(Math.random()) == 1 ) vZ *= -1;
		}

		this.velocity = new THREE.Vector3(
	    	vX,		
	    	vY,		  
	    	vZ);
		
		//translate the electron to be inside the component
		this.position.applyMatrix4( component.container.matrixWorld );
		this.componentID = component.ID;
		this.component = component;
		this.reflectedTimes = 0;   // count the number of times bouncing off
		this.status = "init";  // for debugging (issue with electrons leaving the container)	
		this.testFlag = false;



	this.updateElectron = function() {
		var component = this.component;

		this.velocity.add(component.force);
		var obstacle = this.collision(component.obstacles);
		if (obstacle == null) { 	// no colision

			this.moveElectron();
			//this.findElectronsOutside();

		}
		else {   // a collision is detected
			
			// CHECK COLLISIONS WITH JUNCTIONS
			if ( obstacle.object == component.startJunction || obstacle.object == component.endJunction ) {
				if ( obstacle.object.connectedComponentIDs.length > 0 ) { // if it is connected to another component, change the electron's component ID
															   // and wait for it to move next time
				    this.collideConnectedJunctions( obstacle, component );
				}
				else {   // if the junction is not connected, bounce back the electron

					this.bounceBack(obstacle.face.normal, component);
				}
			}

			// CHECK COLLISION WITH THE AMMETER
			else if (obstacle.object == component.ammeter) {
				this.collideAmmeter(obstacle, component);
			}

			// THE OBSTACLE IS AN ION
			else {  // bounce the electron back (change: no component walls as obstacles anymore)
				this.bounceBack(obstacle.face.normal, component);
			}			
		}		
	}

	this.worldToLocalOld = function(position) {   //only works for non-AR condition, not for AR
		var m = new THREE.Matrix4();
		m = m.getInverse(this.component.container.matrixWorld);
		var local = new THREE.Vector3().copy(position);
		local.applyMatrix4(m);
		return local;
	}


	this.worldToLocal = function(position) {
		var m = new THREE.Matrix4();
		//m = m.getInverse(this.component.container.matrixWorld);
		m = m.getInverse(this.component.initialMatrix);
		var local = new THREE.Vector3().copy(position);
		local.applyMatrix4(m);
		return local;
	}


	this.moveElectron = function() {
		
		var v = this.velocity.length();
		var vMax = this.component.velocityMax;
/*		if (this.velocity.length() > vMax) {	// don't allow the speed to become more than 10, which is the distance for raycaster
			this.velocity.setLength(vMax-0.01);
		}
		if (this.velocity.length() > vMax) console.log("error: velocity exceeds the max velocity");*/

		this.position.add( this.velocity );
		this.status = "moved";

		var isOutside = this.findElectronsOutside();
		if (isOutside) this.reflectedTimes += 1; 
		else this.reflectedTimes = 0;
	}


	this.findElectronsOutside = function() {
		this.testFlag = false;
		// check if it is in the container box
		var component = this.component;
		var electronLocal = this.worldToLocal(this.position);
		if (Math.abs(electronLocal.y) <= component.l/2) {
			if (Math.abs(electronLocal.x) >= component.w/2) { // the electron is outside of the container cylinder
				this.position.sub(this.velocity);
				// Make sure it's not out of the box anymore
				var local2 = this.worldToLocal(this.position);
				if (Math.abs(local2.y) <= component.l/2) {
					if (Math.abs(local2.x) >= component.w/2) { 
						console.log("ERROR WALL");
						//stop = !stop; 
					} }
				var normal = new THREE.Vector3(1,0,0);
				if (electronLocal.x > 0) normal.multiplyScalar(-1);
				this.testFlag = true;
				this.bounceBack(normal, component);
				return true;
			}
		}
		else {   // check if the electron is outside of the two junctions
			var x = electronLocal.x;
			var y = Math.abs(electronLocal.y) - component.l/2
			var distance = Math.sqrt(( x * x ) + ( y * y ));
			if ( distance >= component.w/2 ) {  // the electron is outside of the two junctions
				this.position.sub(this.velocity);
				// Make sure it's not out of the box anymore
				var local2 = this.worldToLocal(this.position);
				if (Math.abs(local2.y) <= component.l/2) {
					if (Math.abs(local2.x) >= component.w/2) { 
						console.log("ERROR JUNCTION");
						//stop = !stop; 
					} }
				var normal = new THREE.Vector3(-x , -y, 0);
				if (electronLocal.y < 0) normal.y = y;
				this.bounceBack(normal, component);
				return true;
			}
		}
		return false;  // no electron out of container 
	}

	this.collision = function( obstacles ) {
		var length = this.velocity.length();
		if (ArFlag) {
			var direction = new THREE.Vector3();
			direction.copy(this.velocity);  // in local space / force is already added
			direction.transformDirection(electronVertices.matrixWorld); //transform direction to world space also normalizes the vector
			var origin = new THREE.Vector3();
			origin.copy(this.position);
			origin.applyMatrix4(electronVertices.matrixWorld);    // CHECK LATER: it seems it's already transformed when electrons are created
		}
	
		else {
			var direction = new THREE.Vector3().copy(this.velocity).normalize();	
			var origin = new THREE.Vector3().copy(this.position); 
		}

		raycaster.set(origin, direction);

		//raycaster.set( electron, electron.velocity);
		// var distance = length + (electronSize * 2);
		raycaster.near = 0.001;
		//raycaster.far = length + electronSize;
		raycaster.far = length;
		var collisions = raycaster.intersectObjects(obstacles, false);
		//if (collisions.length > 0 && collisions[0].distance <= distance) {
		if ( collisions.length > 0 ) {
			//console.log(collisions.length);	
		 	return collisions[0];
		 }
		 else {
		 	return null;
		 }
	}

	this.bounceBack = function( normal, component ) {  // normal is the face normal in local space
		//electron.velocity.sub(component.force);
		// first, calculate the normal vector in world coordinate
		var normalMatrix = new THREE.Matrix3().getNormalMatrix( component.container.matrixWorld ); // the normal matrix (upper left 3x3) of the passed matrix4. The normal matrix is the inverse transpose of the matrix m.

		// this part is for 2D movement of electrons (z=0)
		if (twoD) { normal.z = 0.0; } // project the normal vector on the xy plane (in local space of container)

		var worldNormal = new THREE.Vector3().copy(normal).applyMatrix3( normalMatrix ).normalize();
		//var worldNormal = normal.clone().applyMatrix3( normalMatrix ).normalize();
		// if (obstacle.object == component.container) worldNormal.multiplyScalar( -1 ); // reverse the direction of normal for container, as the normal vector for the container is towards outside
		// if (obstacle.object == component.startJunction || obstacle.object == component.endJunction) worldNormal.multiplyScalar( -1 );    // check this later!


		//if (Math.abs(worldNormal.z) > 0.2) console.log("normal vector in z direction " + this.testFlag);
		
		// now calculate the reflection
		this.reflect( worldNormal );

		//if ( component.volt > 0 ) electron.velocity.multiplyScalar(lossFactor); // due to collision, lose energy
		this.status = "bounced back";
		this.reflectedTimes  += 1;
		if (this.reflectedTimes > 1) {  // check if the electron is stuck
			var l = this.velocity.length();
			//console.log(l);
			//this.velocity.setLength(l/2);
			//console.log(this.velocity.length());
			this.velocity.applyAxisAngle(new THREE.Vector3(0,0,1), Math.PI/10); // rotate it by a small degree, for example 18
			//console.log(this.reflectedTimes);
			this.reflectedTimes -= 1;
		}
		//if (this.reflectedTimes != 1) console.log(this.reflectedTimes);
		
	 }


	 this.reflect = function( worldNormal) {
	 	//non-AR condtion
	 	if (!ArFlag) {
			var reflection = this.velocity.clone().reflect(worldNormal);
			this.velocity = reflection;
		}

		// calculate the reflection for AR condition
		if (ArFlag) {
			var length = this.velocity.length();
			var direction = new THREE.Vector3();
			direction.copy(this.velocity);
			direction.transformDirection(electronVertices.matrixWorld); //transform direction also normalizes the vector
			var reflection = direction.reflect(worldNormal);
			var m = new THREE.Matrix4();
			m = m.getInverse(electronVertices.matrixWorld);
			reflection.transformDirection(m);
			this.velocity = reflection.multiplyScalar(length);
		}
		this.velocity.setLength(velocity);
	}

	this.collideAmmeter = function( obstacle, component ) {
		this.moveElectron();
		var n = obstacle.face.normal;      //the normal vector in local coordinates is either (0,1,0) or (0,-1,0)
		component.ammeter.count += n.y; 
	}

	this.collideConnectedJunctions = function( obstacle, component ) {
		this.velocity.sub(component.force);
		var thisJunction = obstacle.object;
		var nextComponent = component.findNextComponent( thisJunction );
		if ( nextComponent == null ) {this.bounceBack( obstacle.face.normal, component);}  // no out current in the node	
		
		else {
			
			// NEXT COMPONENT != BATTERY
			if (nextComponent.compType != "Battery") {   // if the connected component is not a battery
				//var nextcomponentID = thisJunction.connectedComponentIDs[0];
				//var nextcomponentID = nextComponent.ID;
				this.updateComponent(nextComponent.ID);
				//var nextObstacle = this.collision( nextComponent.obstacles);
				var nextObstacle = this.collision( this.component.obstacles);
				if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
					if ( nextObstacle.object == this.component.startJunction 
						|| nextObstacle.object == this.component.endJunction ) {
						this.bounceBack( obstacle.face.normal, component);
					}
				}	
			}

			//NEXT COMPONENT = BATTERY
			else {
				if ( nextComponent.startJunction.connectedComponentIDs[0] == component.ID ) {
					// if the other end of battery is also connected to another component & it is a closed loop
					// then transfer the electron to the other side
					if (nextComponent.endJunction.connectedComponentIDs.length > 0
						&& component.force.length() != 0.0) {
						this.passFromBattery( nextComponent.startJunction, nextComponent.endJunction, nextComponent);
	                }
					else {  // if the battery is not connected from the other side (or is connected but I=0)
							//	 bounce back the electron
						this.bounceBack( obstacle.face.normal, component);
					}
				}
				else {     //it is connected to battery's end junction
					if (nextComponent.startJunction.connectedComponentIDs.length > 0
						&& component.force.length() != 0.0 ) {
						this.passFromBattery( nextComponent.endJunction, nextComponent.startJunction, nextComponent);
					}
					else { // if the battery is not connected from the other side, bounce back the electron
						this.bounceBack( obstacle.face.normal, component);
					}
				}
			}
		}

	}

	this.collideConnectedJunctionsOld = function( obstacle, component ) {
		this.velocity.sub(component.force);
		var thisJunction = obstacle.object;
		//var connectedComponent = thisJunction.connectedComponents[0];
		var nextComponent = component.findNextComponent( thisJunction );
		if ( nextComponent == null ) {this.bounceBack( obstacle.face.normal, component);}  // no out current in the node	
		
		else {
			
			// NEXT COMPONENT != BATTERY
			if (nextComponent.compType != "Battery") {   // if the connected component is not a battery
				//var nextcomponentID = thisJunction.connectedComponentIDs[0];
				//var nextcomponentID = nextComponent.ID;
				this.updateComponent(nextComponent.ID);
				//var nextObstacle = this.collision( nextComponent.obstacles);
				var nextObstacle = this.collision( this.component.obstacles);
				if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
					if ( nextObstacle.object == this.component.startJunction 
						|| nextObstacle.object == this.component.endJunction ) {
						this.bounceBack( obstacle.face.normal, component);
					}
				}	
			}

			//NEXT COMPONENT = BATTERY
			else {
				if ( nextComponent.startJunction.connectedComponentIDs[0] == component.ID ) {
					// if the other end of battery is also connected to another component & it is a closed loop
					// then transfer the electron to the other side
					if (nextComponent.endJunction.connectedComponentIDs.length > 0
						&& component.force.length() != 0.0) {
						this.passFromBattery( nextComponent.startJunction, nextComponent.endJunction, nextComponent);
						var afterComponent = components[this.componentID]; // electron.component is updated in passFromBattery function
						var afterObstacle = this.collision( afterComponent.obstacles);
						if (afterObstacle != null) {    // this is to avoid electrons stucking in overlap area
							if ( afterObstacle.object == afterComponent.startJunction 
								|| afterObstacle.object == afterComponent.endJunction ) {
								this.bounceBack( afterObstacle.face.normal, component);
							}
						}
	                }
					else {  // if the battery is not connected from the other side (or is connected but I=0)
							//	 bounce back the electron
						this.bounceBack( obstacle.face.normal, component);
					}
				}
				else {     //it is connected to battery's end junction
					if (nextComponent.startJunction.connectedComponentIDs.length > 0
						&& component.force.length() != 0.0 ) {
						this.passFromBattery( nextComponent.endJunction, nextComponent.startJunction, nextComponent);
						var afterComponent = components[this.componentID];
						var afterObstacle = this.collision( afterComponent.obstacles);
						if (afterObstacle != null) {    // this is to avoid electrons stucking in overlap area
							if ( afterObstacle.object == afterComponent.startJunction 
								|| afterObstacle.object == afterComponent.endJunction ) {
								this.bounceBack( afterObstacle.face.normal, component);
							}
						}
					}
					else { // if the battery is not connected from the other side, bounce back the electron
						this.bounceBack( obstacle.face.normal, component);
					}
				}

			}


		}


	}

	this.updateComponent = function(id) {
		this.componentID = id;
		this.component = components[this.componentID];
		this.reflectedTimes = 0;
	}

	this.passFromBattery = function( firstJunction, secondJunction, battery ) {
		var pushVector = new THREE.Vector3();
		pushVector.subVectors(secondJunction.position, firstJunction.position);
		var length = pushVector.length();  // TEST: 1.01
		pushVector.transformDirection(battery.container.matrixWorld); //normalized 
		pushVector.multiplyScalar(length);

		if (ArFlag) {  //AR condition
			// first transform the electron position with the world matrix, move it to the next component
			// then use inverse matrix to transform the position back to the electrons local position
			this.position.applyMatrix4(electronVertices.matrixWorld);
			this.position.add(pushVector);
			var m = new THREE.Matrix4();
			m = m.getInverse(electronVertices.matrixWorld);
			this.position.applyMatrix4(m);
		}
		else {   // non-AR condition
			this.position.add(pushVector);
		}

		this.velocity.multiplyScalar(velocity/this.velocity.length());   // after passing the battery set the velocity to 2 again	

		var nextComponent = components[secondJunction.connectedComponentIDs[0]];
		if (nextComponent.compType == "Battery") {
			if (nextComponent.startJunction.connectedComponentIDs[0] == battery.ID) {
				this.passFromBattery(nextComponent.startJunction, nextComponent.endJunction , nextComponent);
			}
			else {
				this.passFromBattery(nextComponent.endJunction, nextComponent.startJunction , nextComponent);
			}
		}
		else {
			var nextComponentID = secondJunction.connectedComponentIDs[0];
			this.updateComponent(nextComponentID);
		}

	}


}