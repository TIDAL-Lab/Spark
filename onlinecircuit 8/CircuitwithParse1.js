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
  'attribute vec3 a_norm; \n' +
  
  'varying vec4 v_Color; \n' +
  'varying float v_alpha; \n' +
  'varying vec3 v_norm; \n' +
  'varying float isPoint; \n' +
  'uniform bool u_isPart; \n' +
  'uniform int renderMode; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  'uniform mat4 u_ProjMatrix; \n' +
  'uniform mat4 u_modelMatrix; \n' +
  'uniform float u_alpha; \n' + 
  'uniform vec3 u_lighting; \n' +
  'void main() {\n' +
  ' if (u_isPart) { \n' +
  '  gl_PointSize = a_diam;\n' +
  '}\n ' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_modelMatrix *a_Position;  \n' + 
  '  v_Color = a_Color; \n' +
  ' v_alpha = u_alpha;\n'+
  ' v_norm = a_norm; \n' +
  ' vec3 U_light = u_lighting; \n' +
  '  if (u_isPart) {isPoint = 1.0;} else {isPoint = 0.0; } \n' +
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
  'varying float v_alpha; \n' +
  'varying vec4 v_Color; \n' +
  'varying float isPoint; \n' +
  'void main() {\n' +
  '    if (isPoint == 1.0) { \n' +
  '       float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '       if(dist < 0.5) { \n' + 
  '           gl_FragColor = vec4((1.0 - 1.5*dist)*v_Color.rgb, v_Color.a * v_alpha);\n' +
  '       } else { discard; }\n' +
  '    } else { \n' +
  '       gl_FragColor = vec4(v_Color.rgb, v_Color.a * v_alpha ); } \n' +
  '} \n';






function Force (forcetype, start, end, width, voltage, id) {
  /** direction determines the direction the force acts**/
  //1- upward or to the right
  //2- downward or to the left
  // 0 = gravity, 
  this.forceType = forcetype;

  this.centForce = -5.0;
  this.electro = 5.0;
  this.strt = start;
  this.end = end;
  this.wid = width;
  this.voltage = voltage;

  this.identification = id;
} 

function Constraint (type, size, xloc, yloc, zloc, height, endptArray1, endptArray2, voltage) {
  this.Ctype = type; // 0=wire, 1=battery, 2=resistor, 3=lighbulb
  this.Csize = size;
  this.xpos = xloc;
  this.ypos = yloc;
  this.zpos = zloc;
  this.hig = height;
  this.strt = endptArray1;
  this.end = endptArray2; 
  this.voltage = voltage;
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
  this.connected = [];
  this.identification = -1;
  //open the left, right top or bottom, initialize to closed 
  //represent closed as 0 and open as 1
  this.openStart = [0,0,0,0];
  this.openEnd = [0,0,0,0];

  //ID ranges from 0 to n where n is the number of components
  //Position ranges from 0 to 1 could be the start or end of the component
  //Side is either "L","R","B" or "T" 
  // L - for left, R - for right, B - for bottom, and T for Top representing the open sides
  //of the end of the components
  //this.IDS, I - for ID, P for position and S for side
  this.IPS = [];
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
const P_AGE = 16;
const P_NOMX = 17;
const P_NOMY = 18;
const P_NOMZ = 19;

const IPS_SIZE = 3;
const IPS_IDEN = 0;
const IPS_POSN = 1;
const IPS_SIDE = 2;

function reset(Circuit1){
    currentConst = 10; // multiplied with calculated current to create "realistic" looking flows
    IonNumConst = 3; // multiplied with calculated number of ions in circuit component so wires aren't empty
    PartEleCount = 20; // number of fields per particle in the state array
    numIons = 200; // total number of ions in circuit
    numWalls = 0;// = numComps*2;
    circWidth = 0.2 // globally defined circuit width
    f = [ ];// = new Array(numComps); // array used to hold forces
    numParticles = 20 * Circuit1.length;//200; // number of electrons
    ionSize = 15; // size of each ion
    isPart = true; // T/F value used to tell the shader if rendering particles or other shapes (lines, triangles)
    circOn = 1, dragOn = 1;
    Solver = 0; // 0 for Euler
    WallsOn = 1;  
    FSIZE = s.BYTES_PER_ELEMENT;
    timeStep = 1.0/30.0;
    g_last = Date.now();
    RenderMode = 0; // 0 -> circuit, 1-> unstable spring/mass, 2-> stable spring/mass, 3-> fire, 4-> boids, 5 -> atom
    numComps = Circuit1.length;

    s = new Float32Array(numParticles*PartEleCount);

    resistanceTotal = 0;
    constraints = [ ];
    current = 0;
    circWalls = new Float32Array(12*numComps*PartEleCount);
    Circuit = Circuit1;

var g_eyeX = 0;
var g_eyeY = 1;
var g_eyeZ = 1;

var g_lookAtX = 0;
var g_lookAtY = 0;
var g_lookAtZ = 0;

}

var currentConst = 10; // multiplied with calculated current to create "realistic" looking flows
var IonNumConst = 3; // multiplied with calculated number of ions in circuit component so wires aren't empty
var PartEleCount = 20; // number of fields per particle in the state array
var numIons = 200; // total number of ions in circuit
var numWalls;// = numComps*2;
var circWidth = 0.2 // globally defined circuit width
var f;// = new Array(numComps); // array used to hold forces
var numParticles = 200;//50;//200; // number of electrons
var ionSize = 15; // size of each ion
var isPart = true; // T/F value used to tell the shader if rendering particles or other shapes (lines, triangles)
var circOn = 1, dragOn = 1;
var Solver = 0; // 0 for Euler
var WallsOn = 1;



var resistanceTotal = 0;
var constraints;
var current;


var g_lookAtX = 0;
var g_lookAtY = 0;
var g_lookAtZ = 0;
var Circuit;
  
var modelMatrix = new Matrix4();
var modelMatrix1 = new Matrix4();


// calculate the current in the circuit
/*function calcResistance(){
  for (i = 0; i < Circuit.length; i++) {
    console.log('res total:', resistanceTotal);
    resistanceTotal += parseFloat(Circuit[i].resistance);
  }

}*/
dspacing = 2;
function calcResistance(){
  var resistanceTotal = 0;
  for (var n = 0; n < Circuit.length; n++) {
    //totIons += Math.ceil(Circuit[n].resistance*IonNumConst)+5*numComps;

    var startx = Circuit[n].endp1[0], starty = Circuit[n].endp1[1];
    var endx = Circuit[n].endp2[0], endy = Circuit[n].endp2[1];
    //var IonsInComp = 5+Math.ceil(Circuit[n].resistance*IonNumConst); // number of ions for this component
//resistanceTotal*IonNumConst)+10*numComps+numWalls
    var dx = (endx - startx); 
    var dy = (endy - starty);
    //var dspacing = 0.1;
    if (Circuit[n].compType == "Wire") { //constant number of ions for wire
      if ((dx)> (dy)){
        resistanceTotal +=(dx/dspacing);
      }else{
        resistanceTotal += (dy/dspacing);

      }
    }else{
        resistanceTotal += Circuit[n].resistance;      
    }

  }
  
}

var RenderMode = 0; // 0 -> circuit, 1-> unstable spring/mass, 2-> stable spring/mass, 3-> fire, 4-> boids, 5 -> atom


var s = new Float32Array(numParticles*PartEleCount);



// for loop to build particle system

function initParticles() {

  for (var i = 0; i< numParticles; i++) {
    var compStart = i%Circuit.length; // which circuit component this electron will initialize in 
    var offset = i*PartEleCount;
    s[offset+P_MASS] = 10;
    s[offset+P_SIZE] = 4;
  //  if (circOn) {
      var randDist = Math.random();
      s[offset+P_POSX] = Circuit[compStart].endp1[0] + randDist*(Circuit[compStart].endp2[0]-Circuit[compStart].endp1[0]) ; // +- [0.9 - 1.0]
      s[offset+P_POSY] = Circuit[compStart].endp1[1] + randDist*(Circuit[compStart].endp2[1]-Circuit[compStart].endp1[1]);
      s[offset+P_POSZ] = 0.1*Math.random() - 0.1*Math.random();
//    }
/*    else {
      s[offset+P_POSX] = -0.3*Math.random() + 0.3*Math.random();
      s[offset+P_POSY] = -0.3*Math.random() + 0.3*Math.random();
      s[offset+P_POSZ] = Math.random() - Math.random();  
    }*/
    if (circOn){
      s[offset+P_VELX] = 0.002*Math.random();
      s[offset+P_VELY] = 0.002*Math.random();
      s[offset+P_VELZ] = 0.002*Math.random();

    }else{
      s[offset+P_VELX] = -0.002*Math.random() + 0.002*Math.random();
      s[offset+P_VELY] = -0.002*Math.random() + 0.002*Math.random();
      s[offset+P_VELZ] = -0.002*Math.random() + 0.002*Math.random();      
    }
    s[offset+P_FORX] = 0;
    s[offset+P_FORY] = 0;
    s[offset+P_FORZ] = 0;
    s[offset+P_CRED] = 0;
    s[offset+P_CBLU] = 0.5;
    s[offset+P_CGRN] = 0.5;
    s[offset+P_TPRT] = 1.0;
    s[offset+P_WALL] = compStart;
    s[offset+P_AGE] = 1;
    s[offset+P_NOMX] = 0;
    s[offset+P_NOMY] = 0;
    s[offset+P_NOMZ] = 1;
    

  }
}


var FSIZE = s.BYTES_PER_ELEMENT;
var timeStep = 1.0/30.0;
var g_last = Date.now();

function main() {
//==============================================================================
  // Retrieve <canvas> element
  //calcResistance(Circuit);
  canvas = document.getElementById('webgl');
  //moved all prior calcs here
  numWalls = numComps;
  f = new Array(numComps);
 console.log('res, numions numwalls', " ",resistanceTotal," " ,IonNumConst, " ",numWalls);
  constraints = new Array(Math.ceil(resistanceTotal*IonNumConst)+5*numComps+numWalls);
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
  gl.enable(gl.DEPTH_TEST ); // makes objects "in front" obscure ones behind
  //gl.enable(gl.BLEND); // makes objects "in front" obscure ones behind
  //gl.disable(gl.DEPTH_TEST || gl.BLEND); // makes objects "in front" obscure ones behind
  //gl.enable(gl.BLEND); // makes objects "in front" obscure ones behind


  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
  // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix'); 
  u_alpha = gl.getUniformLocation(gl.program,'u_alpha');
  u_lighting = gl.getUniformLocation(gl.program,'u_lighting');

  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }
if (!u_modelMatrix) { 
    console.log('Failed to get u_modelMatrix');
    return;
  }
if (!u_alpha) { 
    console.log('Failed to get u_alpha');
    return;
  }

if (!u_lighting) { 
    console.log('Failed to get u_lighting');
    return;
  }
  isPartID = gl.getUniformLocation(gl.program,'u_isPart');
  if(!isPartID){
      console.log("Failed to get isPartID");
  }
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


  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100); // this never changes
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
    gl.clearColor(0.96, 0.79, 0.69, 1.0);
  } else {
    //gl.clearColor(0, 0, 0, 1);
  }

  // Start drawing
  var tick = function() {
    timeStep = animate(timeStep);  // Update the statespace
    draw(gl, myVerts, timeStep, u_ViewMatrix, viewMatrix, Circuit);
    requestAnimationFrame(tick, canvas);  // Request browser to ?call tick()?
  };
  tick();
}


var g_eyeX = 0;
var g_eyeY = -4.0;
var g_eyeZ = -2.9;

var g_lookAtX = 0;
var g_lookAtY = 0;
var g_lookAtZ = 0;



function draw(gl, n, timeStep, u_ViewMatrix, viewMatrix) {
//==============================================================================  // Set the rotation matrix
 // apply constraints and impose drag
    connected(Circuit);
  

   //document.getElementById('force').value =  g_eyeX + " " + g_eyeY + " " + g_eyeZ;
  
  //gl.clear(gl.COLOR_BUFFER_BIT);
  // update state space
  calcForces();
  applyForces(0, timeStep); // 0 for Euler
    applyConstraints(Circuit);
  

  viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ,  // eye position
  //viewMatrix.setLookAt(xpos, ypos, zpos,  // eye position
                          g_lookAtX, g_lookAtY, g_lookAtZ,                // look-at point (origin)
                          0, 0, 1);               // up vector (+z)

  Render(gl, n, u_ViewMatrix, viewMatrix);

}



function calcForces() {



     fxtot =fytot =fztot = 1; // position forces
    fmass = 0; // mass-changing force
    PI = 3.14159
 
   for (var i = 0; i < numParticles; i++) {
    var offset = i*PartEleCount;

      for (var j = 0; j< f.length; j++){
        if(s[offset+P_WALL] == f[j].identification){ //if the electron belongs to a particular forcefield
          if (f[j].voltage != 0){ //is the circuit on or off
            if (Math.abs(f[j].strt[0] - f[j].end[0]) < Math.abs(f[j].strt[1] - f[j].end[1])) {
              fxtot = Math.cos(PI/6);
              fytot = 2;
              fztot =1;
            }else{
              fxtot =2;
              fytot = Math.sin(PI/3);
              fztot =1;

            }

          }else{
             fxtot =fytot =fztot = 1; // position forces
          }

        }

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

        fx = s[offset+P_VELX] * s[offset+P_FORX];
        fy = s[offset+P_VELY] * s[offset+P_FORY];
        fz = s[offset+P_VELZ] * s[offset+P_FORZ];

        s[offset+P_POSX] += fx;
        s[offset+P_POSY] += fy;
        s[offset+P_POSZ] += fz;

      }
      break;
      default:
        console.log('error in solver! invalid solvertype');
  }
}


function Render(mygl, n, myu_ViewMatrix, myViewMatrix) {


  mygl.clear(mygl.COLOR_BUFFER_BIT | mygl.DEPTH_BUFFER_BIT);

  mygl.blendFunc(mygl.SRC_ALPHA, mygl.ONE);

  mygl.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  
  mygl.bufferSubData(mygl.ARRAY_BUFFER, 0, s);
 
 modelMatrix.setScale(1,1,1);

  modelMatrix.setRotate(-45,1,0,0);

  mygl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);
  
  mygl.uniform1f(u_alpha, 2);
   
  mygl.drawArrays(mygl.POINTS, 0, n); // draws electrons
  
  mygl.uniform1i(isPartID, false);

  mygl.uniform1f(u_alpha, 2);

  mygl.drawArrays(mygl.TRIANGLES,             // use this drawing primitive, and
                  circWallStart/PartEleCount, // start at this vertex number, and
                  (circWalls.length)/PartEleCount);   // draw this many vertices*/

  mygl.uniform1i(isPartID, true);
  
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
      
            DetectCollision(constraints[j], offset, wBuffer, Circuit);
        

      }
    }
  }
}


//they are all 0.12 but I named them for readability
  var bufferAbove = 0.18;
  var bufferBeneath = 0.18;
  var bufferRight = 0.18;
  var bufferLeft = 0.18;
// returns 1 for collisions with constant-x walls, 2 for constant-y walls, and 0 otherwise
function DetectCollision(wall, sOffset, buffer){ // wall constraint, offset in state array for particle, buffer = distance from wall before collision occurs
  var colWindow = buffer;



              //s[sOffset+P_FORX] = 1;
              //s[sOffset+P_FORY] = 1; 
              //s[sOffset+P_FORZ] = 1;      

  
  if (s[sOffset+P_WALL] != wall.Csize ) return; //every particle is initialized in a wall 
                                                //check which wall it is and define the constraints

  
  if (Math.abs(wall.strt[0] - wall.end[0]) < Math.abs(wall.strt[1] - wall.end[1])) { // it's a constant-x wall
          if( s[sOffset+P_POSX] >= (wall.strt[0] + bufferRight) && s[sOffset+P_VELX] > 0.0 || //0.2 for a little space above the line 
              s[sOffset+P_POSX] <= (wall.end[0] - bufferLeft)  && s[sOffset+P_VELX] < 0.0){ //and some space below the line to make a wall
                s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];
          }

            if (wall.strt[1] < wall.end[1]){
                  if (s[sOffset+P_POSY] <= (wall.strt[1] - bufferLeft) && s[sOffset+P_VELY] < 0.0){ 
                      var wall_Id= bumpedInto(wall, "0" ,Circuit);//"S" for start
                      if(wall_Id == -1){
                        s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }
                  } else if(s[sOffset+P_POSY] >= (wall.end[1] + bufferRight)&& s[sOffset+P_VELY] > 0.0){ // collision! 
                      var wall_Id= bumpedInto(wall, "1",Circuit);//"E for end"
                      if(wall_Id == -1){
                        s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }

                  } 


            }else {
                  if (s[sOffset+P_POSY] >= (wall.strt[1] + bufferLeft) && s[sOffset+P_VELY] > 0.0){ 
                      var wall_Id= bumpedInto(wall, "0" ,Circuit);//"S" for start
                      if(wall_Id == -1){
                        s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }
                  } else if(s[sOffset+P_POSY] <= (wall.end[1] - bufferRight)&& s[sOffset+P_VELY] < 0.0){ // collision! 
                      var wall_Id= bumpedInto(wall, "1",Circuit);//"E for end"
                      if(wall_Id == -1){
                        s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }

                  } 


            }



  }else if (Math.abs(wall.strt[0] - wall.end[0]) > Math.abs(wall.strt[1] - wall.end[1])) {


            //very verbose, I can think of many ways to simplify this code but ...
            if (wall.strt[0] < wall.end[0]){
                  if (s[sOffset+P_POSX] <= (wall.strt[0] - bufferLeft) && s[sOffset+P_VELX] < 0.0){ 
                      var wall_Id= bumpedInto(wall, "0" ,Circuit);//"S" for start
                      if(wall_Id == -1){
                        s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }
                  } else if(s[sOffset+P_POSX] >= (wall.end[0] + bufferRight)&& s[sOffset+P_VELX] > 0.0){ // collision! 
                      var wall_Id= bumpedInto(wall, "1",Circuit);//"E for end"
                      if(wall_Id == -1){
                        s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }

                  } 


            } else{ // start and end are reveresed sometimes
                  if (s[sOffset+P_POSX] >= (wall.strt[0] + bufferLeft) && s[sOffset+P_VELX] > 0.0){ 
                      var wall_Id= bumpedInto(wall, "0" ,Circuit);//"S" for start
                      if(wall_Id == -1){
                        s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }
                  } else if(s[sOffset+P_POSX] <= (wall.end[0] - bufferRight)&& s[sOffset+P_VELX] < 0.0){ // collision! 
                      var wall_Id= bumpedInto(wall, "1",Circuit);//"E for end"
                      if(wall_Id == -1){
                        s[sOffset+P_VELX] = -1 * s[sOffset+P_VELX];
                      }else{
                        s[sOffset+P_WALL] = wall_Id;
                        return;
                      }

                  } 

            }
                if( s[sOffset+P_POSY] >= (wall.strt[1] + bufferAbove) && s[sOffset+P_VELY] > 0.0 ||
                    s[sOffset+P_POSY] <= (wall.end[1] - bufferBeneath)  && s[sOffset+P_VELY] < 0.0){

                      s[sOffset+P_VELY] = -1 * s[sOffset+P_VELY]; 

                }



  }
            if( s[sOffset+P_POSZ] >= (0.05) && s[sOffset+P_VELZ] > 0.0 || //0.2 for a little space above the line 
              s[sOffset+P_POSZ] <= (-0.05)  && s[sOffset+P_VELZ] < 0.0){ //and some space below the line to make a wall
                s[sOffset+P_VELZ] = -1 * s[sOffset+P_VELZ];
          }


}




function bumpedInto(wall, xSE){
  //bumped into a wallStart
      var n = wall.Csize; //I stored Identification in Csize
      var array_Id = [];
      
      if (Circuit[n].IPS.length == 0) return -1;
      for (var i = 0; i < Circuit[n].IPS.length; i++){
        if(Circuit[n].IPS[i][IPS_POSN] == xSE){ //if its the start wall
            array_Id.push(Circuit[n].IPS[i][IPS_IDEN]);//2 D array
        }
      }

      if (array_Id.length == 0 || isNaN(array_Id.length)){
        return -1;        
      }else{
        //pick a random connected wall
        var k = parseInt(Math.random() * (array_Id.length - 1));
        //console.log("new Identification " + Circuit[n].IPS[0]);
        return array_Id[k];
        //return -1
      }

}


function connected(){
  for (var i =0; i < Circuit.length; i++){
    Circuit[i].connected = [];
    Circuit[i].IPS = [];
      var origstrtX =Circuit[i].endp1[0];
      var origstrtY =Circuit[i].endp1[1];
      var origendX =Circuit[i].endp2[0];
      var origendY =Circuit[i].endp2[1];

    for (var j = 0; j < Circuit.length; j++){
      //do points intersect start point or end point

      var teststrtX =Circuit[j].endp1[0];
      var teststrtY =Circuit[j].endp1[1];
      var testendX =Circuit[j].endp2[0];
      var testendY =Circuit[j].endp2[1];

      var isConnected = false
      var startOrEnd;
      var LRTB;

      if(i != j){
        if(origstrtX == teststrtX && origstrtY == teststrtY ){
          isConnected = true;
          startOrEnd = 0;
          LRTB = isLRTB(origstrtX,origstrtY,testendX,testendY,Circuit[i].openStart);
        }
        if(origendX == testendX && origendY == testendY){
          isConnected = true;        
          startOrEnd = 1;
          LRTB = isLRTB(origendX,origendY,teststrtX,teststrtY,Circuit[i].openEnd);
        }
        if(origstrtX == testendX && origstrtY == testendY){
          isConnected = true;
          startOrEnd = 0;
          LRTB = isLRTB(origstrtX,origstrtY,teststrtX,teststrtY,Circuit[i].openStart);
        }
        if(origendX == teststrtX && origendY == teststrtY){
          isConnected = true;        
          startOrEnd = 1;
          LRTB = isLRTB(origendX,origendY,testendX,testendY,Circuit[i].openEnd);
        }

      }

      if(isConnected){
        //pair id of connected point and CircuitendPoints[] and opening(LRTB)
          Circuit[i].IPS.push([Circuit[j].identification, startOrEnd, LRTB]) 
          Circuit[i].connected.push(Circuit[j].identification);                
      }
      
        
    }
    console.log("Circuit Type" + Circuit[i].compType+ 
                " Circuit Identification " + Circuit[i].identification +" " +Circuit[i].connected +
                "End Connections " + Circuit[i].openEnd +
                "Start Connections " + Circuit[i].openStart + 
                " IPS " +Circuit[i].IPS);
  }
}

function isLRTB(xs,ys,xe,ye,OpenStartEnd){ //s for start and e for end pass connected point of orig and other point of test
  if((Math.abs(ye - ys))>(Math.abs(xe-xs))){//test point is long in y
      //Oriented in the y direction
      if((ye-ys)< 0){
        OpenStartEnd[0] = "T";
        return "T";
      }else{
        OpenStartEnd[1] = "B";
        return "B";
      } 
  }else{

      if((xe-xs)< 0){
        OpenStartEnd[2] = "L";
        return "L";
      }else{
        OpenStartEnd[3] = "R";
        return "R";
      } 

  }
}



function keydown(ev) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

    switch(ev.keyCode){
      case 37:
        g_eyeX = g_eyeX - 0.2;
        g_lookAtX = g_lookAtX - 0.2;
      break;
      case 38:
      //if(g_eyeZ <= 0.0)
        g_eyeZ = g_eyeZ + 0.2;

      break;
      case 39:
        g_eyeX = g_eyeX + 0.2;
        g_lookAtX = g_lookAtX + 0.2;
      break;
      case 40:
        //if (g_eyeZ >= -7.5 )
          g_eyeZ = g_eyeZ - 0.2;
      break;
    }
}


function makeCircuit() {
  //==============================================================================
  // go through each circuit component. for each one:
  //      create the constraint walls on each side
  //      create the visible walls on each side
  //      create the force field
  //      create the ions based on the segment's resistance

  var totIons = 0;
  for (var n = 0; n < Circuit.length; n++) {
    //totIons += Math.ceil(Circuit[n].resistance*IonNumConst)+5*numComps;

    var startx = Circuit[n].endp1[0], starty = Circuit[n].endp1[1];
    var endx = Circuit[n].endp2[0], endy = Circuit[n].endp2[1];
    //var IonsInComp = 5+Math.ceil(Circuit[n].resistance*IonNumConst); // number of ions for this component

    var xspacing = (endx - startx); 
    var yspacing = (endy - starty);
    //var dspacing = 0.1;
    if (Circuit[n].compType == "Wire") { //constant number of ions for wire
      if ((xspacing)> (yspacing)){
        totIons += Math.ceil((xspacing/dspacing)*IonNumConst)+5*numComps;
      }else{
        totIons += Math.ceil((yspacing/dspacing)*IonNumConst)+5*numComps;

      }
    }else{
        totIons += Math.ceil(Circuit[n].resistance*IonNumConst)+5*numComps;      
    }

  }
  circVerts = new Float32Array(totIons*PartEleCount); // initialize the array to hold the ion info
  // may need to define constraints array here
  var IonsDone = 0; // used to track array indices, since each component doesn't have the same number of ions
  for (var n = 0; n < Circuit.length; n++) {
    // add relevant vertex information to render ions
    var startx = Circuit[n].endp1[0], starty = Circuit[n].endp1[1];
    var endx = Circuit[n].endp2[0], endy = Circuit[n].endp2[1];
    var IonsInComp = 5+Math.ceil(Circuit[n].resistance*IonNumConst); // number of ions for this component

    var xspacing = (endx - startx)/IonsInComp; 
    var yspacing = (endy - starty)/IonsInComp;
    var dx =  endx - startx;
    var dy = endy - starty;
    //var dspacing = 0.1;
    if (Circuit[n].compType == "Wire") { //constant number of ions for wire
      if ((xspacing)> (yspacing)){
        IonsInComp = 5+Math.ceil((dx/dspacing)*IonNumConst);        
      }else{
        IonsInComp = 5+Math.ceil((dy/dspacing)*IonNumConst);        

      }
      xspacing = (endx - startx)/IonsInComp;
      yspacing = (endy - starty)/IonsInComp;

    }


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
        circVerts[offset+P_CGRN] = 1.0;
        circVerts[offset+P_CBLU] = 1.0;

        circVerts[offset+P_NOMX] = 0.0;
        circVerts[offset+P_NOMY] = 0.0;
        circVerts[offset+P_NOMZ] = 1.0;
        console.log("CirVerts color " + circVerts[offset+P_CRED])

      if (Circuit[n].compType == "Battery") {
        circVerts[offset+P_CRED] = 0.0;
        circVerts[offset+P_CGRN] = 1.0;
        circVerts[offset+P_CBLU] = 1.0;
      //} else {
        //circVerts[offset+P_CRED] = 1.0;
      }
      //circVerts[offset+P_CBLU] = 0.0;
      if (Circuit[n].compType == "Bulb") {
        circVerts[offset+P_CGRN] = 1.0;
        circVerts[offset+P_CRED] = 1.0;
        circVerts[offset+P_CBLU] = 0.0;
      //} else {
        //circVerts[offset+P_CGRN] = 0;
      }
      if (Circuit[n].compType == "Resistor") {
        circVerts[offset+P_CRED] = 1.0;        
        circVerts[offset+P_CGRN] = 0.0;
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


        constraints[wallstart+n] = new Constraint(1, // wall type 
                                                    n, // size not relevant for walls // I'll save identification for the walls in this size container
                                                    0.0, // x coord (of wall center. Not used, but still included)
                                                    0.0, // y
                                                    0.0, // z
                                                    0.4, // height
                                                    [Circuit[n].endp1[0]//-circWidth/2
                                                    ,Circuit[n].endp1[1]//+neg*circWidth/2
                                                    ,0.0], // start point
                                                    [Circuit[n].endp2[0]//-circWidth/2
                                                    ,Circuit[n].endp2[1]//-neg*circWidth/2
                                                    ,0.0],
                                                     Circuit[n].voltage); // end point

        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0], Circuit[n].endp1[1] /*- circWidth/2*/],
                         [Circuit[n].endp2[0], Circuit[n].endp2[1] /*- circWidth/2*/], circWidth, Circuit[n].voltage, n);
        //identify Circuit Component
        Circuit[n].identification = n;
          console.log("What happens here " + wallstart+2*n);


  }
  
}

/*function makeCircuitWalls() {
  // create four points on the outside, color them green
  circWalls = new Float32Array(12*numComps*PartEleCount); // 4 triangles (3 verts each) per circuit component

  for (i = 0; i < Circuit.length; i++) {
  offset =i*PartEleCount;
  offset1 =(i+1)*PartEleCount;
  offset2 =(i+2)*PartEleCount;
  offset3 =(i+3)*PartEleCount;

      circWalls[offset+P_POSX] = Circuit[i].endp1[0];
      circWalls[offset+P_POSY] = Circuit[i].endp1[1]+1.2;
      circWalls[offset+P_POSZ] = 0;
      circWalls[offset1 +P_POSX] = Circuit[i].endp1[0];
      circWalls[offset1 +P_POSY] = Circuit[i].endp1[1]-1.2;
      circWalls[offset1 +P_POSZ] = 0;
      circWalls[offset2 +P_POSX] = Circuit[i].endp2[0];
      circWalls[offset2 +P_POSY] = Circuit[i].endp2[1]+1.2;
      circWalls[offset2 +P_POSZ] = 0;
      circWalls[offset3 +P_POSX] = Circuit[i].endp2[0];
      circWalls[offset3 +P_POSY] = Circuit[i].endp2[1]-1.2;
      circWalls[offset3 +P_POSZ] = 0;

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


}*/



function initVertexBuffersNew(gl) {
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


function initVertexBufferwWalls(gl) {
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
  circWallStart = i;
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

//assign  normal
  var a_Norm = gl.getAttribLocation(gl.program, 'a_norm');
  if(a_Norm < 0) {
    console.log('Failed to get the storage location of a_Norm');
    return -1;
  }
  gl.vertexAttribPointer(a_Norm, 3, gl.FLOAT, false, FSIZE * PartEleCount, P_NOMX*FSIZE);
  gl.enableVertexAttribArray(a_Norm);

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

//
function pnpoly(nvert, vertx, verty, testx, testy){
  var c = false;
  for(var i = 0, j = nvert -1; i < nvert; j = i++){
      if(((verty[i]>testy) != (verty[j]>testy)) &&
   (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i])) {c = !c;}
  }
  return c;
}

function makeCircuitWalls() {
  // create four points on the outside, color them green
  circWalls = new Float32Array(12*numComps*PartEleCount); // 4 triangles (3 verts each) per circuit component
  manOffset = 0;
  negy = 1;
  negx = 1;

var r1 = 0.37;
var g1 = 0.22;
var b1 = 0.47;

var r2 = 0.37;
var g2 = 0.22;
var b2 = 0.47;

  //?COnnected

  connected();

  for (i = 0; i < Circuit.length; i++) {
    //check for greater end to add buffer and lesser end to subtract
    var startx = Circuit[i].endp1[0];
    var starty = Circuit[i].endp1[1];

    var endx = Circuit[i].endp2[0];
    var endy = Circuit[i].endp2[1];

    if (Math.abs(endx - startx) > Math.abs(endy - starty)){
        if (endx > startx){ var negx = 1;}else{ var negx = -1; }
          var strtid = 0;
          var endid = 0;
          for (var j = 0; j < Circuit[i].IPS.length; j++ ){
            //find the positions that are connected; whether the start or the end;
            // assign strtid and end id 1 or 0 depending on whether they are open or not
            //find the sides that are connected; the top or the bottom
            if (Circuit[i].IPS[j][IPS_SIDE] == "B")
            {
              if(Circuit[i].IPS[j][IPS_POSN] == 0)strtid = 1;
              if(Circuit[i].IPS[j][IPS_POSN] == 1)endid = 1;                
              }
          }

            openingx = 0.4;  
          //bottom wall // I HAVE TO CHECK WHY T AND BOTTOM CORRESPOND
          circWalls[manOffset+P_POSX] = startx-(0.2 - strtid * openingx)*negx, circWalls[manOffset+P_POSY] = starty +0.2, circWalls[manOffset+P_POSZ] = 0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          //normals
          circWalls[manOffset+P_NOMX] = 1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;

          manOffset += PartEleCount;
          circWalls[manOffset+P_POSX] = startx -(0.2 - strtid * openingx)*negx, circWalls[manOffset+P_POSY] = starty  +0.2, circWalls[manOffset+P_POSZ] = -0.2;
          circWalls[manOffset+P_CRED] = r2, circWalls[manOffset+P_CBLU] = g2,circWalls[manOffset+P_CGRN] = b2;
          circWalls[manOffset+P_NOMX] = 1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;

          manOffset += PartEleCount;
          circWalls[manOffset+P_POSX] = endx+(0.2 - endid * openingx)*negx, circWalls[manOffset+P_POSY] = endy  +0.2, circWalls[manOffset+P_POSZ] = 0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = 1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;

          manOffset += PartEleCount;
          circWalls[manOffset+P_POSX] = startx-(0.2 - strtid * openingx)*negx, circWalls[manOffset+P_POSY] = starty +0.2, circWalls[manOffset+P_POSZ] = -0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = 1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;

          manOffset += PartEleCount;  
          circWalls[manOffset+P_POSX] = endx+(0.2 - endid * openingx)*negx, circWalls[manOffset+P_POSY] = endy +0.2, circWalls[manOffset+P_POSZ] = 0.2;
          circWalls[manOffset+P_CRED] = r2, circWalls[manOffset+P_CBLU] = g2,circWalls[manOffset+P_CGRN] = b2;
          circWalls[manOffset+P_NOMX] = 1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;

          manOffset += PartEleCount;  
          circWalls[manOffset+P_POSX] = endx+(0.2 - endid * openingx)*negx, circWalls[manOffset+P_POSY] = endy +0.2, circWalls[manOffset+P_POSZ] = -0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = 1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;

          manOffset += PartEleCount; 

          strtid = 0;
          endid = 0;

          for (var j = 0; j < Circuit[i].IPS.length; j++ ){
            //find the positions that are connected; whether the start or the end;
            // assign strtid and end id 1 or 0 depending on whether they are open or not
            //find the sides that are connected; the top or the bottom
            if (Circuit[i].IPS[j][IPS_SIDE] == "T")
            {
              if(Circuit[i].IPS[j][IPS_POSN] == 0)strtid = 1;
              if(Circuit[i].IPS[j][IPS_POSN] == 1)endid = 1;                
              }
          }


          //top wall (0.2 - strtid * openingx)
          circWalls[manOffset+P_POSX] = startx-(0.2 - strtid * openingx)*negx, circWalls[manOffset+P_POSY] = starty -0.2, circWalls[manOffset+P_POSZ] = 0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = -1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;
          manOffset += PartEleCount;

          circWalls[manOffset+P_POSX] = startx -(0.2 - strtid * openingx)*negx, circWalls[manOffset+P_POSY] = starty  -0.2, circWalls[manOffset+P_POSZ] = -0.2;
          circWalls[manOffset+P_CRED] = r2, circWalls[manOffset+P_CBLU] = g2,circWalls[manOffset+P_CGRN] = b2;
          circWalls[manOffset+P_NOMX] = -1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;
          manOffset += PartEleCount;

          circWalls[manOffset+P_POSX] = endx+(0.2 - endid * openingx)*negx, circWalls[manOffset+P_POSY] = endy  -0.2, circWalls[manOffset+P_POSZ] = 0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = -1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;
          manOffset += PartEleCount;

          circWalls[manOffset+P_POSX] = startx-(0.2 - strtid * openingx)*negx, circWalls[manOffset+P_POSY] = starty -0.2, circWalls[manOffset+P_POSZ] = -0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = -1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;
          manOffset += PartEleCount;  

          circWalls[manOffset+P_POSX] = endx+(0.2 - endid * openingx)*negx, circWalls[manOffset+P_POSY] = endy -0.2, circWalls[manOffset+P_POSZ] = 0.2;
          circWalls[manOffset+P_CRED] = r2, circWalls[manOffset+P_CBLU] = g2,circWalls[manOffset+P_CGRN] = b2;
          circWalls[manOffset+P_NOMX] = -1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;
          manOffset += PartEleCount;  

          circWalls[manOffset+P_POSX] = endx+(0.2 - endid * openingx)*negx, circWalls[manOffset+P_POSY] = endy -0.2, circWalls[manOffset+P_POSZ] = -0.2;
          circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
          circWalls[manOffset+P_NOMX] = -1, circWalls[manOffset+P_NOMY] = 0, circWalls[manOffset+P_NOMZ] = 0;
          manOffset += PartEleCount; 


    }else{
        if (endy > starty){ var negy = -1;}else{ var negy = 1; }    

          strtid = 0;
          endid = 0;

          for (var j = 0; j < Circuit[i].IPS.length; j++ ){
            //find the positions that are connected; whether the start or the end;
            // assign strtid and end id 1 or 0 depending on whether they are open or not
            //find the sides that are connected; the top or the bottom
            if (Circuit[i].IPS[j][IPS_SIDE] == "R")
            {
              if(Circuit[i].IPS[j][IPS_POSN] == 0)strtid = 1;
              if(Circuit[i].IPS[j][IPS_POSN] == 1)endid = 1;                
              }
            }
          openingy = 0.4;
    //Rightwall
      circWalls[manOffset+P_POSX] = startx+0.2, circWalls[manOffset+P_POSY] = starty +(0.2 - strtid * openingy)* negy, circWalls[manOffset+P_POSZ] = 0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = 1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;

      circWalls[manOffset+P_POSX] = startx +0.2, circWalls[manOffset+P_POSY] = starty  +(0.2 - strtid * openingy)* negy, circWalls[manOffset+P_POSZ] = -0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = 1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;

      circWalls[manOffset+P_POSX] = endx+0.2, circWalls[manOffset+P_POSY] = endy  -(0.2 - endid * openingy)* negy, circWalls[manOffset+P_POSZ] = 0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = 1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;

      circWalls[manOffset+P_POSX] = startx+0.2, circWalls[manOffset+P_POSY] = starty +(0.2 - strtid * openingy)* negy, circWalls[manOffset+P_POSZ] = -0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = 1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;  

      circWalls[manOffset+P_POSX] = endx+0.2, circWalls[manOffset+P_POSY] = endy -(0.2 - endid * openingy)* negy, circWalls[manOffset+P_POSZ] = 0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = 1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;  

      circWalls[manOffset+P_POSX] = endx+0.2, circWalls[manOffset+P_POSY] = endy -(0.2 - endid * openingy)* negy, circWalls[manOffset+P_POSZ] = -0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = 1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount; 



      //left wall

          strtid = 0;
          endid = 0;

          for (var j = 0; j < Circuit[i].IPS.length; j++ ){
            //find the positions that are connected; whether the start or the end;
            // assign strtid and end id 1 or 0 depending on whether they are open or not
            //find the sides that are connected; the top or the bottom
            if (Circuit[i].IPS[j][IPS_SIDE] == "L")
            {
              if(Circuit[i].IPS[j][IPS_POSN] == 0)strtid = 1;
              if(Circuit[i].IPS[j][IPS_POSN] == 1)endid = 1;                
              }
            }
          openingy = 0.4;

      circWalls[manOffset+P_POSX] = startx-0.2, circWalls[manOffset+P_POSY] = starty +(0.2 - strtid * openingy)* negy, circWalls[manOffset+P_POSZ] = 0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = -1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;
      
      circWalls[manOffset+P_POSX] = startx -0.2, circWalls[manOffset+P_POSY] = starty  +(0.2 - strtid * openingy)* negy, circWalls[manOffset+P_POSZ] = -0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = -1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;

      circWalls[manOffset+P_POSX] = endx-0.2, circWalls[manOffset+P_POSY] = endy  -(0.2 - endid * openingy)* negy, circWalls[manOffset+P_POSZ] = 0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = -1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;

      circWalls[manOffset+P_POSX] = startx-0.2, circWalls[manOffset+P_POSY] = starty +(0.2 - strtid * openingy)* negy, circWalls[manOffset+P_POSZ] = -0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = -1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;  

      circWalls[manOffset+P_POSX] = endx-0.2, circWalls[manOffset+P_POSY] = endy -(0.2 - endid * openingy)* negy, circWalls[manOffset+P_POSZ] = 0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = -1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount;  

      circWalls[manOffset+P_POSX] = endx-0.2, circWalls[manOffset+P_POSY] = endy -(0.2 - endid * openingy)* negy, circWalls[manOffset+P_POSZ] = -0.2;
      circWalls[manOffset+P_CRED] = r1, circWalls[manOffset+P_CBLU] = g1,circWalls[manOffset+P_CGRN] = b1;
      circWalls[manOffset+P_NOMX] = 0, circWalls[manOffset+P_NOMY] = -1, circWalls[manOffset+P_NOMZ] = 0;
      manOffset += PartEleCount; 

    }

    
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
      circWalls[offset+P_TPRT] = 1;
    }



  }
  
}

