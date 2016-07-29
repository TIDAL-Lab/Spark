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
var velocityMax = 10;
var lossFactor = 0.9;


function createElectrons( electronGeometry, component ) {
	for ( i = 0; i < component.electronCount; i ++ ) {

		var electron = new THREE.Vector3();

		// INIT XYZ POSITION

		// I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
		electron.x = Math.random() * (component.w - 5) - (component.w - 5)/2; //the x coordinate changes based on component length 
		electron.y = Math.random() * (component.l - 5) - (component.l - 5)/2; // component width 
		
		if (twoD) {
			electron.z = offsetZ;
		}	
		else { // 3D movement of electrons
			var zLimit = Math.sqrt((component.w - 5) * (component.w - 5) - (4*electron.x * electron.x));
			electron.z = Math.random() * zLimit - zLimit/2; // calculations of random xz coordinate on a circle shape (cross section of a cylinder on xz plane)
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

		electron.velocity = new THREE.Vector3(
	    	vX,		
	    	vY,		  
	    	vZ);
		
		//translate the electron to be inside the component
		electron.applyMatrix4( component.container.matrixWorld );
		electron.componentID = component.ID;
		electron.component = component;
		electronGeometry.vertices.push( electron );

		electron.reflectCount = 0;   // count the number of times bouncing off
		electron.status = "init";  // for debugging (issue with electrons leaving the container)

	}	

}

function updateElectron(electron) {
	var component = electron.component;

	if ( ticks % 100 == 0) {
		component.updateAmmeter();   //recalculates the rate of flow
	}
	electron.velocity.add(component.force);
	var obstacle = collision(electron, component.obstacles);
	if (obstacle == null) { 	// no colision

		moveElectron(electron, component);
		findElectronsOutside(electron, component);

	}
	else {   // a collision is detected
		
		if ( obstacle.object == component.startJunction || 
			 obstacle.object == component.endJunction ) {
			if ( obstacle.object.connectedComponentIDs.length > 0 ) { // if it is connected to another component, change the electron's component ID
														   // and wait for it to move next time
			    collideConnectedJunction( electron, obstacle, component );
			}
			else {   // if the junction is not connected, bounce back the electron

				bounceBack(electron, obstacle.face.normal, component);
			}
		}
		else if (obstacle.object == component.ammeter) {
			collideAmmeter(electron, obstacle, component);
		}
		else {  // the obstacle is ions, so bounce it back (change: no component walls as obstacles anymore)
			bounceBack(electron, obstacle.face.normal, component);
		}
		
	}
	
}

function worldToLocal(electron, component) {
	var m = new THREE.Matrix4();
	m = m.getInverse(component.container.matrixWorld);
	var local = new THREE.Vector3().copy(electron);
	local.applyMatrix4(m);
	return local;
}

function moveElectron(electron, component) {
	// // transform the force vector
	// var length = this.force.length();
	// this.force.transformDirection(this.container.matrixWorld); //normalized
	// this.force.multiplyScalar(length); 
	
	var v = electron.velocity.length();
	if (electron.velocity.length() > velocityMax) {	// don't allow the speed to become more than 10, which is the distance for raycaster
		electron.velocity.setLength(velocityMax-0.01);
	}
	if (electron.velocity.length() > velocityMax) console.log("error: velocity exceeds the max velocity");

	// move the electron
	electron.add( electron.velocity );
	electron.status = "moved";

	//findElectronsOutside( electron, component );
}

function findElectronsOutside( electron, component ) {
	// check if it is in the container box
	var electronLocal = worldToLocal(electron, component);
	if (Math.abs(electronLocal.y) <= component.l/2) {
		if (Math.abs(electronLocal.x) >= component.w/2) { // the electron is outside of the container cylinder
			electron.sub(electron.velocity);
			// Make sure it's not out of the box anymore
			var local2 = worldToLocal(electron, component);
			if (Math.abs(local2.y) <= component.l/2) {
				if (Math.abs(local2.x) >= component.w/2) { 
					console.log("ERROR WALL");
					stop = !stop; 
				} }
			var normal = new THREE.Vector3(1,0,0);
			if (electronLocal.x > 0) normal.multiplyScalar(-1);
			bounceBack(electron, normal, component);
			console.log("bounced off a wall");

		}
	}
	else {   // the electron is outside of the two junctions
		var x = electronLocal.x;
		var y = Math.abs(electronLocal.y) - component.l/2
		var distance = Math.sqrt(( x * x ) + ( y * y ));
		if ( distance >= component.w/2 ) {
			electron.sub(electron.velocity);
			// Make sure it's not out of the box anymore
			var local2 = worldToLocal(electron, component);
			if (Math.abs(local2.y) <= component.l/2) {
				if (Math.abs(local2.x) >= component.w/2) { 
					console.log("ERROR JUNCTION");
					stop = !stop; } }
			var normal = new THREE.Vector3(-x , -y, 0);
			if (electronLocal.y < 0) normal.y = y;
			bounceBack(electron, normal, component);
			console.log("bounced off a junction");

		}
	} 
}

var arrowHelper = new THREE.ArrowHelper( new THREE.Vector3(1,0,0), new THREE.Vector3(1,0,0), 10, darkGreen );
function collision( electron, obstacles ) {
	// CHECK for AR, I think I should uncomment this for AR
/*	var direction = new THREE.Vector3();
	direction.copy(electron.velocity);  // in local space / force is already added
	direction.transformDirection(electrons.matrixWorld); //transform direction to world space also normalizes the vector
	var origin = new THREE.Vector3();
	origin.copy(electron);
	origin.applyMatrix4(electrons.matrixWorld);    // CHECK LATER: it seems it's already transformed when electrons are created
*/
	//scene.remove(arrowHelper);
	var length = electron.velocity.length();
	var dir = new THREE.Vector3().copy(electron.velocity).normalize();	
	var origin = new THREE.Vector3().copy(electron); 
	//arrowHelper = new THREE.ArrowHelper( dir, origin, length+electronSize/2, darkGreen );
	//scene.add(arrowHelper);

	raycaster.set(origin, dir);

	//raycaster.set( electron, electron.velocity);
	// var distance = length + (electronSize * 2);
	raycaster.near = 0.001;
	raycaster.far = length + (electronSize * 2);
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

/* here instead of computing the ray vector in local space, I am computing the face normal
* in world coordinates and then I use the .reflect() method to calculate the reflection of 
* the ray. 
* reflection formula:  r=d−2(d⋅n)n (where d is the ray, and n is a normalized normal, and d.n is a dot product)
*/

function bounceBack( electron, normal, component ) {  // normal is the face normal in local space
	//electron.velocity.sub(component.force);
	// first, calculate the normal vector in world coordinate
	var normalMatrix = new THREE.Matrix3().getNormalMatrix( component.container.matrixWorld ); // the normal matrix (upper left 3x3) of the passed matrix4. The normal matrix is the inverse transpose of the matrix m.

	// this part is for 2D movement of electrons (z=0)
	if (twoD) { normal.z = 0.0; } // project the normal vector on the xy plane (in local space of container)

	var worldNormal = normal.clone().applyMatrix3( normalMatrix ).normalize();
	// if (obstacle.object == component.container) worldNormal.multiplyScalar( -1 ); // reverse the direction of normal for container, as the normal vector for the container is towards outside
	// if (obstacle.object == component.startJunction || obstacle.object == component.endJunction) worldNormal.multiplyScalar( -1 );    // check this later!


	if (Math.abs(worldNormal.z) > 0.2) console.log("normal vector in z direction");
	
	// now calculate the reflection
	reflect( electron, worldNormal );

	//if ( component.volt > 0 ) electron.velocity.multiplyScalar(lossFactor); // due to collision, lose energy
	electron.status = "bounced back";

 }


 function reflect(electron, worldNormal) {
 	//non-AR condtion
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
/*	
	this.bounceBackOld = function ( electron, obstacle ) {
		// all removed, see github repository
	}	*/	

function collideAmmeter( electron, obstacle, component ) {
	moveElectron(electron, component);
	var n = obstacle.face.normal;      //the normal vector in local coordinates is either (0,1,0) or (0,-1,0)
	component.ammeter.count += n.y; 
}

function collideConnectedJunction( electron, obstacle, component ) {
	electron.velocity.sub(component.force);
	var thisJunction = obstacle.object;
	//var connectedComponent = thisJunction.connectedComponents[0];
	var nextComponent = component.findNextComponent( thisJunction );
	if ( nextComponent == null ) {bounceBack(electron, obstacle.face.normal, component);}	
	else {

		//first check if the connected component is a battery
		// TEMP: for now, I assume that no more than one battery connected together
		if (nextComponent.compType == "Battery") {
			if ( nextComponent.startJunction.connectedComponentIDs[0] == component.ID ) {
				// if the other end of battery is also connected to another component & it is a closed loop
				// then transfer the electron to the other side
				if (nextComponent.endJunction.connectedComponentIDs.length > 0
					&& component.force.length() != 0.0) {
					passFromBattery( electron, nextComponent.startJunction, nextComponent.endJunction, nextComponent);
					//electron.componentID = thisJunction.connectedComponentID;
					var afterComponent = components[electron.componentID];
					var afterObstacle = collision(electron, afterComponent.obstacles);
					if (afterObstacle != null) {    // this is to avoid electrons stucking in overlap area
						if ( afterObstacle.object == afterComponent.startJunction 
							|| afterObstacle.object == afterComponent.endJunction ) {
							bounceBack(electron, afterObstacle.face.normal, component);
						}
					}
                }
				else {  // if the battery is not connected from the other side (or is connected but I=0)
						//	 bounce back the electron
					bounceBack(electron, obstacle.face.normal, component);
				}
			}
			else {     //it is connected to battery's end junction
				if (nextComponent.startJunction.connectedComponentIDs.length > 0
					&& component.force.length() != 0.0 ) {
					passFromBattery( electron, nextComponent.endJunction, nextComponent.startJunction, nextComponent);
					//electron.componentID = thisJunction.connectedComponentID;
					var afterComponent = components[electron.componentID];
					var afterObstacle = collision(electron, afterComponent.obstacles);
					if (afterObstacle != null) {    // this is to avoid electrons stucking in overlap area
						if ( afterObstacle.object == afterComponent.startJunction 
							|| afterObstacle.object == afterComponent.endJunction ) {
							bounceBack(electron, afterObstacle.face.normal, component);
						}
					}
				}
				else { // if the battery is not connected from the other side, bounce back the electron
					bounceBack(electron, obstacle.face.normal, component);
				}
			}

		}

		else {   // if the connected component is not a battery
			//updateElectronComponent(electron);   // WRITE LATER
			electron.componentID = thisJunction.connectedComponentIDs[0];
			electron.component = components[electron.componentID];
			var nextObstacle = collision(electron, nextComponent.obstacles);
			if (nextObstacle != null) {    // this is to avoid electrons stucking in overlap area
				if ( nextObstacle.object == nextComponent.startJunction 
					|| nextObstacle.object == nextComponent.endJunction ) {
					bounceBack(electron, obstacle.face.normal, component);
				}
			}	
		}
	}


}

function updateElectronComponent( electron ) {

}

function passFromBattery( electron, firstJunction, secondJunction, battery ) {
	var pushVector = new THREE.Vector3();
	pushVector.subVectors(secondJunction.position, firstJunction.position);
	var length = pushVector.length();  // TEST: 1.01
		pushVector.transformDirection(battery.container.matrixWorld); //normalized 
	pushVector.multiplyScalar(length);

	if (ArFlag) {  //AR condition
		// first transform the electron position with the world matrix, move it to the next component
		// then use inverse matrix to transform the position back to the electrons local position
		electron.applyMatrix4(electrons.matrixWorld);
		electron.add(pushVector);
		var m = new THREE.Matrix4();
		m = m.getInverse(electrons.matrixWorld);
		electron.applyMatrix4(m);
	}
	else {   // non-AR condition
		electron.add(pushVector);
	}

	electron.velocity.multiplyScalar(2/electron.velocity.length());   // after passing the battery set the velocity to 2 again	

	electron.componentID = secondJunction.connectedComponentIDs[0];	
	electron.component = components[electron.componentID];
}
