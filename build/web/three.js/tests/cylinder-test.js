function cylinderTest() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    var width = 320;
    var height = 240;

    //var overlayCamera = new THREE.Camera();
    overlayCamera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
    overlayCamera.position.z = 50;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width * 2, height * 2);
 
    document.body.appendChild( renderer.domElement );

    var ambientLight = new THREE.AmbientLight(0x555555);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0.3, 0.5, 2);
    overlayCamera.add(directionalLight);

    
    // now draw the particle system in a box
    // first draw the container (box)
    var red = 0xD11919;
    var green = 0x008F00;
    var gray = 0x808080;
    var blue = 0x000099;
    var batteryImg = THREE.ImageUtils.loadTexture( "../textures/battery3t.png" );
    var cubeLength = 20;
    var cubeWidth = 10;
    var cubeGeometry = new THREE.BoxGeometry(cubeLength, cubeWidth, 5);
    var cubeMaterial = new THREE.MeshBasicMaterial();
    cubeMaterial.transparent = true;
    cubeMaterial.opacity = 0.9;
    cubeMaterial.depthWrite = false;
    var cube = new THREE.Mesh( cubeGeometry, cubeMaterial ); 
        
    var sphereGeometry = new THREE.SphereGeometry(cubeWidth/2, 32, 32);
    var sphereMaterial = new THREE.MeshBasicMaterial( { color: gray });
    sphereMaterial.transparent = true;
    sphereMaterial.opacity = 0.9;
    //sphereMaterial.depthWrite = false;
    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
    //sphere.position.set(20, 0, 0);

    // Then put the scene together.
    var overlayScene = new THREE.Scene();
    overlayScene.add(ambientLight);

    var target = cube;
    console.log('before: ' + target.position.x);
    cube.position.set(2, 0, 0);
    sphere.position.set(-20, 0, 0);
    console.log('after: ' + target.position.x);
    target.updateMatrixWorld();
    console.log('afterter: ' + target.position.x);
    target.material.side = THREE.DoubleSide;
    //target.matrixAutoUpdate = false;
    
    overlayScene.add(target);

    overlayScene.add(sphere);

    
    var raycaster = new THREE.Raycaster();
    // create a ray
    var direction = new THREE.Vector3(0.0, 1.0 , 0.0);
    direction.normalize();
    var startPoint = new THREE.Vector3(0.0, 0.0, 0.0);

    var ray = new THREE.Ray( startPoint, direction );

    //ray.applyMatrix4(sphere.matrixWorld);
    //raycaster.set(startPoint, direction );
    raycaster.ray.copy(ray);

    raycaster.near = 0;
    raycaster.far = 10;
    var collision = raycaster.intersectObject(target);
    if ( collision.length > 0 ) {  
        console.log('collision: ' + collision.length);
        //collision[ 1 ].face.color.set( green );
     }
    else { 
        console.log('no collision');        
    }

    renderer.render(overlayScene, overlayCamera);
    

}

