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

var electronSize = 20, ionSize = 40;
var rectGeom, rectMesh;
var boundingBox;

function Component(type, current, res, volt, startX, startY, endX, endY, direction) {
 	this.compType = type; // "wire", "resistor", "bulb", "battery"
  	this.I = current;
  	this.R = res;
  	this.V = volt;
  	this.startPoint = new THREE.Vector3( startX, startY, 0.0 );
  	this.endPoint = new THREE.Vector3( endX, endY, 0.0 ); 
  	this.direction = direction; // 0 if v=0; 1 if from Start to End; -1 if from End to Start

  	this.electronCount; // Change it later
  	this.ionCount; //Change it later
  	this.l = Math.sqrt((endX-startX)*(endX-startX)+(endY-startY)*(endY-startY));
  	this.w = 110;
  	this.walls = [];
  	// this.ions = [];
  	this.obstacles = [];

  	this.forceX = this.V * (endX - startX) * direction; 
  	this.forceY = this.V * (endY - startY) * direction;

  	if (this.compType == "Wire") {
  		this.electronCount = 100;
  	}
  	else if ( this.compType == "Resistor" ){
  		this.electronCount = 10;
  	}
  	else {
  		this.electronCount = 0;
  	}
 

  	this.init = function(electronGeometry, ionGeometry) {

		
		this.createBox();

  		// create electrons
		for ( i = 0; i < this.electronCount; i ++ ) {
			// create electrons 
			var electron = new THREE.Vector3();
			var l = this.l;
			electron.x = Math.random() * this.l - this.l/2; //the x coordinate changes based on component length 
			electron.y = Math.random() * this.w - this.w/2; // component width 
			electron.z = 0;

			//translate the electron to be inside the component
			var newCoordinate = this.componentToScreen([electron.x, electron.y]);
			electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		    //electrons.geometry.verticesNeedUpdate = true;
			
		    var vX = Math.random() * 4 - 2;
		    var vY = Math.sqrt(4 - vX*vX);   // this results in a constant velocity of 2

			electron.velocity = new THREE.Vector3(
		    	vX,		// x
		    	vY,		//  
		    	0);		// z

			electronGeometry.vertices.push( electron );
		}
		if (this.compType != "Battery") {
			// create ions
			var count = 0;
			for ( i = 1; i < this.l/50; i ++ ) {
				for (j = 1; j < this.w/50; j++) {
					var ion;
					if ((i+j) % 3 == 0) {
						ion = new THREE.Vector3();
						ion.x = -this.l/2 + i * 50; 
						ion.y = -this.w/2 + j * 50;

						// if (i % 2 == 0) { vertex.y = j * 100;}
						// else { vertex.y = (j+1)*100;} 
						ion.z = 0;

						// translate the ion to be inside the component container
						var newCoordinate = this.componentToScreen([ion.x, ion.y]);
						ion.x = newCoordinate[0], ion.y = newCoordinate[1];

						ionGeometry.vertices.push( ion );
						//this.ions.push(ion);
						count++;
					}				

				}
			}
			this.ionCount = count;

		}


		//this.obstacles.concat(this.walls, this.ions);
		
		
	}

	// draw the rectangle behind the component
	this.createBox = function() {
		var startX = this.startPoint.x, startY = this.startPoint.y;
		var endX = this.endPoint.x, endY = this.endPoint.y;

		var center = new THREE.Vector3( (startX + endX) / 2, (startY + endY) / 2, 0.0 );
		var v = new THREE.Vector3( endX-startX, endY-startY, 0.0);
		var rotationAngle = Math.atan((endY-startY)/(endX-startX));
		var zAxis = new THREE.Vector3(0, 0, 1);
		var boxLength = Math.sqrt((endX - startX)*(endX - startX) + (endY - startY)*(endY - startY));
		var boxWidth = this.w;
		var boxHeight = 100;
		var boxGeom = new THREE.BoxGeometry( boxLength, boxWidth, boxHeight);
		var boxMaterial = new THREE.MeshBasicMaterial( { color: 0xCCCC00 } );
		boxMaterial.transparent = true;
		boxMaterial.opacity = 0.5;
		boxMaterial.depthWrite = false;
		var boxMesh = new THREE.Mesh( boxGeom, boxMaterial );
		
		// now add the walls
		var wallMaterial = new THREE.MeshBasicMaterial( { color: 0xCC0C00 } );
		if (this.compType == 'Battery') {
			boxMaterial.color.setHex(0x009933);
			wallMaterial.color.setHex(0x009933);
		}
        var walls = [
                    new THREE.Mesh( new THREE.PlaneGeometry(boxHeight, boxWidth), wallMaterial),
                    new THREE.Mesh( new THREE.PlaneGeometry(boxHeight, boxWidth), wallMaterial),
                    new THREE.Mesh( new THREE.PlaneGeometry(boxLength, boxHeight), wallMaterial),
                    new THREE.Mesh( new THREE.PlaneGeometry(boxLength, boxHeight), wallMaterial)
            ];
        // wall0 contains start point
        walls[0].rotation.y = Math.PI / 2;	
        walls[0].position.x = -boxLength / 2;
        // wall1 contains end point
        walls[1].rotation.y = -Math.PI / 2;	
        walls[1].position.x = boxLength / 2;
        // wall2 is the wall with lower y
        walls[2].rotation.x = -Math.PI / 2;
        walls[2].position.y = -boxWidth / 2;
        // wall 3 is the wall with higher y
		walls[3].rotation.x = Math.PI / 2;
        walls[3].position.y = boxWidth / 2;

		for (i=0; i< walls.length; i++) {
			this.walls[i] = walls[i]; // this is component
			boxMesh.add(walls[i]);
		}

		boxMesh.position.set(center.x, center.y, center.z);
		//boxMesh.geometry.translate ( center.x, center.y, center.z );
		//boxMesh.rotateOnAxis(zAxis, rotationAngle); // instead, the line below
		boxMesh.rotation.z = rotationAngle;
		//console.log("rotation angle is " + rotationAngle);


		scene.add ( boxMesh );

		/* did not work!
		//boundingBox = new THREE.Box3().setFromObject(boxMesh);
		boxMesh.geometry.computeBoundingBox();
    	boundingBox = boxMesh.geometry.boundingBox;
		*/	
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
		// if cosAlfa > 0 => cx is negative, otherwise is positive 
		var cx = m[0] + cosAlfa * absA; //this is the negative of new x 

		var crossProduct = vectorA[0]*vectorB[1] - vectorA[1]*vectorB[0];
		var sinAlfa = -crossProduct/(absA*absB);
		var cy = m[1] + sinAlfa * absA; // this is the new y 
		return ([cx, cy]);
	}


	// draw the electrons in one component
	this.updateElectrons = function( eVertices ) {
		var pCount = this.electronCount;
		for ( i = 0; i < pCount; i ++) {
			//electrons.geometry.dynamic = true;
			var electron = eVertices[i];
			// if (electron.x > this.startPoint.x+this.l) { //wrap electron
			// 	electron.x = this.startPoint.x;
			// }
			electron.velocity.x += this.forceX;
			electron.velocity.y += this.forceY;

			if (this.wallCollision(electron)) {
				electron.velocity.x = -electron.velocity.x;
				electron.velocity.y = -electron.velocity.y;
				electron.x += electron.velocity.x; //bounces off the wall with 180 degree
				electron.y += electron.velocity.y;
			}
			else { 			// no colission
				electron.x += electron.velocity.x; //bounces off the wall with 180 degree
				electron.y += electron.velocity.y;
				//console.log('this electron velocity is ' + electron.velocity.x + ' ' + electron.velocity.y );
			}
			
		}

		// for ( i = 0; i < this.electronCount; i ++) {
		// 	var electron = electrons.geometry.vertices[i];
		// 	var newCoordinate = this.componentToScreen([electron.x, electron.y]);
		// 	electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		// }
		//particles.geometry.__dirtyVertices = true;
		electrons.geometry.verticesNeedUpdate = true;
	}

	this.wallCollision = function ( electron ) {
		var ray = new THREE.Vector3(electron.velocity.x, electron.velocity.y, electron.velocity.z);
		ray = ray.normalize();
		//e.caster = raycaster;
		var pos = new THREE.Vector3(electron.x, electron.y, electron.z );
		raycaster.set(pos, ray);
		var distance = 10;
		raycaster.near = 0;
		raycaster.far = 11;
		var obstacles = ions;
		var collisions = raycaster.intersectObjects(this.walls);
		if (collisions.length > 0 && collisions[0].distance <= distance) {
			//collisions[0].object.material.color.set ( 0xffCC00 );
		 	return true;
		 }
		 else {
		 	return false;
		 }
	}

	  /** finds if there is any ion nearby the electron
	  @return Ion
	  */  
	this.ionHere = function(el) {
		//var r = (ionSize/2) + (electronSize/2);
		var r = 5; // because I am not sure what is the correct r!!	
		for (j = 0; j < 20; j++) {
			var ion = ions.geometry.vertices[j];
			var distance = (ion.x - el.x) * (ion.x - el.x) + (ion.y - el.y) * (ion.y - el.y);

			if ( distance <= r * r ) {return ion;}
		}
		return null;
	}

}
