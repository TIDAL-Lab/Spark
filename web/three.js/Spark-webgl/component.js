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
var rectGeom, rectMesh;
var ionGeometry = new THREE.SphereGeometry( 7, 16, 16 );
var ionMaterial = new THREE.MeshBasicMaterial( {color: 0xCC0000 , transparent: true} ); // later: there was something wrong with MeshPhongMaterial that it did not change the color, so I changed it to basic material.
var velocity = 2;
var standardLength = 200; // it is 100 multiplies by the factor (here 2) that it is scaled by when passed from Parse
var red = 0xD11919;
var green = 0x008F00;
var gray = 0x808080;

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
  	this.I = current;
  	this.R = res;
  	this.V = volt;
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
  	this.boxMesh;
  	this.force = new THREE.Vector3();

  	//this.force.x = direction * this.V * (endX - startX) / this.l; 
  	//this.force.y = direction * this.V * (endY - startY) / this.l;

  	// temp alternative for force

  	this.force.x = 0.1 * direction * this.I * (endX - startX) / this.l; 
  	this.force.y = 0.0;
  	this.force.z = 0.0;

  	this.connections = connections;
  	//this.connections = [].concat.apply([], connections); // this flattens the nested array of connection
  	
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
		this.createBox();
		if (this.compType != 'Battery') {
			this.createElectrons(electronGeometry);
		}
	}

	this.createBox = function() {
		var center = new THREE.Vector3( (this.startPoint.x + this.endPoint.x) / 2, 
										(this.startPoint.y + this.endPoint.y) / 2, 
										0.0 );

		var boxGeom = new THREE.BoxGeometry( this.l, this.w, this.h);
		if (this.compType == "Resistor" || this.compType == "Bulb") {
			var boxMaterial = new THREE.MeshBasicMaterial( { map: resistorImg, color: 0xCCCC00 } );
		}
		else if (this.compType == "Battery") {
			var boxMaterial = new THREE.MeshBasicMaterial( { map: batteryImg } );
		}
		else {
			var boxMaterial = new THREE.MeshBasicMaterial( { color: 0xB2B2B2 } );
		}

		boxMaterial.transparent = true;
		boxMaterial.opacity = 0.7;
		boxMaterial.depthWrite = false;
		this.boxMesh = new THREE.Mesh( boxGeom, boxMaterial );

		//transform the box
		this.boxMesh.position.set(center.x, center.y, center.z);
		this.boxMesh.rotation.z = this.rotationAngle;
		//console.log(this.boxMesh.matrix.elements); // this shows that the matrix elements are not updated yet
		this.boxMesh.updateMatrixWorld(); // because it is not in the render() loop yet, I need to manually update the matrix for electrons

		// now add the junctions to the box	
		var startJunction = this.createJunction();
		startJunction.position.x = - this.l / 2;
		var endJunction = this.createJunction();
        endJunction.position.x = this.l / 2;	

        // update the junctions
		for (i=0; i < this.connections.length; i++) {
			var obj = this.connections[i];
			var key = i.toString();
			var code = obj[key];
			var index;
			if (code != -1 && code != 0) {			// if junction is connected
				if (code == 1 || code == 3) {		// start junction is connected
					startJunction.material.color.set(green);
					startJunction.connectedComponentID = i;
					startJunction.material.transparent = true;
					startJunction.material.opacity = 0.5;
					startJunction.material.depthWrite = false;
				}
				else {								// end junction is connected
					endJunction.material.color.set(green);
					endJunction.connectedComponentID = i;
					endJunction.material.transparent = true;
					endJunction.material.opacity = 0.5;
					endJunction.material.depthWrite = false;
				}

			}
		}

		// create ions and add them to the box
		this.createIons();

	}

	this.createJunction = function() {
		var junction = new THREE.Mesh( new THREE.SphereGeometry(this.w/2, 16, 16), 
										new THREE.MeshBasicMaterial( { color: red } ));
		junction.material.transparent = true;
		junction.material.opacity = 0.5;
		junction.material.depthWrite = false;

		// add the junctions to the box
		this.boxMesh.add(junction);

		junction.connectedComponentID = -1; // to avoid the undefined variable

		return junction;
	}

	this.createIons = function() {
		if (this.compType != "Battery") {
			
			var count = 0;
			var d = 40;		
			for ( i = 1; i < this.l/d; i ++ ) {
				for (j = 1; j < this.w/d; j++) {
					var pos;
					if ((i+j) % 3 == 0) {
						pos = new THREE.Vector3();
						pos.x = -this.l/2 + i * d; 
						pos.y = -this.w/2 + j * d;
						pos.z = 0;

						var ion = new THREE.Mesh( ionGeometry, ionMaterial );
						ion.position.set(pos.x, pos.y, pos.z);
						this.ions.push(ion);
						this.boxMesh.add(ion);
						count++;
					}				

				}
			}

			this.ionCount = count;

	  		this.boxMesh.material.side = THREE.BackSide;
	  		this.obstacles.push(this.boxMesh);

	  		for ( i = 0; i < this.ions.length; i ++ ) {
	  			this.obstacles.push(this.ions[i]);	
	  		}

		}	

	}


	this.createElectrons = function( electronGeometry ) {
		  		// create electrons
		for ( i = 0; i < this.electronCount; i ++ ) {

			var electron = new THREE.Vector3();
			// I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
			electron.x = Math.random() * (this.l - 5) - (this.l - 5) /2; //the x coordinate changes based on component length 
			electron.y = Math.random() * (this.w - 5) - (this.w - 5)/2; // component width 
			//electron.z = 0.0;
			electron.z = Math.random() * (this.h - 5) - (this.h - 5)/2; // component width

/*			// initiate a 2D velocity (no z direction)
			var vX = Math.random() * velocity * 2 - velocity;
		    var vY = Math.sqrt( velocity * velocity - vX*vX);   // this results in a constant velocity	
			// I need to give a random sign to vY with 50-50 probability
		    if ( Math.round(Math.random()) == 1 ) vY *= -1;
		    vZ = 0.0;*/

			// initiate a 3D velocity
			var vX = Math.random() * velocity * 2 - velocity;
			var vYZ = Math.sqrt( velocity * velocity - vX * vX );
			var vY = Math.random() * vYZ * 2 - vYZ;
			var vZ = Math.sqrt( vYZ * vYZ - vY * vY); // this results in a constant velocity in 3D		    
		    // I need to give a random sign to vY & vZ with 50-50 probability
		    if ( Math.round(Math.random()) == 1 ) vY *= -1;
		    if ( Math.round(Math.random()) == 1 ) vZ *= -1;

			electron.velocity = new THREE.Vector3(
		    	vX,		// x
		    	vY,		//  
		    	vZ);		// z

			//translate the electron to be inside the component
			//this.boxMesh.localToWorld(electron); // this changes the position of electron from local to world
			electron.applyMatrix4( this.boxMesh.matrixWorld );
			electron.componentID = this.ID;
			electronGeometry.vertices.push( electron );
		}	

	}


	this.updateElectron = function ( electron ) {
		if (ArFlag) {
			var length = electron.velocity.length();
			electron.velocity.applyMatrix4( this.boxMesh.matrixWorld ).normalize();
			electron.velocity.multiplyScalar(length);
		}
		var obstacle = this.collision(electron);
		if (obstacle == null) { 	// no colision
			this.moveElectron(electron);
		}
		else {
			this.bounceBack(electron, obstacle);
		}
	}

	this.moveElectron = function (electron) {
			// update velocity
			electron.velocity.x += this.force.x;
			electron.velocity.y += this.force.y;
/*			var v = Math.sqrt(electron.velocity.x * electron.velocity.x + 
								electron.velocity.y * electron.velocity.y);

			if (v > 8) {	// don't allow the speed to become more than 10, which is the distance for raycaster
				
				//electron.velocity.x -= this.force.x;
				//electron.velocity.y -= this.force.y;
			}
*/
			// move the electron
			electron.x += electron.velocity.x; 
			electron.y += electron.velocity.y;
			electron.z += electron.velocity.z;
	}
	
	// here instead of computing the ray vector in local space, I am computing the face normal
	// in world coordinates and then I use the .direct() method to calculate the reflection of 
	// the ray. 
	// reflection formula:  r=d−2(d⋅n)n (where d is the ray, and n is a normalized normal, and d.n is a dot product)
	
	this.bounceBack = function( electron, obstacle ) {

		var n = obstacle.face.normal;

		var normalMatrix = new THREE.Matrix3().getNormalMatrix( this.boxMesh.matrixWorld ); // the normal matrix (upper left 3x3) of the passed matrix4. The normal matrix is the inverse transpose of the matrix m.
		var worldNormal = n.clone().applyMatrix3( normalMatrix ).normalize();
		// reverse the direction of normal for boxmesh, as the normal vector for the boxmesh is towards outside
		if (obstacle.object == this.boxMesh) worldNormal.multiplyScalar( -1 );
		//console.log(worldNormal.x + ' ' + worldNormal.y + ' ' + worldNormal.z);
		var reflection = electron.velocity.clone().reflect(worldNormal);
		//console.log(reflection.x + ' ' + reflection.y + ' ' + reflection.z);
		electron.velocity = reflection;



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
		localVelocity.transformDirection(this.boxMesh.matrix.transpose()); //later: check why I needed to add transpose
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
		var direction = new THREE.Vector3(electron.velocity.x, electron.velocity.y, electron.velocity.z);
		direction.normalize(); // sends a normalized ray in the direction of moving particle and detect obstacles
		var origin = new THREE.Vector3();
		origin.copy(electron);
		origin.applyMatrix4(electrons.matrixWorld);
		raycaster.set(origin, direction);
		//var distance = 10;
		raycaster.near = 0;
		raycaster.far = 10;
		var collisions = raycaster.intersectObjects(this.obstacles);
		// if (collisions.length > 0 && collisions[0].distance <= distance) {
		if ( collisions.length > 0 ) {	
			//if (markerDetectedFlag || !ArFlag) console.log('collision is detected');
		 	return collisions[0];
		 }
		 else {
		 	return null;
		 }
	}

}
