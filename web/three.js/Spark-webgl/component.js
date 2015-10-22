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
	
 */

var electronSize = 15;
var rectGeom, rectMesh;
var ionGeometry = new THREE.SphereGeometry(7, 128, 128 );
var ionMaterial = new THREE.MeshPhongMaterial( {color: 0xCC0000 , transparent: true} );
var junctionD = 6, wallD = 4;
//var boundingBox;
var velocity = 2;
var standardLength = 200; // it is 100 multiplies by the factor (here 2) that it is scaled by when passed from Parse
var red = 0xD11919;
var green = 0x008F00;

function Component(type, current, res, volt, startX, startY, endX, endY, direction, connections) {
 	this.compType = type; // "wire", "resistor", "bulb", "battery"
  	this.I = current;
  	this.R = res;
  	this.V = volt;
  	this.startPoint = new THREE.Vector3( startX, startY, 0.0 );
  	this.endPoint = new THREE.Vector3( endX, endY, 0.0 ); 
  	this.direction = direction; // 0 if v=0; 1 if from Start to End; -1 if from End to Start
  	this.ID;
  	this.electronCount; // Change it later
  	this.ionCount; //Change it later
  	this.l = Math.sqrt((endX-startX)*(endX-startX)+(endY-startY)*(endY-startY));
  	this.w = 110;
  	this.walls = [];
  	this.ions = [];
  	this.obstacles = [];
  	this.boxMesh;

	var startToEnd = new THREE.Vector3( endX-startX, endY-startY, 0.0);
	var xAxis = new THREE.Vector3(1, 0, 0);
	var angle = startToEnd.angleTo(xAxis);
	var vector = new THREE.Vector3();
	vector.crossVectors(xAxis, startToEnd);
	var sign = Math.sign(vector.z);		
	var rotationAngle = angle*sign;
	this.rotationAngle = rotationAngle;
  	  	
  	//this.forceX = direction * this.V * (endX - startX) / this.l; 
  	//this.forceY = direction * this.V * (endY - startY) / this.l;

  	// temp alternative for force
  	this.forceX = 0.1 * direction * this.I * (endX - startX) / this.l; 
  	this.forceY = 0.1 * direction * this.I * (endY - startY) / this.l;

  	this.connections = connections;
  	//this.connections = [].concat.apply([], connections); // this flattens the nested array of connection
  	
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
  		// create electrons
		for ( i = 0; i < this.electronCount; i ++ ) {

			var electron = new THREE.Vector3();
			var l = this.l;
			// I added a constant 5 to the calculation below to avoid creating electrons right on the edge.
			electron.x = Math.random() * (this.l - 5) - (this.l - 5) /2; //the x coordinate changes based on component length 
			electron.y = Math.random() * (this.w - 5) - (this.w - 5)/2; // component width 
			electron.z = 0;

			//translate the electron to be inside the component
			this.boxMesh.localToWorld(electron); // this changes the position of electron from local to world
		    var vX = Math.random() * velocity * 2 - velocity;
		    var vY = Math.sqrt( velocity * velocity - vX*vX);   // this results in a constant velocity 
			electron.velocity = new THREE.Vector3(
		    	vX,		// x
		    	vY,		//  
		    	0);		// z

			electron.componentID = this.ID;
			electronGeometry.vertices.push( electron );
		}	

	}

	// create the box and add walls and ions as the box children
	this.createBox = function() {
		var startX = this.startPoint.x, startY = this.startPoint.y;
		var endX = this.endPoint.x, endY = this.endPoint.y;
		var center = new THREE.Vector3( (startX + endX) / 2, (startY + endY) / 2, 0.0 );

		//var boxLength = startToEnd.length(); // computes the length of startToEnd vector
		var boxLength = Math.sqrt((endX - startX)*(endX - startX) + (endY - startY)*(endY - startY));
		var boxWidth = this.w;
		var boxHeight = 30;
		var boxGeom = new THREE.BoxGeometry( boxLength, boxWidth, boxHeight);
		if (this.compType == "Resistor" || this.compType == "Bulb") {
			var boxMaterial = new THREE.MeshBasicMaterial( { map: resistorImg, color: 0xCCCC00 } );
		}
		else {
			var boxMaterial = new THREE.MeshBasicMaterial( { color: 0xB2B2B2 } );
		}

		boxMaterial.transparent = true;
		boxMaterial.opacity = 0.5;
		boxMaterial.depthWrite = false;
		this.boxMesh = new THREE.Mesh( boxGeom, boxMaterial );
		
		//transform the box
		this.boxMesh.position.set(center.x, center.y, center.z);
		this.boxMesh.rotation.z = this.rotationAngle;
		this.boxMesh.updateMatrixWorld(); // because it is not in the render() loop yet, I need to manually update the matrix

		// now add the walls to the box
		var wallMaterial = new THREE.MeshBasicMaterial( { color: 0x808080 } );
        var junction1 = new THREE.Mesh( new THREE.BoxGeometry(junctionD, boxWidth, boxHeight), 
										new THREE.MeshBasicMaterial( { color: red } ));
		var junction2 = new THREE.Mesh( new THREE.BoxGeometry(junctionD, boxWidth, boxHeight), 
										new THREE.MeshBasicMaterial( { color: red } ));		
		var wall1 = new THREE.Mesh( new THREE.BoxGeometry(boxLength + 2 * junctionD, wallD, boxHeight), wallMaterial);
		var wall2 = new THREE.Mesh( new THREE.BoxGeometry(boxLength + 2 * junctionD, wallD, boxHeight), wallMaterial);

        this.walls = [
                    junction1,
                    junction2,
                    wall1,
                    wall2 ];

        // add the walls to the box
       	for (i=0; i< this.walls.length; i++) {
			this.boxMesh.add(this.walls[i]);
			this.walls[i].connectedComponentID = -1; // to avoid the undefined variable
		}

		this.walls[0].position.x = - (boxLength / 2 + junctionD / 2); 	// wall0 contains start point
        this.walls[1].position.x = boxLength / 2 + junctionD / 2;		// wall1 contains end point	
        this.walls[2].position.y = -(boxWidth / 2 + wallD / 2);			// wall2 is the wall with lower y
        this.walls[3].position.y = boxWidth / 2 + wallD / 2;			// wall3 is the wall with higher y

        //this.walls[0].material.side = THREE.DoubleSide;
        //this.walls[1].material.side = THREE.DoubleSide;
        
        // update the junctions
		for (i=0; i < this.connections.length; i++) {
			var obj = this.connections[i];
			var key = i.toString();
			var code = obj[key];
			var index;
			if (code != -1 && code != 0) {			// if junction is connected
				if (code == 1 || code == 3) {		// start junction is connected
					index = 0;
				}
				else {								// end junction is connected
					index = 1;
				}
				this.walls[index].material.color.set(green);
				this.walls[index].connectedComponentID = i;
				this.walls[index].material.transparent = true;
				this.walls[index].material.opacity = 0.5;
				// var alfa = components[i].rotationAngle - this.rotationAngle;
				// var junctionL = Math.abs(boxWidth * Math.sin(alfa/2));
				// var junctionW = Math.abs(boxWidth / Math.cos(alfa/2)); // think about alfa = 180!!
				// this.walls[index].geometry = new THREE.BoxGeometry( junctionL, junctionW, boxHeight);	
				
				// if (index == 0) {
				// 	this.walls[0].position.x = - boxLength / 2; 
				// 	//this.walls[0].position.y = - (junctionW - this.w) / 2;
				// 	this.walls[0].rotation.z = alfa/2;
				// 	this.walls[0].position.y -= (junctionW - this.w);
				// 	//this.walls[0].position.x += junctionL/2;
				// }
				// else {
				// 	this.walls[1].position.x = boxLength / 2; 
				// 	//this.walls[1].position.y = - (junctionW - this.w) / 2;
				// 	this.walls[1].rotation.z = alfa/2;
				// 	this.walls[1].position.y -= (junctionW - this.w);
				// 	//this.walls[1].position.x -= junctionL/2;
				// }
			}
		}
        	

				
        // now create ions and add them to the box
		if (this.compType != "Battery") { // no ions for battery
			// create ions
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
		}
   
  		this.obstacles = this.ions.concat(this.walls);
  		//this.boxMesh.material.side = THREE.BackSide;
  		//this.obstacles.push(this.boxMesh);
		scene.add ( this.boxMesh );	
	}

	this.initBattery = function (ID) {
		this.ID = ID;
		var startX = this.startPoint.x, startY = this.startPoint.y;
		var endX = this.endPoint.x, endY = this.endPoint.y;

		var center = new THREE.Vector3( (startX + endX) / 2, (startY + endY) / 2, 0.0 );
		var boxLength = Math.sqrt((endX - startX)*(endX - startX) + (endY - startY)*(endY - startY));
		var boxWidth = this.w;
		var boxHeight = 30;
		var boxGeom = new THREE.BoxGeometry( boxLength, boxWidth, boxHeight);
		var boxMaterial = new THREE.MeshBasicMaterial( { map: batteryImg } );
		boxMaterial.transparent = true;
		boxMaterial.opacity = 1;
		boxMaterial.depthWrite = false;
		this.boxMesh = new THREE.Mesh( boxGeom, boxMaterial );

		this.boxMesh.position.set(center.x, center.y, center.z);
		this.boxMesh.rotation.z = this.rotationAngle;
		this.boxMesh.updateMatrixWorld();	
		scene.add ( this.boxMesh );	

	}

	this.updateElectron = function ( electron ) {

		var obstacle = this.collision(electron);
		if (obstacle == null) { 	// no colision
			this.moveElectron(electron);
		}
		else {
			switch(obstacle.object) {
				case this.walls[0]: 	// collision with start junction
					if (obstacle.object.connectedComponentID != -1) {	// if connected
						var n = obstacle.face.normal;
						if (n.x == 1) { // if electron is inside the component, move it to the connected component
							electron.componentID = obstacle.object.connectedComponentID;
						}
						else { this.moveElectron(electron); }  // electron is moving towards the component, let it in!
					}
					else { this.bounceBack(electron, obstacle); } // not connected
					break;
				case this.walls[1]: 	// collision with end junction 
					if (obstacle.object.connectedComponentID != -1) {	// if connected
						var n = obstacle.face.normal;
						if (n.x == -1) { 	// if electron is inside the component, move it to the connected component
							electron.componentID = obstacle.object.connectedComponentID;
						}
						else { this.moveElectron(electron); } 	// electron is moving towards the component, let it in!
					}
					else { this.bounceBack(electron, obstacle); }	// not connected
					break;
				default: 		// collision with the side walls or ions
					this.bounceBack(electron, obstacle); 
			}
		}
	}

	this.moveElectron = function (electron) {
			// update velocity
			electron.velocity.x += this.forceX;
			electron.velocity.y += this.forceY;
			var v = Math.sqrt(electron.velocity.x * electron.velocity.x + 
								electron.velocity.y * electron.velocity.y);

			if (v > 8) {	// don't allow the speed to become more than 10, which is the distance for raycaster
				
				electron.velocity.x -= this.forceX;
				electron.velocity.y -= this.forceY;
			}

			// move the electron
			electron.x += electron.velocity.x; 
			electron.y += electron.velocity.y;
	}
	
	this.bounceBack = function (electron, obstacle) {		// no use for type, remove it!
		var n = obstacle.face.normal;
		n.z = 0; // we just want the image of the normal vector on the XY plane with Z = 0
		var localVelocity = new THREE.Vector3(); 
		localVelocity.copy(electron.velocity);
		localVelocity.applyAxisAngle(new THREE.Vector3(0, 0, -1), this.rotationAngle);
		//this.boxMesh.worldToLocal(localVelocity);

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
		var ray = new THREE.Vector3(electron.velocity.x, electron.velocity.y, electron.velocity.z);
		ray = ray.normalize(); // sends a normalized ray in the direction of moving particle and detect obstacles
		raycaster.set(electron, ray);
		//var distance = 10;
		raycaster.near = 0;
		raycaster.far = 10;
		var collisions = raycaster.intersectObjects(this.obstacles);
		// if (collisions.length > 0 && collisions[0].distance <= distance) {
		if ( collisions.length > 0 ) {	
		 	return collisions[0];
		 }
		 else {
		 	return null;
		 }
	}

}
