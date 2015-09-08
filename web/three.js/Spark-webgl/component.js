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
var electrons, electronGeometry, electronMaterial;
var i, j;
var ions, ionGeometry, ionMaterial;
var electronSize = 20, ionSize = 40;
var rectGeom, rectMesh;

function Component(type, current, res, volt, startx, starty, endx, endy) {
 	this.compType = type; // "wire", "resistor", "bulb", "battery"
  	this.I = current;
  	this.R = res;
  	this.V = volt;
  	this.startPoint = [startx, starty, 0.0];
  	this.endPoint = [endx, endy, 0.0]; 
  	this.electronCount; // Change it later
  	this.ionCount; //Change it later
  	this.l = Math.sqrt((endx-startx)*(endx-startx)+(endy-starty)*(endy-starty));
  	this.w = 400;

  	if (this.compType == "wire") {
  		this.electronCount = 100;
  		//this.ionCount = 20;
  	}
  	else {
  		this.electronCount = 10;
  	}
  	//init();

  	this.init = function() {

  		// create electrons
		electronGeometry = new THREE.Geometry();
		for ( i = 0; i < this.electronCount; i ++ ) {
			// create electrons 
			var vertex = new THREE.Vector3();
			vertex.x = Math.random() * 1000 - 500; //between -500 and 500
			vertex.y = Math.random() * 400 - 200; // between -100 and 100
			vertex.z = 5;

			electronGeometry.vertices.push( vertex );
		}
		electronMaterial = new THREE.PointCloudMaterial( { size: electronSize, map: ball, color: 0x000099 , transparent: true } );
		electrons = new THREE.PointCloud ( electronGeometry, electronMaterial );
		scene.add ( electrons ); 

		for ( i = 0; i < this.electronCount; i ++) {
			var electron = electrons.geometry.vertices[i];
			var newCoordinate = this.componentToScreen([electron.x, electron.y]);
			electron.x = newCoordinate[0], electron.y = newCoordinate[1];
		}
		electrons.geometry.verticesNeedUpdate = true;

		// create ions
		ionGeometry = new THREE.Geometry();
		// for ( i = 0; i < this.ionCount; i ++ ) {
		// 	// create ions 
		// 	var vertex = new THREE.Vector3();
		// 	vertex.x = Math.random() * 1000 - 500; //between -500 and 500
		// 	vertex.y = Math.random() * 400 - 200; // between -100 and 100
		// 	vertex.z = 5;

		// 	ionGeometry.vertices.push( vertex );
		// }
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

				ionGeometry.vertices.push( vertex );
				count++;
			}
		}
		this.ionCount = count;

		ionMaterial = new THREE.PointCloudMaterial( { size: ionSize, map: ball, color: 0xCC0000 , transparent: true } );
		ions = new THREE.PointCloud ( ionGeometry, ionMaterial );
		scene.add ( ions ); 

		// change the coordinate based on the component coordinations
		for ( i = 0; i < this.ionCount; i ++) {
			var ion = ions.geometry.vertices[i];
			var newCoordinate = this.componentToScreen([ion.x, ion.y]);
			ion.x = newCoordinate[0], ion.y = newCoordinate[1];
		}

		//this.createContainer();
				var startX = this.startPoint[0], startY = this.startPoint[1];
		var endX = this.endPoint[0], endY = this.endPoint[1];

		var rectLength = Math.sqrt((endX - startX)*(endX - startX) + (endY - startY)*(endY - startY));
		//window.alert(rectLength);

		rectWidth = this.w;

		var rectShape = new THREE.Shape();
		var v1 = this.componentToScreen([-rectLength/2,-rectWidth/2]);
		var v2 = this.componentToScreen([-rectLength/2, rectWidth/2]);
		var v3 = this.componentToScreen([rectLength/2, rectWidth/2]);
		var v4 = this.componentToScreen([rectLength/2,-rectWidth/2]); 
		rectShape.moveTo( v1[0],v1[1] );
		rectShape.lineTo( v2[0],v2[1] );
		rectShape.lineTo( v3[0],v3[1] );
		rectShape.lineTo( v4[0],v4[1] );
		rectShape.lineTo( v1[0],v1[1] );
		// rectShape.moveTo( -rectLength/2,-rectWidth/2 );
		// rectShape.lineTo( -rectLength/2, rectWidth/2 );
		// rectShape.lineTo( rectLength/2, rectWidth/2 );
		// rectShape.lineTo( rectLength/2, -rectWidth/2 );
		// rectShape.lineTo( -rectLength/2,-rectWidth/2 );

		rectGeom = new THREE.ShapeGeometry( rectShape );
		
		if (this.compType == "wire") {
			rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: 0xCCCC00 } ) ) ; // the box color
		}
		else {
			rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: 0xCCCC99 } ) ) ; // the box color
		}		

		scene.add( rectMesh );
	}

	// draw the rectangle behind the component
	this.createContainer = function() {
		var startX = this.startPoint[0], startY = this.startPoint[1];
		var endX = this.endPoint[0], endY = this.endPoint[1];

		var rectLength = Math.sqrt((endX - startX)*(endX - startX) + (endY - startY)*(endY - startY));
		//window.alert(rectLength);

		rectWidth = this.w;

		var rectShape = new THREE.Shape();
		var v1 = this.componentToScreen([-rectLength/2,-rectWidth/2]);
		var v2 = this.componentToScreen([-rectLength/2, rectWidth/2]);
		var v3 = this.componentToScreen([rectLength/2, rectWidth/2]);
		var v4 = this.componentToScreen([rectLength/2,-rectWidth/2]); 
		rectShape.moveTo( v1[0],v1[1] );
		rectShape.lineTo( v2[0],v2[1] );
		rectShape.lineTo( v3[0],v3[1] );
		rectShape.lineTo( v4[0],v4[1] );
		rectShape.lineTo( v1[0],v1[1] );
		// rectShape.moveTo( -rectLength/2,-rectWidth/2 );
		// rectShape.lineTo( -rectLength/2, rectWidth/2 );
		// rectShape.lineTo( rectLength/2, rectWidth/2 );
		// rectShape.lineTo( rectLength/2, -rectWidth/2 );
		// rectShape.lineTo( -rectLength/2,-rectWidth/2 );

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
		var vectorA = [ point[0] - m[0] , point[1] - m[1] ];
		var vectorB = [ this.startPoint[0] - m[0], this.startPoint[1] - m[1] ];
		// find cx using the dot product of the two vectors 
		var absA = Math.sqrt(vectorA[0]*vectorA[0] + vectorA[1]*vectorA[1]);
		var absB = Math.sqrt(vectorB[0]*vectorB[0] + vectorB[1]*vectorB[1]);
		var cosAlfa = (vectorA[0]*vectorB[0] + vectorA[1]*vectorB[1])/(absA*absB);
		// if cosAlfa > 0 => cx is negative, otherwise is positive 
		var cx = cosAlfa * absA; //this is the negative of new x 

		var crossProduct = vectorA[0]*vectorB[1] - vectorA[1]*vectorB[0];
		var sinAlfa = crossProduct/(absA*absB);
		var cy = sinAlfa * absA; // this is the new y 
		return ([-cx, cy]);
	}

	// draw the electrons in one component
	this.updateElectrons = function() {
		var pCount = this.electronCount;
		for ( i = 0; i < pCount; i ++) {
			//electrons.geometry.dynamic = true;
			var electron = electrons.geometry.vertices[i];
			if (electron.x > 1000) { //wrap electron
				electron.x = 0;
			}
			//if (this.ionHere(electron) != null) {electrons.material.color.setHex(0xFFFF00);}
			
			 //electron.x += 3;
			
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
