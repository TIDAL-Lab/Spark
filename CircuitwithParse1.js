// ~100 electrons
// initial random directions
// constrained by wire


//
//==============================================================================
// Vertex shader program:
var VSHADER_SOURCE =
  'precision highp float;\n' +        // req'd in OpenGL ES if we use 'float'
  //
  'attribute vec4 a_Position; \n' +
  'attribute vec4 a_Color; \n' +
  'attribute float a_diam; \n' +
  'varying vec4 v_Color; \n' +
  'uniform int renderMode; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  'uniform mat4 u_ProjMatrix; \n' +
  'void main() {\n' +
  '  gl_PointSize = a_diam;\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;  \n' + 
  '  v_Color = a_Color; \n' +
  
  /*'  } else if (renderMode == 1) {\n' +
  '   gl_Position = u_ProjMatrix * u_ViewMatrix * a_firePos;\n' +
  '   v_Color = vec4(a_fireColor, 1.0); \n' + 
  '  }\n' +*/
  '} \n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// The program gets all its info for that vertex through the 'attribute vec4' 
// variable a_Position, which feeds it values for one vertex taken from from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function. 

//==============================================================================// Fragment shader program:
var FSHADER_SOURCE =
  
  'precision mediump float;\n' +
  'varying vec4 v_Color; \n' +
  'void main() {\n' +
  
  '       float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '       if(dist < 0.5) { \n' + 
  '           gl_FragColor = vec4((1.0 - 1.5*dist)*v_Color.rgb, v_Color.a);\n' +
  '       } else { discard; }\n' +
  
  '} \n';





function Force (forcetype, start, end, width, voltage, direction) {
  /** direction determines the direction the force acts**/
  //1- upward or to the right
  //2- downward or to the left
  // 0 = gravity, 
  this.forceType = forcetype;
/*  this.dragConst = 0.975;
  this.circForce = 5.0;
  this.BoidSep = 1000.0;
  this.BoidAli = 500.0;
  this.BoidCoh = 2.1;*/

  this.centForce = -5.0;
  this.electro = 5.0;
  this.strt = start;
  this.end = end;
  this.wid = width;
  this.voltage = voltage;
  this.direction = direction;
} 

function Constraint (type, size, xloc, yloc, zloc, height, endptArray1, endptArray2) {
  this.Ctype = type; // 0=wire, 1=battery, 2=resistor, 3=lighbulb
  this.Csize = size;
  this.xpos = xloc;
  this.ypos = yloc;
  this.zpos = zloc;
  this.hig = height;
  this.strt = endptArray1;
  this.end = endptArray2; 
}



  var DRAG_CONST = 0.99;
  //var VOLTAGE = 100.0;


function CircuitComponent(type, current, res, volt, startx, starty, endx, endy, direction) {
  this.compType = type;
  this.curr = current;
  this.resistance = res;
  this.voltage = volt;
  this.endp1 = [startx, starty, 0.0];
  this.endp2 = [endx, endy, 0.0];
  this.innerwall = direction; // 0 for + x dir, 1 for -x, 2 for +y, 3 for -y  
}


// constant array indices for particle array
const P_MASS = 0;
const P_SIZE = 1;
const P_POSX = 2;
const P_POSY = 3;
const P_POSZ = 4;
const P_VELX = 5;
const P_VELY = 6;
const P_VELZ = 7;
const P_FORX = 8;
const P_FORY = 9;
const P_FORZ = 10;
const P_CRED = 11;
const P_CGRN = 12;
const P_CBLU = 13;
const P_TPRT = 14;
const P_WALL = 15; // The wall the prticle initializes in
//const P_

function reset(Circuit){
    currentConst = 10; // multiplied with calculated current to create "realistic" looking flows
    IonNumConst = 10; // multiplied with calculated number of ions in circuit component so wires aren't empty
    PartEleCount = 16; // number of fields per particle in the state array
    numIons = 200; // total number of ions in circuit
    numWalls = 0;// = numComps*2;
    circWidth = 0.2 // globally defined circuit width
    f = [ ];// = new Array(numComps); // array used to hold forces
    numParticles = 50;//200; // number of electrons
    ionSize = 10; // size of each ion
    g_EyeRadius = 4.0, g_EyeZrot = 50.0, g_EyeXrot = 90; // vars used for camera perspective
    isPart = true; // T/F value used to tell the shader if rendering particles or other shapes (lines, triangles)
    circOn = 1, dragOn = 1;
    Solver = 0; // 0 for Euler
    WallsOn = 1;  
    FSIZE = s.BYTES_PER_ELEMENT;
    timeStep = 1.0/30.0;
    g_last = Date.now();
    RenderMode = 0; // 0 -> circuit, 1-> unstable spring/mass, 2-> stable spring/mass, 3-> fire, 4-> boids, 5 -> atom
    numComps = Circuit.length;

    s = new Float32Array(numParticles*PartEleCount);

    resistanceTotal = 0;
    constraints = [ ];
    current = 0;
    circWalls = new Float32Array(12*numComps*PartEleCount);
}

var currentConst = 10; // multiplied with calculated current to create "realistic" looking flows
var IonNumConst = 10; // multiplied with calculated number of ions in circuit component so wires aren't empty
var PartEleCount = 16; // number of fields per particle in the state array
var numIons = 200; // total number of ions in circuit
var numWalls;// = numComps*2;
var circWidth = 0.2 // globally defined circuit width
var f;// = new Array(numComps); // array used to hold forces
var numParticles = 200; // number of electrons
var ionSize = 15; // size of each ion
var g_EyeRadius = 4.0, g_EyeZrot = 50.0, g_EyeXrot = 90; // vars used for camera perspective
var isPart = true; // T/F value used to tell the shader if rendering particles or other shapes (lines, triangles)
var circOn = 1, dragOn = 1;
var Solver = 0; // 0 for Euler
var WallsOn = 1;



var resistanceTotal = 0;
var constraints;
var current;
// calculate the current in the circuit
function calcResistance(Circuit){
  for (i = 0; i < Circuit.length; i++) {
    console.log('res total:', resistanceTotal);
    resistanceTotal += parseFloat(Circuit[i].resistance);
  }

}

var RenderMode = 0; // 0 -> circuit, 1-> unstable spring/mass, 2-> stable spring/mass, 3-> fire, 4-> boids, 5 -> atom


var s = new Float32Array(numParticles*PartEleCount);

//f[0] = new Force(5, 0, 0); // boid forces



// for loop to build particle system

function initParticles(Circuit) {

  for (var i = 0; i< numParticles; i++) {
    var compStart = i%Circuit.length; // which circuit component this electron will initialize in 
    var offset = i*PartEleCount;
    s[offset+P_MASS] = 10;
    s[offset+P_SIZE] = 4;
    if (circOn) {
      var randDist = Math.random();
      s[offset+P_POSX] = Circuit[compStart].endp1[0] + randDist*(Circuit[compStart].endp2[0]-Circuit[compStart].endp1[0]) ; // +- [0.9 - 1.0]
      s[offset+P_POSY] = Circuit[compStart].endp1[1] + randDist*(Circuit[compStart].endp2[1]-Circuit[compStart].endp1[1]);
      s[offset+P_POSZ] = 0.1*Math.random() - 0.1*Math.random();
    }
    else {
      s[offset+P_POSX] = -0.3*Math.random() + 0.3*Math.random();
      s[offset+P_POSY] = -0.3*Math.random() + 0.3*Math.random();
      s[offset+P_POSZ] = Math.random() - Math.random();  
    }
    s[offset+P_VELX] = -0.002*Math.random() + 0.002*Math.random();
    s[offset+P_VELY] = -0.002*Math.random() + 0.002*Math.random();
    s[offset+P_VELZ] = 0;
    s[offset+P_FORX] = 0;
    s[offset+P_FORY] = 0;
    s[offset+P_FORZ] = 0;
    s[offset+P_CRED] = 0;
    s[offset+P_CBLU] = 0.5;
    s[offset+P_CGRN] = 0.5;
    s[offset+P_TPRT] = 1.0;
    s[offset+P_WALL] = compStart;
    
    //if (Circuit[compStart].compType == 'Battery'){
      //s[offset+P_TPRT] = 0.0;
    //}
  }
}


var FSIZE = s.BYTES_PER_ELEMENT;
var timeStep = 1.0/30.0;
var g_last = Date.now();

function main(Circuit) {
//==============================================================================
  // Retrieve <canvas> element
  //calcResistance(Circuit);
  canvas = document.getElementById('webgl');
  //moved all prior calcs here
  numWalls = numComps*2;
  f = new Array(numComps);
 console.log('res, numions numwalls', " ",resistanceTotal," " ,IonNumConst, " ",numWalls);
  constraints = new Array(Math.ceil(resistanceTotal*IonNumConst)+10*numComps+numWalls);
  console.log('constraints length:', constraints.length);
  current = Circuit[0].curr;
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;
  gl.viewportDepth = canvas.height;
  gl.enable(gl.DEPTH_TEST); // makes objects "in front" obscure ones behind


  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
  // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }
  /*isPartID = gl.getUniformLocation(gl.program, 'u_isPart');
  if (!isPartID) {
    console.log('failed to get isPart location');
  }
  gl.uniform1i(isPartID, isPart); //*/
  // set render mode to control what gets displayed
  var u_renderModeLoc = gl.getUniformLocation(gl.program, 'u_renderMode');
  if (u_renderModeLoc) { 
    console.log('Failed to get render mode variable location');
    return;
  }
  gl.uniform1i(u_renderModeLoc, RenderMode);

  initParticles(Circuit);

  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();

  // registers left and right keys to adjust camera
  document.onkeydown = function(ev){ keydown(ev, gl, u_ViewMatrix, viewMatrix); };


  projMatrix.setPerspective(30, 1/*canvas.width/canvas.height*/, 1, 100); // this never changes
  // set the GLSL u_ProjMatrix to the value I have set
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  var myVerts;
  // bind and set up array buffer for particles
  if (WallsOn == 1) {
    myVerts = initVertexBufferwWalls(gl, Circuit); 
  } else {
    myVerts = initVertexBuffersNew(gl, Circuit);
  }
  if (myVerts < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  if (RenderMode == 0) {
    gl.clearColor(0.7, 0.7, 0.7, 1.0);
  } else {
    gl.clearColor(0, 0, 0, 1);
  }

  // Start drawing
  var tick = function() {
    timeStep = animate(timeStep);  // Update the statespace
    draw(gl, myVerts, timeStep, u_ViewMatrix, viewMatrix);
    //console.log('xyz=', s[15*PartEleCount+P_POSX], s[15*PartEleCount+P_POSY], s[15*PartEleCount+P_POSZ]);
    requestAnimationFrame(tick, canvas);  // Request browser to ?call tick()?
  };
  tick();
}





function draw(gl, n, timeStep, u_ViewMatrix, viewMatrix) {
//==============================================================================  // Set the rotation matrix
 // apply constraints and impose drag
  
  if (RenderMode != 5) {
    applyConstraints();
  }
  //gl.clear(gl.COLOR_BUFFER_BIT);
  // update state space
  calcForces();
  applyForces(0, timeStep); // 0 for Euler

  var xpos =0, ypos =0, zpos = 0;
  xpos = g_EyeRadius * Math.cos(g_EyeZrot/2);
  ypos = g_EyeRadius * Math.cos(g_EyeXrot/2) + g_EyeRadius * Math.sin(g_EyeZrot/2);
  zpos = g_EyeRadius * Math.sin(g_EyeXrot/2);
  console.log(" g_EyeRadius: " + g_EyeRadius);
  console.log("ypos " + ypos);
  console.log("zpos " + zpos);

  viewMatrix.setLookAt(0, -3, -7.5,  // eye position
  //viewMatrix.setLookAt(xpos, ypos, zpos,  // eye position
                          0, 0, 0,                // look-at point (origin)
                          0, 0, 1);               // up vector (+z)
  //gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);


  Render(gl, n, u_ViewMatrix, viewMatrix);

}



function calcForces() {
  for (var i = 0; i < numParticles; i++) {
    var offset = i*PartEleCount;
    var fxtot, fytot, fztot;
    fxtot = fytot = fztot = 0; // position forces
    frcol = fgcol = fbcol = 0; // color 'forces'
    fmass = 0; // mass-changing force
    //console.log('there are ', f.length, 'forces here\n');
    // iterate through each force, adding relevant forces to s[i]
    for (var j = 0; j < f.length; j++) {
      
      // find out if point within force field
      var x = s[offset+P_POSX], y = s[offset+P_POSY];
      var y1 = f[j].strt[1];
      var x1 = f[j].strt[0];

      var y2 = f[j].end[1];
      var x2 = f[j].end[0];
      var tangent;
      if (y2 - y1 == 0){
          tangent = 0;
      }else if(x2 - x1 == 0){
          tangent = 1
      }else{
          tangent = (y2 - y1)/(x2 - x1);
      }
      

      //arcTangent in radians
      var arcTangent = Math.atan(tangent);
      //fytot = 1;
      //fxtot = 1;
      //x contibution

      if ((f[j].end[0] - f[j].strt[0] == 0) || Math.abs((f[j].end[1] -f[j].strt[1])/(f[j].end[0] - f[j].strt[0])) > 1){ // if a y-force field
        if ((x < f[j].strt[0] + f[j].wid/2 && x > f[j].end[0] - f[j].wid/2) && // within x range AND
            (y < f[j].strt[1] && y > f[j].end[1] || y > f[j].strt[1] && y < f[j].end[1])) { // within y range
          if (f[j].strt[1] > f[j].end[1]) { // if the right side, force goes down
            fytot *= current * f[j].voltage * Math.sin(arcTangent);
            fxtot *= current * f[j].voltage * Math.cos(arcTangent);
            //document.getElementById("force").value = current;
            //fytot -= current * f[j].voltage;
            //fxtot += current * f[j].voltage;
          } else { // otherwise, force goes up
            //fytot += current * f[j].voltage;
            //fxtot += current * f[j].voltage;
            fytot *= current * f[j].voltage * Math.sin(arcTangent);
            fxtot *= current * f[j].voltage * Math.cos(arcTangent);
          }
        }

      }else if( (f[j].end[1] - f[j].strt[1] == 0) || Math.abs((f[j].end[1] -f[j].strt[1])/(f[j].end[0] - f[j].strt[0])) < 1 ){ //if an x-force field
        if ((x < f[j].strt[0] && x > f[j].end[0] || x > f[j].strt[0] && x < f[j].end[0]) && // within x range AND
            (y < f[j].strt[1] + f[j].wid/2 && y > f[j].end[1] - f[j].wid/2)) { // within y range
          if (f[j].strt[0] < f[j].end[0]) { // if on top, force goes right
            //fytot -= current * f[j].voltage;
            //fxtot += current * f[j].voltage;
            fytot *= current * f[j].voltage * Math.sin(arcTangent);
            fxtot *= current * f[j].voltage * Math.cos(arcTangent);
          } else { // else, force goes left
            //fytot -= current * f[j].voltage;
            //fxtot -= current * f[j].voltage;
            fytot *= current * f[j].voltage * Math.sin(arcTangent);
            fxtot *= current * f[j].voltage * Math.cos(arcTangent);
          }
        }

      }

/*      if (f[j].end[0] - f[j].strt[0] < Math.abs(0.01)) { // if a y-force field
        if ((x < f[j].strt[0] + f[j].wid/2 && x > f[j].end[0] - f[j].wid/2) && // within x range AND
            (y < f[j].strt[1] && y > f[j].end[1] || y > f[j].strt[1] && y < f[j].end[1])) { // within y range
          if (f[j].strt[1] > f[j].end[1]) { // if the right side, force goes down
            fytot -= current * f[j].voltage;
          } else { // otherwise, force goes up
            fytot += current * f[j].voltage;
          }
        }
      } else if ( f[j].end[1] -f[j].strt[1] < Math.abs(0.01)) { // if an x-force field
        if ((x < f[j].strt[0] && x > f[j].end[0] || x > f[j].strt[0] && x < f[j].end[0]) && // within x range AND
            (y < f[j].strt[1] + f[j].wid/2 && y > f[j].end[1] - f[j].wid/2)) { // within y range
          if (f[j].strt[0] < f[j].end[0]) { // if on top, force goes right
            fxtot += current * f[j].voltage;
          } else { // else, force goes left
            fxtot -= current * f[j].voltage;
          }
        }
      }*/
    }
    // set the state var force values to the calculated totals
    s[offset+P_FORX] = fxtot;
    s[offset+P_FORY] = fytot;
    s[offset+P_FORZ] = fztot;
  }
}

function applyForces(solvertype, timeStep) {
  switch(solvertype) {
    case 0:
      // basic Euler solver
      for (var i = 0; i < numParticles; i++) {
        var offset = i*PartEleCount;
        // apply velocities
        //console.log('previous positions: ', s[offset+P_POSX], s[offset+P_POSY], s[offset+P_POSZ]);
        /*s[offset+P_POSX] += s[offset+P_VELX]*timeStep;
        s[offset+P_POSY] += s[offset+P_VELY]*timeStep;
        s[offset+P_POSZ] += s[offset+P_VELZ]*timeStep;*/


        // apply changes in velocities due to forces - careful of div by 0!
        /*s[offset+P_VELX] += (s[offset+P_FORX] * timeStep) / s[offset+P_MASS];
        s[offset+P_VELY] += (s[offset+P_FORY] * timeStep) / s[offset+P_MASS];
        s[offset+P_VELZ] += (s[offset+P_FORZ] * timeStep) / s[offset+P_MASS];*/
        
        // apply changes in velocities due to drag
        /*if (dragOn) {
          s[offset+P_VELX] *= DRAG_CONST;
          s[offset+P_VELY] *= DRAG_CONST;
          s[offset+P_VELZ] *= DRAG_CONST;
        }*/
        s[offset+P_POSX] += s[offset+P_VELX];
        s[offset+P_POSY] += s[offset+P_VELY];
        s[offset+P_POSZ] += s[offset+P_VELZ];

      }
      break;
      default:
        console.log('error in solver! invalid solvertype');
  }
}


function Render(mygl, n, myu_ViewMatrix, myViewMatrix) {


  //myViewMatrix.rotate(-90.0, 1,0,0);  // new one has "+z points upwards",
                                      // made by rotating -90 deg on +x-axis.
                                      // Move those new drawing axes to the 
                                      // bottom of the trees:
  mygl.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  
  mygl.bufferSubData(mygl.ARRAY_BUFFER, 0, s);
  
  mygl.drawArrays(mygl.POINTS, 0, n); // draws electrons
  

  /*mygl.drawArrays(mygl.POINTS,             // use this drawing primitive, and
                  s.length/PartEleCount, // start at this vertex number, and
                  (circVerts.length)/PartEleCount);   // draw this many vertices*/
  
}

function animate() {
//==============================================================================  // Calculate the elapsed time
  var now = Date.now();                       
  var elapsed = now - g_last;               
  g_last = now;
  // Return the amount of time passed.
  return elapsed / 1000.0;
}

// circuitOn set to 1 imposes circuit-constraints
function applyConstraints() {
   for (var i = 0; i < numParticles; i++) { // loop through all particles
    var offset = i*PartEleCount;
    // particle motion
    // calc z - constraint
      // collisions with ions      
    for (var j = 0; j < constraints.length; j++) { // for each particle, loop through all constraints
      if (constraints[j].Ctype == 0) {
        // check if the spheres for the particle and ion intersect
        // true if intersects in the x-direction AND intersects in the y-direction AND intersects in the z-direction
          // for each axis-direction, the particle can overlap in one of two ways
        var pRad = (s[offset+P_SIZE])/canvas.width; // radius for each particle
        var iRad = (constraints[j].Csize/2)/canvas.width; // radius for each ion
        if ((s[offset+P_POSX] - pRad < constraints[j].xpos + iRad && // X-intersection (check both sides)
             s[offset+P_POSX] - pRad > constraints[j].xpos - iRad || 
             s[offset+P_POSX] + pRad < constraints[j].xpos + iRad &&
             s[offset+P_POSX] + pRad > constraints[j].xpos - iRad) && 
            (s[offset+P_POSY] - pRad < constraints[j].ypos + iRad && // Y-intersection (check both sides)
             s[offset+P_POSY] - pRad > constraints[j].ypos - iRad || 
             s[offset+P_POSY] + pRad < constraints[j].ypos + iRad &&
             s[offset+P_POSY] + pRad > constraints[j].ypos - iRad) &&
            (s[offset+P_POSZ] - pRad < constraints[j].zpos + iRad && // Z-intersection (check both sides)
             s[offset+P_POSZ] - pRad > constraints[j].zpos - iRad || 
             s[offset+P_POSZ] + pRad < constraints[j].zpos + iRad &&
             s[offset+P_POSZ] + pRad > constraints[j].zpos - iRad))
          {
          // if there is an intersection, flip all velocities.
          // 
          //var Ioffset = (Coffset / Cfields) * PartEleCount;
          //circVerts[j*PartEleCount + P_CBLU] += 0.1;
          //s[offset+P_CGRN] = 1.0;
          s[offset+P_VELX] = -s[offset+P_VELX]; //+ 0.1*Math.random() - 0.1*Math.random();
          s[offset+P_VELY] = -s[offset+P_VELY]; //+ 0.1*Math.random() - 0.1*Math.random();
          s[offset+P_VELZ] = -s[offset+P_VELZ];
        }
      }
      else if (constraints[j].Ctype == 1) { // if it's a wall constraint
        var wBuffer = 0.01; // distance from a wall before a collision is detected
        var isCollision;
      
            isCollision = DetectCollision(constraints[j], offset, wBuffer);
        

        document.getElementById("force").value = isCollision;
        if (isCollision == 1) {
          // collision with x-constant wall
          if (s[offset+P_VELX] > 0) {
            /*s[offset+P_POSX] = constraints[j].strt[0] - wBuffer; // put particle on right side of wall
          } else {
            s[offset+P_POSX] = constraints[j].strt[0] + wBuffer;*/
          }
          //s[offset+P_VELX] = -s[offset+P_VELX] + 0.2*Math.random() - 0.2*Math.random();
        } else if (isCollision == 2) {
          if (s[offset+P_VELY] > 0) {
          /*  s[offset+P_POSY] = constraints[j].strt[1] - wBuffer; // put particle on right side of wall
          } else {
            s[offset+P_POSY] = constraints[j].strt[1] + wBuffer;*/
          }else if (isCollision == 3) { }
          //s[offset+P_VELY] = -s[offset+P_VELY] + 0.2*Math.random() - 0.2*Math.random();
        } 
      }
    }
  }
}





// returns 1 for collisions with constant-x walls, 2 for constant-y walls, and 0 otherwise
function DetectCollision(wall, sOffset, buffer){ // wall constraint, offset in state array for particle, buffer = distance from wall before collision occurs
  var colWindow = buffer;

//they are all 0.2 but I named them for readability
  var bufferAbove = 0.2;
  var bufferBeneath = 0.2;
  var bufferRight = 0.2;
  var bufferLeft = 0.2;
  
  if (s[sOffset+P_WALL] != wall.Csize ) return; //every particle is initialized in a wall 
                                                //check which wall it is and define the constraints
  if (Math.abs(wall.strt[0] - wall.end[0]) < Math.abs(wall.strt[1] - wall.end[1])) { // it's a constant-x wall
          if( s[sOffset+P_POSX] >= (wall.strt[0] + bufferRight) && s[sOffset+P_VELX] > 0.0 || //0.2 for a little space above the line 
              s[sOffset+P_POSX] <= (wall.strt[0] - bufferLeft)  && s[sOffset+P_VELX] < 0.0){ //and some space below the line to make a wall
              s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];            
          }
          if (s[sOffset+P_POSY] <= (wall.strt[1] + bufferAbove) && s[sOffset+P_VELY] < 0.0 ||
              s[sOffset+P_POSY] >= (wall.end[1] - bufferBeneath) && s[sOffset+P_VELY] > 0.0){ // collision! 
              s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY];
          } 
      return 1; 

  }else if (Math.abs(wall.strt[0] - wall.end[0]) > Math.abs(wall.strt[1] - wall.end[1])) {

          if( s[sOffset+P_POSY] >= (wall.strt[1] + bufferAbove) && s[sOffset+P_VELY] > 0.0 ||
              s[sOffset+P_POSY] <= (wall.strt[1] - bufferBeneath)  && s[sOffset+P_VELY] < 0.0){
              s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY];            
          }
          if (s[sOffset+P_POSX] <= (wall.strt[0] - bufferLeft) && s[sOffset+P_VELX] < 0.0 ||
              s[sOffset+P_POSX] >= (wall.end[0] + bufferRight)&& s[sOffset+P_VELX] > 0.0){ // collision! 
              s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];
          } 

      return 2;
  }
  else {
    return 0;
  }
  /*}*/



}


function keydown(ev, gl, u_ViewMatrix, viewMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

    if(ev.keyCode == 39) { // The right arrow key was pressed
        g_EyeZrot += 0.1;    // INCREASED for perspective camera)
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
        g_EyeZrot -= 0.1;    // INCREASED for perspective camera)
    } else
    if(ev.keyCode == 38) { // The up arrow key was pressed
        g_EyeXrot += 0.1;    // INCREASED for perspective camera)
    } else
    if(ev.keyCode == 40) { // The down arrow key was pressed
        g_EyeXrot -= 0.1;    // INCREASED for perspective camera)
    } else
    if(ev.keyCode == 33) { // The "page up" key was pressed
        g_EyeRadius += 0.1;    // INCREASED for perspective camera)
    } else
    if(ev.keyCode == 34) { // The "page down" key was pressed
        g_EyeRadius -= 0.1;    // INCREASED for perspective camera)
    } else  { return; } // Prevent the unnecessary drawing
}


function makeCircuit(Circuit) {
  //==============================================================================
  // go through each circuit component. for each one:
  //      create the constraint walls on each side
  //      create the visible walls on each side
  //      create the force field
  //      create the ions based on the segment's resistance

  var totIons = 0;
  for (var n = 0; n < Circuit.length; n++) {
    totIons += Math.ceil(Circuit[n].resistance*IonNumConst)+10*numComps;
  }
  circVerts = new Float32Array(totIons*PartEleCount); // initialize the array to hold the ion info
  // may need to define constraints array here
  var IonsDone = 0; // used to track array indices, since each component doesn't have the same number of ions
  for (var n = 0; n < Circuit.length; n++) {
    // add relevant vertex information to render ions
    var startx = Circuit[n].endp1[0], starty = Circuit[n].endp1[1];
    var endx = Circuit[n].endp2[0], endy = Circuit[n].endp2[1];
    var IonsInComp = 10+Math.ceil(Circuit[n].resistance*IonNumConst); // number of ions for this component
    var xspacing = (endx - startx)/IonsInComp;
    var yspacing = (endy - starty)/IonsInComp;
    for (var i = 0; i < IonsInComp; i++) {
      var offset = i*PartEleCount+IonsDone;
      circVerts[offset+P_MASS] = 10000000;
      circVerts[offset+P_SIZE] = ionSize;
      circVerts[offset+P_POSX] = startx + i*xspacing - 0.1 + 0.1*((i+1)%3);
      circVerts[offset+P_POSY] = starty + i*yspacing - 0.1 + 0.1*((i+2)%3);
      circVerts[offset+P_POSZ] = -0.1 + 0.1*(i%3);  
      circVerts[offset+P_VELX] = 0;
      circVerts[offset+P_VELY] = 0;
      circVerts[offset+P_VELZ] = 0;
      circVerts[offset+P_FORX] = 0;
      circVerts[offset+P_FORY] = 0;
      circVerts[offset+P_FORZ] = 0;
        circVerts[offset+P_CRED] = 1.0;
        circVerts[offset+P_CGRN] = 0.0;
        circVerts[offset+P_CBLU] = 0.0;
        console.log("CirVerts color " + circVerts[offset+P_CRED])

      if (Circuit[n].compType == "Battery") {
        circVerts[offset+P_CRED] = 0.5;
      //} else {
        //circVerts[offset+P_CRED] = 1.0;
      }
      //circVerts[offset+P_CBLU] = 0.0;
      if (Circuit[n].compType == "Bulb") {
        circVerts[offset+P_CGRN] = 1.0;
      //} else {
        //circVerts[offset+P_CGRN] = 0;
      }
      if (Circuit[n].compType == "Resistor") {
        circVerts[offset+P_CRED] = 0.0;        
        circVerts[offset+P_CBLU] = 1.0;
      //} else {
        //circVerts[offset+P_CBLU] = 0;
      }

      circVerts[offset+P_TPRT] = 1.0;
      // then add the ion as a constraint
      var index = i + Math.floor(IonsDone / PartEleCount);
      constraints[index] = new Constraint(0, ionSize, 
                                          circVerts[offset+P_POSX],
                                          circVerts[offset+P_POSY],
                                          circVerts[offset+P_POSZ],
                                          0, // height doesn't matter for point constraints
                                          0, // neither do endpoints
                                          0); 
    }
    IonsDone += IonsInComp * PartEleCount;
  }
      
  // add wall constraints to constraints array
  var wallstart = constraints.length-numWalls;
  // left outer wall
  for (n = 0; n < Circuit.length; n++) {

    switch(Circuit[n].innerwall){
      case 0:
        // left wall
        var neg;
        if (Circuit[n].endp1[1]>Circuit[n].endp2[1]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
        // figure out which endpoint is which
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, // wall type 
                                                    n, // size not relevant for walls // I'll save identification for the walls in this size container
                                                    -1.0, // x coord (of wall center. Not used, but still included)
                                                    0.0, // y
                                                    0.0, // z
                                                    0.4, // height
                                                    [Circuit[n].endp1[0]-circWidth/2,
                                                     Circuit[n].endp1[1]+neg*circWidth/2,
                                                     0.0], // start point
                                                    [Circuit[n].endp2[0]-circWidth/2,
                                                     Circuit[n].endp2[1]-neg*circWidth/2,
                                                     0.0]); // end point
          // inner wall next'
        constraints[wallstart+2*n+1] = new Constraint(1, n, // identification
                                                       0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]+circWidth/2,
                                                       Circuit[n].endp1[1]-neg*circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+circWidth/2,
                                                       Circuit[n].endp2[1]+neg*circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0], Circuit[n].endp1[1] - circWidth/2],
                         [Circuit[n].endp2[0], Circuit[n].endp2[1] - circWidth/2], circWidth, Circuit[n].voltage);
          console.log("What happens here " + wallstart+2*n);

        break;
      case 1:
        // right wall
        var neg;
        if (Circuit[n].endp1[1]>Circuit[n].endp2[1]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, 0,
                                                    n, // identification
                                                     -1.0, 0.0, 0.0, 0.4,
                                                    [Circuit[n].endp1[0]+circWidth/2,
                                                     Circuit[n].endp1[1]+neg*circWidth/2, 0.0], // start point
                                                    [Circuit[n].endp2[0]+circWidth/2,
                                                     Circuit[n].endp2[1]-neg*circWidth/2, 0.0]); // end point
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1, 
                                                      n, // identification
                                                      0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]-circWidth/2,
                                                       Circuit[n].endp1[1]-neg*circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]-circWidth/2,
                                                       Circuit[n].endp2[1]+neg*circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0], Circuit[n].endp1[1] + circWidth/2],
                         [Circuit[n].endp2[0], Circuit[n].endp2[1] + circWidth/2], circWidth, Circuit[n].voltage);
          console.log("What happens here " + constraints[wallstart+2*n]);

        break;
      case 2:
        // bottom wall
        var neg;
        if (Circuit[n].endp1[0]>Circuit[n].endp2[0]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, n, // identification
                                                     -1.0, 0.0, 0.0, 0.4,
                                                    [Circuit[n].endp1[0]+neg*circWidth/2,
                                                     Circuit[n].endp1[1]-circWidth/2, 0.0], // start point
                                                    [Circuit[n].endp2[0]-neg*circWidth/2,
                                                     Circuit[n].endp2[1]-circWidth/2, 0.0]); // end point
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1,
                                                      n, // identification
                                                      0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]-neg*circWidth/2,
                                                       Circuit[n].endp1[1]+circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+neg*circWidth/2,
                                                       Circuit[n].endp2[1]+circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0] + circWidth/2, Circuit[n].endp1[1]],
                         [Circuit[n].endp2[0] + circWidth/2, Circuit[n].endp2[1]], circWidth, Circuit[n].voltage);

          console.log("What happens here " + constraints[wallstart+2*n]);

        break;
      case 3:
        // top wall
        var neg;
        if (Circuit[n].endp1[0]>Circuit[n].endp2[0]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, n, // identification
                                                    -1.0, 0.0, 0.0, 0.4,
                                                    [Circuit[n].endp1[0]+neg*circWidth/2,
                                                     Circuit[n].endp1[1]+circWidth/2, 0.0], // start point
                                                    [Circuit[n].endp2[0]-neg*circWidth/2,
                                                     Circuit[n].endp2[1]+circWidth/2, 0.0]); // end point
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1,n, // identification
                                                       0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]-neg*circWidth/2,
                                                       Circuit[n].endp1[1]-circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+neg*circWidth/2,
                                                       Circuit[n].endp2[1]-circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0] - circWidth/2, Circuit[n].endp1[1]],
                         [Circuit[n].endp2[0] - circWidth/2, Circuit[n].endp2[1]], circWidth, Circuit[n].voltage);

          console.log("What happens here " + constraints[wallstart+2*n]);

        break;

        case 4:
        // midwall
        var neg;
        if (Circuit[n].endp1[1]>Circuit[n].endp2[1]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
        // figure out which endpoint is which
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, n, // identification
                                                       0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]+circWidth/2,
                                                       Circuit[n].endp1[1]-neg*circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+circWidth/2,
                                                       Circuit[n].endp2[1]+neg*circWidth/2, 0.0]); // end point
          // inner wall next'
        constraints[wallstart+2*n+1] = new Constraint(1, n, // identification
                                                      0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]+circWidth/2,
                                                       Circuit[n].endp1[1]-neg*circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+circWidth/2,
                                                       Circuit[n].endp2[1]+neg*circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0] , Circuit[n].endp1[1]],
                         [Circuit[n].endp2[0], Circuit[n].endp2[1] ], circWidth, Circuit[n].voltage); 
        break;
      default:
        console.log('something went wrong.');
    }
  }
  
}

function makeCircuitWalls(Circuit) {
  // create four points on the outside, color them green
  circWalls = new Float32Array(12*numComps*PartEleCount); // 4 triangles (3 verts each) per circuit component
  for (i = 0; i < Circuit.length; i++) {
    for (j = 0; j < 12; j++) {
      var offset = j*PartEleCount + i*PartEleCount*12;
      circWalls[offset+P_MASS] = 100000;
      circWalls[offset+P_SIZE] = 1;
      // positions will be added manually  
      circWalls[offset+P_VELX] = 0;
      circWalls[offset+P_VELY] = 0;
      circWalls[offset+P_VELZ] = 0;
      circWalls[offset+P_FORX] = 0;
      circWalls[offset+P_FORY] = 0;
      circWalls[offset+P_FORZ] = 0;
      circWalls[offset+P_CRED] = 0.1;
      circWalls[offset+P_CBLU] = 0.1;
      circWalls[offset+P_CGRN] = 0.1;
      circWalls[offset+P_TPRT] = 1.0;
    }
  }
  var manOffset = 0;
  var wallBuffer = 0.03; // if walls are at the exact corners, some electrons bleed through


}



function initVertexBuffersNew(gl, Circuit) {
//==============================================================================

  if (RenderMode == 0) {
    makeCircuit(Circuit);
    mySiz = s.length + circVerts.length;
  } else {
    makeGroundGrid();
    mySiz = s.length + gndVerts.length;  
  }

  // How much space to store all the shapes in one array?
  // (no 'var' means this is a global variable)

  // How many vertices total?
  var nn = mySiz / PartEleCount;

  // Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  particleStart = 0;              // we store the particles.
  for(i=0; i< s.length; i++) {
    verticesColors[i] = s[i];
  }
  if (RenderMode == 0) {
    circStart = i;
    for(j=0; j< circVerts.length; i++, j++) {
      verticesColors[i] = circVerts[j];
    }
  } else {
    gndStart = i;
    for(j=0; j< gndVerts.length; i++, j++) {
      verticesColors[i] = gndVerts[j];
    }
  } 
  
    // Create a buffer object
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.DYNAMIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_PositionID, 3, gl.FLOAT, false, FSIZE*PartEleCount, P_POSX*FSIZE);
                          // shader location, vars to read, type of vars, normalized, stride, offset
  gl.enableVertexAttribArray(a_PositionID);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * PartEleCount, P_CRED*FSIZE);
  gl.enableVertexAttribArray(a_Color);

  // point diameters
  a_diamID = gl.getAttribLocation(gl.program, 'a_diam');
  if(a_diamID < 0) {
    console.log('Failed to get the storage location of scalar a_diam');
    return -1;
  }
  gl.vertexAttribPointer(
    a_diamID,     //index == attribute var. name used in the shader pgm.
    1,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  to normalize before use? true or false
    PartEleCount*FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    P_SIZE*FSIZE); // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_diamID);



  return mySiz/PartEleCount; // return # of vertices
}


function initVertexBufferwWalls(gl,Circuit) {
//==============================================================================

  makeCircuit(Circuit);
  makeCircuitWalls(Circuit);
  mySiz = s.length + circVerts.length + circWalls.length;


  // How much space to store all the shapes in one array?
  // (no 'var' means this is a global variable)

  // How many vertices total?
  var nn = mySiz / PartEleCount;

  // Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  particleStart = 0;              // we store the particles.
  for(i=0; i< s.length; i++) {
    verticesColors[i] = s[i];
  }
  // copy over ion vertices
  circStart = i;
  for(j=0; j< circVerts.length; i++, j++) {
    verticesColors[i] = circVerts[j];
  }

  // copy over wall vertices
  for (k = 0; k<circWalls.length; i++, k++) {
    verticesColors[i] = circWalls[k];
  }
  
    // Create a buffer object
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.DYNAMIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_PositionID, 3, gl.FLOAT, false, FSIZE*PartEleCount, P_POSX*FSIZE);
                          // shader location, vars to read, type of vars, normalized, stride, offset
  gl.enableVertexAttribArray(a_PositionID);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * PartEleCount, P_CRED*FSIZE);
  gl.enableVertexAttribArray(a_Color);

  // point diameters
  a_diamID = gl.getAttribLocation(gl.program, 'a_diam');
  if(a_diamID < 0) {
    console.log('Failed to get the storage location of scalar a_diam');
    return -1;
  }
  gl.vertexAttribPointer(
    a_diamID,     //index == attribute var. name used in the shader pgm.
    1,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  to normalize before use? true or false
    PartEleCount*FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    P_SIZE*FSIZE); // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_diamID);



  return mySiz/PartEleCount; // return # of vertices
}
