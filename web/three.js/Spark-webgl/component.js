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
  	  	
  	this.forceX = direction * this.V * (endX - startX) / this.l; 
  	this.forceY = direction * this.V * (endY - startY) / this.l;

  	this.connections = connections;
  	//this.connections = [].concat.apply([], connections); // this flattens the nested array of connection
  	
  	if (this.compType == "Wire") {
  		this.electronCount = Math.round( 10 * this.l/standardLength); // this.l might not be an integer
  	}
  	else if ( this.compType == "Battery" ){
  		this.electronCount = 0;
  	}
  	else { 		// Resistor or Bulb
  		this.electronCount = 30;
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
			var newCoordinate = this.componentToScreen([electron.x, electron.y]);
			electron.x = newCoordinate[0];
			electron.y = newCoordinate[1];
		    //electrons.geometry.verticesNeedUpdate = true;

		    var vX = Math.random() * velocity * 2 - velocity;
		    var vY = Math.sqrt( velocity * 2 - vX*vX);   // this results in a constant velocity 

			electron.velocity = new THREE.Vector3(
		    	vX,		// x
		    	vY,		//  
		    	0);		// z

			electron.componentID = this.ID;

			electronGeometry.vertices.push( electron );
		}

		this.obstacles = this.ions.concat(this.walls);

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
		
		// now add the walls
		var wallMaterial = new THREE.MeshBasicMaterial( { color: 0x808080 } );
		//var junctionMaterial = ;

		var junction1 = new THREE.Mesh( new THREE.BoxGeometry(boxHeight, boxWidth, 20), 
										new THREE.MeshBasicMaterial( { color: red } ));
		var junction2 = new THREE.Mesh( new THREE.BoxGeometry(boxHeight, boxWidth, 20), 
										new THREE.MeshBasicMaterial( { color: red } ));
		var wall1 = new THREE.Mesh( new THREE.BoxGeometry(boxLength, boxHeight, 10), wallMaterial);
		var wall2 = new THREE.Mesh( new THREE.BoxGeometry(boxLength, boxHeight, 10), wallMaterial)
        var walls = [
                    junction1,
                    junction2,
                    wall1,
                    wall2
            ];

        // make the junctions

        // this.connections = [{"0":1}, {"1":3}, {"2":5}];
		for (i=0; i < this.connections.length; i++) {
			var obj = this.connections[i];
			var key = i.toString();
			var code = obj[key];
			console.log('this is code ' + code);
			if (code == 1 || code == 3) {
				walls[0].material.color.set(green);
				walls[0].connected = true;
			}
			else if (code == 2 || code == 4) {
				walls[1].material.color.set(green);
				walls[1].connected = true;
			}
		}

        // wall0 contains start point
        walls[0].rotation.y = Math.PI / 2;	
        walls[0].position.x = - (boxLength / 2 + 20 / 2);
        
        // wall1 contains end point
        walls[1].rotation.y = -Math.PI / 2;	
        walls[1].position.x = boxLength / 2 + 20 / 2;
        
        // wall2 is the wall with lower y
        walls[2].rotation.x = -Math.PI / 2;
        walls[2].position.y = -boxWidth / 2;
        //walls[2].position.z += 5;
        // wall 3 is the wall with higher y
		walls[3].rotation.x = Math.PI / 2;
        walls[3].position.y = boxWidth / 2;
        //walls[3].position.z += 5;

		for (i=0; i< walls.length; i++) {
			this.walls[i] = walls[i]; // this is component
			this.boxMesh.add(walls[i]);
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

		this.boxMesh.position.set(center.x, center.y, center.z);
		//boxMesh.geometry.translate ( center.x, center.y, center.z );
		//boxMesh.rotateOnAxis(zAxis, rotationAngle); // instead, the line below
		
		// var rotationAngle = Math.atan((endY-startY)/(endX-startX));
		//var zAxis = new THREE.Vector3(0, 0, 1);
		var startToEnd = new THREE.Vector3( endX-startX, endY-startY, 0.0);
		var xAxis = new THREE.Vector3(1, 0, 0);
		var angle = startToEnd.angleTo(xAxis);
		var vector = new THREE.Vector3();
		vector.crossVectors(xAxis, startToEnd);
		var sign = Math.sign(vector.z);
		
		var rotationAngle = angle*sign;
		this.boxMesh.rotation.z = rotationAngle;

		scene.add ( this.boxMesh );	

		/* did not work!
		//boundingBox = new THREE.Box3().setFromObject(boxMesh);
		boxMesh.geometry.computeBoundingBox();
    	boundingBox = boxMesh.geometry.boundingBox;
		*/	
	}

	this.initForBattery = function (ID) {
		this.ID = ID;
		var startX = this.startPoint.x, startY = this.startPoint.y;
		var endX = this.endPoint.x, endY = this.endPoint.y;

		var center = new THREE.Vector3( (startX + endX) / 2, (startY + endY) / 2, 0.0 );
		//var v = new THREE.Vector3( endX-startX, endY-startY, 0.0);
		//var rotationAngle = Math.atan((endY-startY)/(endX-startX));
		//var zAxis = new THREE.Vector3(0, 0, 1);
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

		var startToEnd = new THREE.Vector3( endX-startX, endY-startY, 0.0);
		var xAxis = new THREE.Vector3(1, 0, 0);
		var angle = startToEnd.angleTo(xAxis);
		var vector = new THREE.Vector3();
		vector.crossVectors(xAxis, startToEnd);
		var sign = Math.sign(vector.z);		
		var rotationAngle = angle*sign;

		this.boxMesh.rotation.z = rotationAngle;	

		scene.add ( this.boxMesh );	

	}

	// changes the coordinate of a point (px, py) with refer to the center of component (cx, cy)
	// to a coordinate with refer to the center of screen (0, 0)
	this.componentToScreen = function( point ) {
		var m = [(this.startPoint.x + this.endPoint.x) / 2, (this.startPoint.y + this.endPoint.y) / 2 ];
		var vectorA = [ point[0] , point[1] ];
		var vectorB = [ this.endPoint.x - m[0], this.startPoint.y - m[1] ];
		// find cx using the dot product of the two vectors 
		var absA = Math.sqrt(vectorA[0]*vectorA[0] + vectorA[1]*vectorA[1]);
		var absB = Math.sqrt(vectorB[0]*vectorB[0] + vectorB[1]*vectorB[1]);
		var cosAlfa = (vectorA[0]*vectorB[0] + vectorA[1]*vectorB[1])/(absA*absB);
		// if cosAlfa is positive, then cx is negative, otherwise it is positive 
		var cx = m[0] + cosAlfa * absA; //this is the negative of new x 

		var crossProduct = vectorA[0]*vectorB[1] - vectorA[1]*vectorB[0];
		var sinAlfa = -crossProduct/(absA*absB);
		var cy = m[1] + sinAlfa * absA; // this is the new y 
		return ([cx, cy]);
	}

	this.updateElectron = function ( electron ) {
		var obstacle = this.collision(electron);
		//var obstacle = null;
		if (obstacle == null) { 	// no colision

			// update velocity
			electron.velocity.x += this.forceX;
			electron.velocity.y += this.forceY;
			var v = Math.sqrt(electron.velocity.x * electron.velocity.x + 
								electron.velocity.y * electron.velocity.y);

			// if (v > 8) {	// don't allow the speed to become more than 10, which is the distance for raycaster
				
			// 	electron.velocity.x -= this.forceX;
			// 	electron.velocity.y -= this.forceY;
			// }

			// move the electron
			electron.x += electron.velocity.x; 
			electron.y += electron.velocity.y;

		}
		else if (obstacle.object == this.walls[0] || obstacle.object == this.walls[1]) { 
			if (obstacle.object.connected) {
				//electron.componentID = this.connections[0];
				this.bounceBack(electron, obstacle, 'wall');
				// var vX = Math.random() * velocity * 2 - velocity;
		  //   	var vY = Math.sqrt( velocity * 2 - vX*vX);   // this results in a constant velocity 

		  //   	electron.velocity.x = vX;
		  //   	electron.velocity.y = vY;
			}

			else {

				this.bounceBack(electron, obstacle, 'wall');
			}


		}

		else if (obstacle.object == this.walls[2] || obstacle.object == this.walls[3]) {		
			
			this.bounceBack(electron, obstacle, 'wall'); // bounce off the two wrapping walls
		}

		else {
			this.bounceBack(electron, obstacle, 'ion'); // bounce off the ion
		}



	}
	
	this.bounceBack = function (electron, obstacle, type) {

		
		if (type == 'wall') {
			// reflect the electron with 180 +- random(18)
			var angle = Math.PI + Math.random() * (Math.PI/5) - (Math.PI/10);
			var zAxis = new THREE.Vector3(0, 0, 1);
			electron.velocity.applyAxisAngle( zAxis, angle );
		}

		//reflect the electron around the normal vector of the ion 
		else {
			var n = obstacle.face.normal; // n is a vector3
			n.z = 0; // we just want the image of the normal vector on the XY plane with Z = 0
			var theta = electron.velocity.angleTo(n);
			var Beta = (2 * theta) - Math.PI ;
			var rotationAxis = new THREE.Vector3(); // 
			rotationAxis.crossVectors( electron.velocity, n );
			rotationAxis = rotationAxis.normalize();
			electron.velocity.applyAxisAngle( rotationAxis, Beta );

		}


		
	}

	this.collision = function ( electron ) {
		var ray = new THREE.Vector3(electron.velocity.x, electron.velocity.y, electron.velocity.z);
		ray = ray.normalize(); // sends a normalized ray in the direction of moving particle and detect obstacles
		//e.caster = raycaster;
		var pos = new THREE.Vector3(electron.x, electron.y, electron.z );
		raycaster.set(pos, ray);
		var distance = 10;
		raycaster.near = 0;
		raycaster.far = 10;
		var collisions = raycaster.intersectObjects(this.obstacles);
		if (collisions.length > 0 && collisions[0].distance <= distance) {
			//collisions[0].object.material.color.set ( 0xffCC00 );
		 	return collisions[0];
		 }
		 else {
		 	return null;
		 }
	}

}
