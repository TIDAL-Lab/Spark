/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe

THREE.EditorControls = function ( object, domElement ) {

	domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;
	this.center = new THREE.Vector3();

	// internals

	var scope = this;
	var vector = new THREE.Vector3();

	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	var state = STATE.NONE;

	var center = this.center;
	var normalMatrix = new THREE.Matrix3();
	var pointer = new THREE.Vector2();
	var pointerOld = new THREE.Vector2();

	// events

	var changeEvent = { type: 'change' };

	this.focus = function ( target, frame ) {

		var scale = new THREE.Vector3();
		target.matrixWorld.decompose( center, new THREE.Quaternion(), scale );

		if ( frame && target.geometry ) {

			scale = ( scale.x + scale.y + scale.z ) / 3;
			center.add(target.geometry.boundingSphere.center.clone().multiplyScalar( scale ));
			var radius = target.geometry.boundingSphere.radius * ( scale );
			var pos = object.position.clone().sub( center ).normalize().multiplyScalar( radius * 2 );
			object.position.copy( center ).add( pos );

		}

		object.lookAt( center );

		scope.dispatchEvent( changeEvent );

	};

	this.pan = function ( delta ) {

		var distance = object.position.distanceTo( center );
		//console.log(distance);
		if (!ArFlag) delta.multiplyScalar( distance * 0.001 );
		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		object.position.add( delta );
		center.add( delta );  // what is center for?
		var message = [delta.x, delta.y];
		if (!twoScreen) window.parent.postMessage(message, 'http://localhost:8080');

		scope.dispatchEvent( changeEvent );

	};

	this.zoom = function ( delta ) {

		var distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * 0.001 );

		if ( delta.length() > distance ) return;

		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		if (ArFlag) delta.multiplyScalar(-1); // with AR it reverses the zooming!
		object.position.add(delta); 
		//console.log(object.position);
		var message = [delta.z];
		if (!twoScreen) window.parent.postMessage(message, 'http://localhost:8080');

		scope.dispatchEvent( changeEvent );

	};

	/* EB:
	* radius : the distance from camera to scene (point of touch)
	* theta : rotation from right to left, along y axis (starts from 0 to 180 if and then -180 to 0)
	* phi: rotation from bottom to up, along x axis (starts from 90 goes either to 0 or 180)
	*/


	this.rotate = function ( delta ) {
		// EB AR test
		//vector.copy( object.position ).sub( center );
		vector.copy( object.position );
		console.log(vector);
		var theta = Math.atan2( vector.x, vector.z );
		var phi = Math.atan2( Math.sqrt( vector.x * vector.x + vector.z * vector.z ), vector.y );

		//console.log(delta);
		theta += delta.x;
		phi += delta.y;

		var EPS = 0.000001;

		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		// EB modification

		theta = Math.min( Math.abs(theta), Math.PI/4)*Math.sign(theta);
		if (phi >= Math.PI/2) {
			phi = Math.min( phi, Math.PI*3/4);
		}
		else {
			phi = Math.max( phi, Math.PI/4);
		}

		// END EB modifications
		var radius = vector.length();   // EB: distance from camera to scene
		//console.log(theta*180/Math.PI);
		vector.x = radius * Math.sin( phi ) * Math.sin( theta );
		vector.y = radius * Math.cos( phi );
		vector.z = radius * Math.sin( phi ) * Math.cos( theta );
		//console.log(vector);

		//object.position.copy( center ).add( vector );
		//vector.negate();
		object.position.copy( vector );
		object.lookAt( center );

		scope.dispatchEvent( changeEvent );



	};

	this.rotateOld = function ( delta ) {
		vector.copy( object.position ).sub( center );

		var theta = Math.atan2( vector.x, vector.z );
		var phi = Math.atan2( Math.sqrt( vector.x * vector.x + vector.z * vector.z ), vector.y );

		theta += delta.x;
		phi += delta.y;

		var EPS = 0.000001;

		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		// EB modification

		theta = Math.min( Math.abs(theta), Math.PI/4)*Math.sign(theta);
		if (phi >= Math.PI/2) {
			phi = Math.min( phi, Math.PI*3/4);
		}
		else {
			phi = Math.max( phi, Math.PI/4);
		}

		// END EB modifications
		var radius = vector.length();   // EB: distance from camera to scene
		//console.log(theta*180/Math.PI);
		vector.x = radius * Math.sin( phi ) * Math.sin( theta );
		vector.y = radius * Math.cos( phi );
		vector.z = radius * Math.sin( phi ) * Math.cos( theta );
		//console.log(vector);

		object.position.copy( center ).add( vector );
		object.lookAt( center );

		scope.dispatchEvent( changeEvent );



	};


	this.show = function () {    // to show measures of a component
		//renderer.setClearColor ( 0x330086 );
		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();
		mouse.x = ( pointer.x / window.innerWidth ) * 2 - 1;
		mouse.y = - ( pointer.y / window.innerHeight ) * 2 + 1;	

		// update the picking ray with the camera and mouse position	
		raycaster.setFromCamera( mouse, object );
		// calculate objects intersecting the picking ray
		var objects = [];
  		for (k=0; k < components.length; k++) {
			objects.push(components[k].container); // add all the components to the parent object
		}
		var intersects = raycaster.intersectObjects( objects );
		//for ( var i = 0; i < intersects.length; i++ ) {
		if (intersects.length != 0) {
			var thisObject = intersects[ 0 ].object; 
			var index = objects.indexOf(thisObject);
			//thisObject.material.color.set( 0xFF9900 );
			var thisComponent = components[index]; 

			thisComponent.clicked();
		}
		else { // no component is clicked
			unSelectComponent();   // function in the component class
		}
		
	}

	// mouse

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		if ( event.button === 0 ) {

			//state = STATE.ROTATE;
			state = STATE.PAN;

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

		} else if ( event.button === 2 ) {

			state = STATE.PAN;

		}

		pointerOld.set( event.clientX, event.clientY );

		domElement.addEventListener( 'mousemove', onMouseMove, false );
		domElement.addEventListener( 'mouseup', onMouseUp, false );
		domElement.addEventListener( 'mouseout', onMouseUp, false );
		domElement.addEventListener( 'click', onMouseUp, false );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		pointer.set( event.clientX, event.clientY );

		var movementX = pointer.x - pointerOld.x;
		var movementY = pointer.y - pointerOld.y;

		if ( state === STATE.ROTATE ) {

			scope.rotate( new THREE.Vector3( - movementX * 0.005, - movementY * 0.005, 0 ) );

		} else if ( state === STATE.ZOOM ) {

			scope.zoom( new THREE.Vector3( 0, 0, movementY ) );

		} else if ( state === STATE.PAN ) {

			scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

		}

		pointerOld.set( event.clientX, event.clientY );

	}

	function onMouseUp( event ) {

		domElement.removeEventListener( 'mousemove', onMouseMove, false );
		domElement.removeEventListener( 'mouseup', onMouseUp, false );
		domElement.removeEventListener( 'mouseout', onMouseUp, false );
		domElement.removeEventListener( 'click', onMouseUp, false );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		event.preventDefault();

		// if ( scope.enabled === false ) return;

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = - event.wheelDelta;

		} else if ( event.detail ) { // Firefox

			delta = event.detail * 10;

		}

		scope.zoom( new THREE.Vector3( 0, 0, delta ) );

	}

	function onMouseClick( event ) {
		//console.log("double clicked");
		pointer.set( event.clientX, event.clientY );
		if (freezeFlag || !ArFlag) scope.show();
	}


	domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	domElement.addEventListener( 'mousedown', onMouseDown, false );
	domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
	domElement.addEventListener( 'click', onMouseClick, false );

	// touch

	var touch = new THREE.Vector3();

	var touches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	var prevTouches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

	var prevDistance = null;

	function touchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1: 
				// EB: The Touch.pageX read-only property returns the X coordinate of the touch point relative to the viewport, including any scroll offset.

				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				prevDistance = touches[ 0 ].distanceTo( touches[ 1 ] );
				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}


	function touchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var getClosest = function( touch, touches ) {

			var closest = touches[ 0 ];

			for ( var i in touches ) {
				if ( closest.distanceTo(touch) > touches[ i ].distanceTo(touch) ) closest = touches[ i ];
			}

			return closest;

		}

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: pan
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				

				// Rotate
				//scope.rotate( touches[ 0 ].sub( getClosest( touches[ 0 ], prevTouches ) ).multiplyScalar( - 0.005 ) );

				// Pan
				var offset0 = touches[ 0 ].clone().sub( getClosest( touches[ 0 ], prevTouches ) );
				var offset1 = touches[ 1 ].clone().sub( getClosest( touches[ 1 ], prevTouches ) );
				offset0.x = -offset0.x;
				offset1.x = -offset1.x;

				if (freezeFlag || !ArFlag) scope.pan( offset0.add( offset1 ).multiplyScalar( 0.5 ) );

				break;

			case 2: // two-fingered touch: zoom
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				//scope.rotate( touches[ 0 ].sub( getClosest( touches[ 0 ], prevTouches ) ).multiplyScalar( - 0.005 ) );
				distance = touches[ 0 ].distanceTo( touches[ 1 ] );
				if (freezeFlag || !ArFlag) scope.zoom( new THREE.Vector3( 0, 0, prevDistance - distance ) );
				prevDistance = distance;


				// var offset0 = touches[ 0 ].clone().sub( getClosest( touches[ 0 ], prevTouches ) );
				// var offset1 = touches[ 1 ].clone().sub( getClosest( touches[ 1 ], prevTouches ) );
				// offset0.x = -offset0.x;
				// offset1.x = -offset1.x;

				// scope.pan( offset0.add( offset1 ).multiplyScalar( 0.5 ) );

				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}

	domElement.addEventListener( 'touchstart', touchStart, false );
	domElement.addEventListener( 'touchmove', touchMove, false );

};

THREE.EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.EditorControls.prototype.constructor = THREE.EditorControls;
