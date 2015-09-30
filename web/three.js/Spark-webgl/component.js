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
//var boundingBox;
var velocity = 2;
var standardLength = 200; // it is 100 multiplies by the factor (here 2) that it is scaled by when passed from Parse

function Component(type, current, res, volt, startX, startY, endX, endY, direction) {
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

  	this.forceX = this.V * (endX - startX) * direction; 
  	this.forceY = this.V * (endY - startY) * direction;

  	if (this.compType == "Wire") {
  		this.electronCount = Math.round( 50 * this.l/standardLength); // this.l might not be an integer
  	}
  	else if ( this.compType == "Battery" ){
  		this.electronCount = 0;
  	}
  	else { 		// Resistor or Bulb
  		this.electronCount = 50;
  	}
 

  	this.init = function( electronGeometry, ID ) {
  		this.ID = ID;
		
		this.createBox();

  		// create electrons
		for ( i = 0; i < this.electronCount; i ++ ) {

			var electron = new THREE.Vector3();
			var l = this.l;
			electron.x = Math.random() * this.l - this.l/2; //the x coordinate changes based on component length 
			electron.y = Math.random() * this.w - this.w/2; // component width 
			electron.z = 0;

			//translate the electron to be inside the component
			var newCoordinate = this.componentToScreen([electron.x, electron.y]);
			electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		    //electrons.geometry.verticesNeedUpdate = true;

		    var vX = Math.random() * velocity * 2 - velocity;
		    var vY = Math.sqrt( velocity * 2 - vX*vX);   // this results in a constant velocity of 2

			electron.velocity = new THREE.Vector3(
		    	vX,		// x
		    	vY,		//  
		    	0);		// z

			electron.componentID = new THREE.Vector3(
				this.ID,	// this shows which component the electrons belongs to at each tick
				0,
				0);

			electronGeometry.vertices.push( electron );
		}

		this.obstacles = this.ions.concat(this.walls);

	}

	// create the box and add walls and ions as the box children
	this.createBox = function() {
		var startX = this.startPoint.x, startY = this.startPoint.y;
		var endX = this.endPoint.x, endY = this.endPoint.y;

		var center = new THREE.Vector3( (startX + endX) / 2, (startY + endY) / 2, 0.0 );
		var v = new THREE.Vector3( endX-startX, endY-startY, 0.0);
		var rotationAngle = Math.atan((endY-startY)/(endX-startX));
		var zAxis = new THREE.Vector3(0, 0, 1);
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
		var wallMaterial = new THREE.MeshBasicMaterial( { color: 0xCC0C00 } );
		if (this.compType == 'Battery') {
			boxMaterial.color.setHex(0x009933);
			wallMaterial.color.setHex(0x009933);
		}
        var walls = [
                    new THREE.Mesh( new THREE.PlaneBufferGeometry(boxHeight, boxWidth), wallMaterial),
                    new THREE.Mesh( new THREE.PlaneBufferGeometry(boxHeight, boxWidth), wallMaterial),
                    new THREE.Mesh( new THREE.PlaneBufferGeometry(boxLength, boxHeight), wallMaterial),
                    new THREE.Mesh( new THREE.PlaneBufferGeometry(boxLength, boxHeight), wallMaterial)
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
			this.boxMesh.add(walls[i]);
		}

		// now create ions and add them to the box
		if (this.compType != "Battery") { // no ions for battery

			// create ions
			var count = 0;
			for ( i = 1; i < this.l/50; i ++ ) {
				for (j = 1; j < this.w/50; j++) {
					var pos;
					if ((i+j) % 3 == 0) {
						pos = new THREE.Vector3();
						pos.x = -this.l/2 + i * 50; 
						pos.y = -this.w/2 + j * 50;
						pos.z = 0;

						var ionGeometry = new THREE.SphereGeometry(10, 128, 128 );
						//ionGeometry.vertices.push( pos );
						var ionMaterial = new THREE.MeshPhongMaterial( {color: 0xCC0000 , transparent: true} );
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
			
		console.log('compoent boxmesh has this many children: ' + this.boxMesh.children.length);
		console.log('number of ions of this component is: ' + this.ions.length);

		this.boxMesh.position.set(center.x, center.y, center.z);
		//boxMesh.geometry.translate ( center.x, center.y, center.z );
		//boxMesh.rotateOnAxis(zAxis, rotationAngle); // instead, the line below
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
		var v = new THREE.Vector3( endX-startX, endY-startY, 0.0);
		var rotationAngle = Math.atan((endY-startY)/(endX-startX));
		var zAxis = new THREE.Vector3(0, 0, 1);
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

		electron.velocity.x += this.forceX;
		electron.velocity.y += this.forceY;

		if (this.collision(electron)) {
			// reflect the electron with 180 degree
			electron.velocity.x = -electron.velocity.x;
			electron.velocity.y = -electron.velocity.y;
			var sign = Math.sign(electron.velocity.y);
			// now add a tiny random angle
			var velocity2 = velocity * velocity;
			var deltaVX = electron.velocity.x * (Math.random() * 0.7 - 0.35); // random between -0.1 and 0.1 of velocityX
			//var deltaVX = 0;
			electron.velocity.x += deltaVX;
			var vx2 = electron.velocity.x * electron.velocity.x;
			electron.velocity.y = Math.sqrt(velocity2 - vx2) * sign;

			electron.x += electron.velocity.x; //bounces off the wall with 180 degree
			electron.y += electron.velocity.y;
		}
		else { 			// no colission
			electron.x += electron.velocity.x; //bounces off the wall with 180 degree
			electron.y += electron.velocity.y;
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
		raycaster.far = 11;
		//var obstacles = this.ions.concat(this.walls);
		var collisions = raycaster.intersectObjects(this.obstacles);
		if (collisions.length > 0 && collisions[0].distance <= distance) {
			//collisions[0].object.material.color.set ( 0xffCC00 );
		 	return true;
		 }
		 else {
		 	return false;
		 }
	}


/*
	// draw the electrons in one component
	this.updateElectrons = function( eVertices, start, end ) {
		var pCount = this.electronCount;
		for ( i = start; i < end; i ++) {
			//electrons.geometry.dynamic = true;
			var electron = eVertices[i];

			electron.velocity.x += this.forceX;
			electron.velocity.y += this.forceY;

			if (this.collision(electron)) {
				// reflect the electron with 180 degree
				electron.velocity.x = -electron.velocity.x;
				electron.velocity.y = -electron.velocity.y;
				var sign = Math.sign(electron.velocity.y);
				// now add a tiny random angle
				var velocity2 = velocity * velocity;
				var deltaVX = electron.velocity.x * (Math.random() * 0.7 - 0.35); // random between -0.1 and 0.1 of velocityX
				//var deltaVX = 0;
				electron.velocity.x += deltaVX;
				var vx2 = electron.velocity.x * electron.velocity.x;
				electron.velocity.y = Math.sqrt(velocity2 - vx2) * sign;

				electron.x += electron.velocity.x; //bounces off the wall with 180 degree
				electron.y += electron.velocity.y;
			}
			else { 			// no colission
				electron.x += electron.velocity.x; //bounces off the wall with 180 degree
				electron.y += electron.velocity.y;
			}

			
		}

		//particles.geometry.__dirtyVertices = true;
		electrons.geometry.verticesNeedUpdate = true;
	}
*/

}
