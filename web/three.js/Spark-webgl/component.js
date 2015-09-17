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

function Component(type, current, res, volt, startX, startY, endX, endY, direction) {
 	this.compType = type; // "wire", "resistor", "bulb", "battery"
  	this.I = current;
  	this.R = res;
  	this.V = volt;
  	this.startPoint = [startX, startY, 0.0];
  	this.endPoint = [endX, endY, 0.0]; 
  	this.direction = direction; // 0 if v=0; 1 if from Start to End; -1 if from End to Start

  	this.electronCount; // Change it later
  	this.ionCount; //Change it later
  	this.l = Math.sqrt((endX-startX)*(endX-startX)+(endY-startY)*(endY-startY));
  	this.w = 400;

  	this.forceX = this.V * (endX - startX) * direction; 
  	this.forceY = this.V * (endY - startY) * direction;

  	if (this.compType == "wire") {
  		this.electronCount = 100;
  	}
  	else {
  		this.electronCount = 10;
  	}
 

  	this.init = function(electronGeometry, ionGeometry) {
		
		this.createContainer();

  		// create electrons
		for ( i = 0; i < this.electronCount; i ++ ) {
			// create electrons 
			var electron = new THREE.Vector3();
			var l = this.l;
			electron.x = Math.random() * this.l - this.l/2; //the x coordinate changes based on component length 
			electron.y = Math.random() * 400 - 200; // component width is fix = 400
			electron.z = 5;

			//translate the electron to be inside the component
			var newCoordinate = this.componentToScreen([electron.x, electron.y]);
			electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		    //electrons.geometry.verticesNeedUpdate = true;
			

			electron.velocity = new THREE.Vector3(
		    	Math.random() * 4 - 2,		// x
		    	Math.random() * 4 - 2,		// y
		    	0);		// z

			electronGeometry.vertices.push( electron );
		}

		/*
		// this chunk of code is integretaded to above loop, I can remove it!
		for ( i = 0; i < this.electronCount; i ++) {
			var electron = electrons.geometry.vertices[i];
		 	var newCoordinate = this.componentToScreen([electron.x, electron.y]);
		 	electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		  }
		electrons.geometry.verticesNeedUpdate = true;
		*/

		// create ions
		var count = 0;
		for ( i = 1; i < this.l/100; i ++ ) {
			for (j = 1; j < this.w/100; j++) {
				var vertex = new THREE.Vector3();
				if ((i+j) % 2 == 0) {
					vertex.x = -this.l/2 + i * 100; 
					vertex.y = -this.w/2 + j * 100;
				}				
				// if (i % 2 == 0) { vertex.y = j * 100;}
				// else { vertex.y = (j+1)*100;} 
				vertex.z = 5;

				// translate the ion to be inside the component container
				var newCoordinate = this.componentToScreen([vertex.x, vertex.y]);
				vertex.x = newCoordinate[0], vertex.y = newCoordinate[1];

				ionGeometry.vertices.push( vertex );
				count++;
			}
		}
		this.ionCount = count;
		
	}

	// draw the rectangle behind the component
	this.createContainer = function() {
		var startX = this.startPoint[0], startY = this.startPoint[1];
		var endX = this.endPoint[0], endY = this.endPoint[1];

		var rectLength = Math.sqrt((endX - startX)*(endX - startX) + (endY - startY)*(endY - startY));
		console.log('container length = ' + rectLength);

		rectWidth = this.w;

		var rectShape = new THREE.Shape();
		var v1 = this.componentToScreen([-rectLength/2,-rectWidth/2]);
		var v2 = this.componentToScreen([-rectLength/2, rectWidth/2]);
		var v3 = this.componentToScreen([rectLength/2, rectWidth/2]);
		var v4 = this.componentToScreen([rectLength/2,-rectWidth/2]); 
		console.log('v1 is' + v1);
		console.log('v2 is' + v2);
		console.log('v3 is' + v3);
		console.log('v4 is' + v4);
		rectShape.moveTo( v1[0],v1[1] );
		rectShape.lineTo( v2[0],v2[1] );
		rectShape.lineTo( v3[0],v3[1] );
		rectShape.lineTo( v4[0],v4[1] );
		rectShape.lineTo( v1[0],v1[1] );

		rectGeom = new THREE.ShapeGeometry( rectShape );
		
		if (this.compType == "wire") {
			rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: 0xCCCC00 } ) ) ; // the box color
		}
		else {
			rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: 0xCCCC99 } ) ) ; // the box color
		}		

		scene.add( rectMesh );
	}


	// changes the coordinate of a point (px, py) with refer to the center of component (cx, cy)
	// to a coordinate with refer to the center of screen (0, 0)
	this.componentToScreen = function( point ) {
		var m = [(this.startPoint[0] + this.endPoint[0]) / 2, (this.startPoint[1] + this.endPoint[1]) / 2 ];
		var vectorA = [ point[0] , point[1] ];
		var vectorB = [ this.endPoint[0] - m[0], this.startPoint[1] - m[1] ];
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
/*
	this.componentToScreenNew = function( point ) {
		var m = [(this.startPoint[0] + this.endPoint[0]) / 2, (this.startPoint[1] + this.endPoint[1]) / 2 ];
		var vectorA = new THREE.Vector3( point[0] , point[1], 0 );
		var vectorB = new THREE.Vector3( this.endPoint[0] - m[0], this.startPoint[1] - m[1], 0);
		// find cx using the dot product of the two vectors 
		var absA = Math.sqrt(vectorA.x*vectorA.x + vectorA.y*vectorA.y);
		var absB = Math.sqrt(vectorB.x*vectorB.x + vectorB.y*vectorB.y);
		console.log('vectorA length = ' + vectorA.length());
		//var cosAlfa = vectorA.dot(vectorB)/(vectorA.length()*vectorB.length());
		var cosAlfa = (vectorA.x*vectorB.x + vectorA.y*vectorB.y)/(absA*absB);
		
		var cx = m[0] + cosAlfa * absA; //this is the negative of new x 

		var crossProduct = vectorA.x*vectorB.y - vectorA.y*vectorB.x;
		var sinAlfa = -crossProduct/(absA*absB);
		var cy = m[1] + sinAlfa * absA; // this is the new y 
		return ([cx, cy]);
	}

	*/

	// draw the electrons in one component
	this.updateElectrons = function( eVertices ) {
		var pCount = this.electronCount;
		for ( i = 0; i < pCount; i ++) {
			//electrons.geometry.dynamic = true;
			var electron = eVertices[i];
			if (electron.x > this.startPoint[0]+this.l) { //wrap electron
				electron.x = this.startPoint[0];
			}
			//if (this.ionHere(electron) != null) {electrons.material.color.setHex(0xFFFF00);}
			electron.velocity.x += this.forceX;
			electron.velocity.y += this.forceY;

			electron.x += electron.velocity.x;
			electron.y += electron.velocity.y;
			
		}

		// for ( i = 0; i < this.electronCount; i ++) {
		// 	var electron = electrons.geometry.vertices[i];
		// 	var newCoordinate = this.componentToScreen([electron.x, electron.y]);
		// 	electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		// }
		//particles.geometry.__dirtyVertices = true;
		electrons.geometry.verticesNeedUpdate = true;
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
