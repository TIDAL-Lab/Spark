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
  'varying float isPoint; \n' +
  'uniform bool u_isPart; \n' +
  'uniform int renderMode; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  'uniform mat4 u_ProjMatrix; \n' +
  'void main() {\n' +
  ' if (u_isPart) { \n' +
  '  gl_PointSize = a_diam;\n' +
  '}\n ' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;  \n' + 
  '  v_Color = a_Color; \n' +
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
  'varying vec4 v_Color; \n' +
  'varying float isPoint; \n' +
  'void main() {\n' +
  '    if (isPoint == 1.0) { \n' +
  '       float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '       if(dist < 0.5) { \n' + 
  '           gl_FragColor = vec4((1.0 - 1.5*dist)*v_Color.rgb, v_Color.a);\n' +
  '       } else { discard; }\n' +
  '    } else { \n' +
  '       gl_FragColor = v_Color; } \n' +
  '} \n';

var numComps = 4;
var Circuit = new Array(numComps);
Parse.initialize("s702DtCwndp1EuDy6gZ7Svb5gXIEMxXX8mZWx568", "5mQjxZxMhXrdkuUWmSYWExVP3kpXce0GKheMX9NB");

var objIDlist = new Array(numComps); // needs to be longer if circuit has more than 4 components
objIDlist[0] = "3WEe0vhplL", objIDlist[1] = "XHjTgqzrVU", objIDlist[2] = "G2DV3AwYbh", objIDlist[3] = "bBjh3ZWPLn";


var parseCircuit = Parse.Object.extend("Circuit");
for (var i = 0; i < objIDlist.length; i++) {
  var self = 0;
  var compType, current, compRes, compVolt, startx, starty, endx, endy, direction;
  var query = new Parse.Query(parseCircuit);
  query.equalTo("objectId", objIDlist[i]);
  var promise0 = query.first();
  var promise1 = promise0.then(
    function(result) {
      console.log("lookupXByID.promise0.success");
      if (typeof result === "undefined") {
        return utilMod.promiseerror(100004, "no matching X ID");
      }
      else {
        compType = result.get("type");
        compVolt = result.get("voltageDrop");
        current = result.get("current");
        compRes = result.get("resistance");
        startx = result.get("startX");
        starty = result.get("startY");
        endx = result.get("endX");
        endy = result.get("endY");
        direction = result.get("wallType");

        console.log('compType:', compType);
        console.log('voltageDrop:', compVolt);
        console.log('current:', current);
        console.log('resistance:', compRes);
        Circuit[i] = new CircuitComponent(compType, current, compRes, compVolt, startx, starty, endx, endy, direction);
        return result;
      };
    });
  console.log("lookupXbyID.exit");


/*
  query.get(objIDlist[i], {
    success: function(circ) {
    console.log('SUCCESS');
    compType = circ.get("type");
    compVolt = circ.get("voltageDrop");
    current = circ.get("current");
    compRes = circ.get("resistance");
    startx = circ.get("startX");
    starty = circ.get("startY");
    endx = circ.get("endX");
    endy = circ.get("endY");
    direction = circ.get("wallType");
    
    console.log('compType:', compType);
    console.log('voltageDrop:', compVolt);
    console.log('current:', current);
    console.log('resistance:', compRes);
  },

  error: function(error) {
    console.log('ERROR retrieving parse.com data');
  }
  });
  */

}


console.log('check to see if Circuit array got filled:');
for (var i = 0; i < Circuit.length; i++) {
  console.log("Element", i, ":", Circuit[i]);
}



function Force (forcetype, start, end, width) {
  // 0 = gravity, 
  this.forceType = forcetype;
  this.dragConst = 0.975;
  this.circForce = 5.0;
  this.BoidSep = 1000.0;
  this.BoidAli = 500.0;
  this.BoidCoh = 2.1;
  this.centForce = -5.0;
  this.electro = 5.0;
  this.strt = start;
  this.end = end;
  this.wid = width;
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



  var DRAG_CONST = 0.975;
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



var currentConst = 10; // multiplied with calculated current to create "realistic" looking flows
var IonNumConst = 10; // multiplied with calculated number of ions in circuit component so wires aren't empty
var PartEleCount = 15; // number of fields per particle in the state array
var numIons = 200; // total number of ions in circuit
var numWalls = numComps*2;
var circWidth = 0.2 // globally defined circuit width
var f = new Array(numComps); // array used to hold forces
var numParticles = 200; // number of electrons
var ionSize = 15; // size of each ion
var g_EyeRadius = 4.0, g_EyeZrot = 50.0, g_EyeXrot = 90; // vars used for camera perspective
var isPart = true; // T/F value used to tell the shader if rendering particles or other shapes (lines, triangles)
var circOn = 1, dragOn = 1;
var Solver = 0; // 0 for Euler
var WallsOn = 0;


/*
// left wall 
Circuit[0] = new CircuitComponent("Wire", // type 
                                  1.0, // resistance
                                  1.0, // voltage
                                  -2, // startx
                                  -2, // start y
                                  -2, // end x
                                  2, // end y
                                  0); // inner wall on right side
// top wall
Circuit[1] = new CircuitComponent("Bulb", 1.0, 1.0, -2, 2, 2, 2, 3);
// right wall
Circuit[2] = new CircuitComponent("Resistor", 3.0, 1.0, 2, 2, 2, -2, 1);
// bottom wall
Circuit[3] = new CircuitComponent("Battery", 1.0, 1.0, 2, -2, -2, -2, 2); 
*/

//variables for camera lookat
var centerx, centery, centerz = 0;
for (n = 0; n < Circuit.length; n++) {
  //console.log('endp1:', Circuit[n].voltage);
  centerx += Circuit[n].endp1[0] + Circuit[n].endp2[0];
  centery += Circuit[n].endp1[1] + Circuit[n].endp2[1];
}
centerx = centerx / (Circuit.length*2);
centery = centery / (Circuit.length*2);

var resistanceTotal = 0;
// calculate the current in the circuit
for (i = 0; i < Circuit.length; i++) {
  console.log('res total:', resistanceTotal);
  resistanceTotal += Circuit[i].resistance;
}
console.log('res, numions numwalls', resistanceTotal, IonNumConst, numWalls);
var constraints = new Array(Math.ceil(resistanceTotal*IonNumConst)+10*numComps+numWalls);
console.log('constraints length:', constraints.length);
var current = Circuit[0].curr;

var RenderMode = 0; // 0 -> circuit, 1-> unstable spring/mass, 2-> stable spring/mass, 3-> fire, 4-> boids, 5 -> atom


var s = new Float32Array(numParticles*PartEleCount);

//f[0] = new Force(5, 0, 0); // boid forces



// for loop to build particle system

function initParticles() {
  
  for (var i = 0; i< numParticles; i++) {
    var compStart = i%Circuit.length; // which circuit component this electron will initialize in 
    var offset = i*PartEleCount;
    s[offset+P_MASS] = 10;
    s[offset+P_SIZE] = 4;
    if (circOn) {
      var randDist = Math.random();
      s[offset+P_POSX] = Circuit[compStart].endp1[0] + randDist*(Circuit[compStart].endp2[0]-Circuit[compStart].endp1[0]); // +- [0.9 - 1.0]
      s[offset+P_POSY] = Circuit[compStart].endp1[1] + randDist*(Circuit[compStart].endp2[1]-Circuit[compStart].endp1[1]);
      s[offset+P_POSZ] = 0.1*Math.random() - 0.1*Math.random();
    }
    else {
      s[offset+P_POSX] = -0.3*Math.random() + 0.3*Math.random();
      s[offset+P_POSY] = -0.3*Math.random() + 0.3*Math.random();
      s[offset+P_POSZ] = Math.random() - Math.random();  
    }
    s[offset+P_VELX] = -0.2*Math.random() + 0.2*Math.random();
    s[offset+P_VELY] = -0.2*Math.random() + 0.2*Math.random();
    s[offset+P_VELZ] = 0;
    s[offset+P_FORX] = 0;
    s[offset+P_FORY] = 0;
    s[offset+P_FORZ] = 0;
    s[offset+P_CRED] = 0;
    s[offset+P_CBLU] = 1;
    s[offset+P_CGRN] = 0;
    s[offset+P_TPRT] = 1.0;
  }
}


var FSIZE = s.BYTES_PER_ELEMENT;
var timeStep = 1.0/30.0;
var g_last = Date.now();

function main() {
//==============================================================================
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

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
  isPartID = gl.getUniformLocation(gl.program, 'u_isPart');
  if (!isPartID) {
    console.log('failed to get isPart location');
  }
  gl.uniform1i(isPartID, isPart); //
  // set render mode to control what gets displayed
  var u_renderModeLoc = gl.getUniformLocation(gl.program, 'u_renderMode');
  if (u_renderModeLoc) { 
    console.log('Failed to get render mode variable location');
    return;
  }
  gl.uniform1i(u_renderModeLoc, RenderMode);

  initParticles();

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
    myVerts = initVertexBufferwWalls(gl); 
  } else {
    myVerts = initVertexBuffersNew(gl);
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
  gl.clear(gl.COLOR_BUFFER_BIT);
  // update state space
  calcForces();
  applyForces(0, timeStep); // 0 for Euler

  var xpos, ypos, zpos;
  xpos = g_EyeRadius * Math.cos(g_EyeZrot/2);
  ypos = g_EyeRadius * Math.cos(g_EyeXrot/2) + g_EyeRadius * Math.sin(g_EyeZrot/2);
  zpos = g_EyeRadius * Math.sin(g_EyeXrot/2);
  viewMatrix.setLookAt(xpos, ypos, zpos,  // eye position
                          0, 0, 0,                // look-at point (origin)
                          0, 0, 1);               // up vector (+z)
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);


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
      if (f[j].strt[0] == f[j].end[0]) { // if a y-force field
        if ((x < f[j].strt[0] + f[j].wid/2 && x > f[j].end[0] - f[j].wid/2) && // within x range AND
            (y < f[j].strt[1] && y > f[j].end[1] || y > f[j].strt[1] && y < f[j].end[1])) { // within y range
          if (f[j].strt[0] > 0) { // if the right side, force goes down
            fytot -= current;
          } else { // otherwise, force goes up
            fytot += current;
          }
        }
      } else if (f[j].strt[1] == f[j].end[1]) { // if an x-force field
        if ((x < f[j].strt[0] && x > f[j].end[0] || x > f[j].strt[0] && x < f[j].end[0]) && // within x range AND
            (y < f[j].strt[1] + f[j].wid/2 && y > f[j].end[1] - f[j].wid/2)) { // within y range
          if (f[j].strt[1] > 0) { // if on top, force goes right
            fxtot += current;
          } else { // else, force goes left
            fxtot -= current;
          }
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
        // apply velocities
        //console.log('previous positions: ', s[offset+P_POSX], s[offset+P_POSY], s[offset+P_POSZ]);
        s[offset+P_POSX] += s[offset+P_VELX]*timeStep;
        s[offset+P_POSY] += s[offset+P_VELY]*timeStep;
        s[offset+P_POSZ] += s[offset+P_VELZ]*timeStep;

        // apply changes in velocities due to forces - careful of div by 0!
        s[offset+P_VELX] += (s[offset+P_FORX] * timeStep) / s[offset+P_MASS];
        s[offset+P_VELY] += (s[offset+P_FORY] * timeStep) / s[offset+P_MASS];
        s[offset+P_VELZ] += (s[offset+P_FORZ] * timeStep) / s[offset+P_MASS];
        
        // apply changes in velocities due to drag
        if (dragOn) {
          s[offset+P_VELX] *= DRAG_CONST;
          s[offset+P_VELY] *= DRAG_CONST;
          s[offset+P_VELZ] *= DRAG_CONST;
        }
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
  

  //mygl.bufferSubData(mygl.ARRAY_BUFFER, s.length, circVerts);
  /*
  myPartID = mygl.getAttribLocation(mygl.program, 'u_isPart');
  if (!myPartID) {
    console.log('shit is whack yo');
  }
  */
  mygl.uniform1i(isPartID, false);

  mygl.drawArrays(mygl.POINTS,             // use this drawing primitive, and
                  s.length/PartEleCount, // start at this vertex number, and
                  (circVerts.length)/PartEleCount);   // draw this many vertices
  if (WallsOn == 1) {
    mygl.drawArrays(mygl.TRIANGLES,
                    (s.length+circVerts.length)/PartEleCount, // beginning of the circuit walls
                    (circWalls.length)/PartEleCount);
  }
  
 // now try to draw something else
 // vertexBufferID2 = gl.createBuffer();
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
          circVerts[j*PartEleCount + P_CBLU] += 0.1;
          //s[offset+P_CGRN] = 1.0;
          s[offset+P_VELX] = -s[offset+P_VELX] + 0.1*Math.random() - 0.1*Math.random();
          s[offset+P_VELY] = -s[offset+P_VELY] + 0.1*Math.random() - 0.1*Math.random();
          s[offset+P_VELZ] = -s[offset+P_VELZ];
        }
      }
      else if (constraints[j].Ctype == 1) { // if it's a wall constraint
        var wBuffer = 0.01; // distance from a wall before a collision is detected
        var isCollision = DetectCollision(constraints[j], offset, wBuffer);
        if (isCollision == 1) {
          // collision with x-constant wall
          if (s[offset+P_VELX] > 0) {
            s[offset+P_POSX] = constraints[j].strt[0] - wBuffer; // put particle on right side of wall
          } else {
            s[offset+P_POSX] = constraints[j].strt[0] + wBuffer;
          }
          s[offset+P_VELX] = -s[offset+P_VELX] + 0.2*Math.random() - 0.2*Math.random();
        } else if (isCollision == 2) {
          if (s[offset+P_VELY] > 0) {
            s[offset+P_POSY] = constraints[j].strt[1] - wBuffer; // put particle on right side of wall
          } else {
            s[offset+P_POSY] = constraints[j].strt[1] + wBuffer;
          }
          s[offset+P_VELY] = -s[offset+P_VELY] + 0.2*Math.random() - 0.2*Math.random();
        } 
      }
    }
  }
}






// returns 1 for collisions with constant-x walls, 2 for constant-y walls, and 0 otherwise
function DetectCollision(wall, sOffset, buffer){ // wall constraint, offset in state array for particle, buffer = distance from wall before collision occurs
  var colWindow = buffer;
  if (wall.strt[0] == wall.end[0]) { // it's a constant-x wall
    if (Math.abs(s[sOffset + P_POSX] - wall.strt[0]) < colWindow && // it's in close contact with the wall plane, and...
        (s[sOffset+P_POSY] > wall.strt[1] && s[sOffset+P_POSY] < wall.end[1] || // actually by the wall
         s[sOffset+P_POSY] < wall.strt[1] && s[sOffset+P_POSY] > wall.end[1])) { // collision! 
      return 1; 
    }
  }
  else if (wall.strt[1] == wall.end[1]) {
    if (Math.abs(s[sOffset + P_POSY] - wall.strt[1]) < colWindow &&
        (s[sOffset+P_POSX] > wall.strt[0] && s[sOffset+P_POSX] < wall.end[0] || 
         s[sOffset+P_POSX] < wall.strt[0] && s[sOffset+P_POSX] > wall.end[0])) { // collision! 
      return 2;
    }
  }
  else {
    return 0;
  }
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


function makeCircuit() {
  //==============================================================================
  // go through each circuit component. for each one:
  //      create the constraint walls on each side
  //      create the visible walls on each side
  //      create the force field
  //      create the ions based on the segment's resistance

  var totIons = 0;
  for (n = 0; n < Circuit.length; n++) {
    totIons += Math.ceil(Circuit[n].resistance*IonNumConst)+10*numComps;
  }
  circVerts = new Float32Array(totIons*PartEleCount); // initialize the array to hold the ion info
  // may need to define constraints array here
  var IonsDone = 0; // used to track array indices, since each component doesn't have the same number of ions
  for (n = 0; n < Circuit.length; n++) {
    // add relevant vertex shit to render ions
    var startx = Circuit[n].endp1[0], starty = Circuit[n].endp1[1];
    var endx = Circuit[n].endp2[0], endy = Circuit[n].endp2[1];
    var IonsInComp = 10+Math.ceil(Circuit[n].resistance*IonNumConst); // number of ions for this component
    var xspacing = (endx - startx)/IonsInComp;
    var yspacing = (endy - starty)/IonsInComp;
    for (i = 0; i < IonsInComp; i++) {
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
      if (Circuit[n].compType == "Battery") {
        circVerts[offset+P_CRED] = 0.0;
      } else {
        circVerts[offset+P_CRED] = 1.0;
      }
      circVerts[offset+P_CBLU] = 0.0;
      if (Circuit[n].compType == "Bulb") {
        circVerts[offset+P_CGRN] = 1.0;
      } else {
        circVerts[offset+P_CGRN] = 0;
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
                                                    0, // size not relevant for walls
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
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1, 0, 0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]+circWidth/2,
                                                       Circuit[n].endp1[1]-neg*circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+circWidth/2,
                                                       Circuit[n].endp2[1]+neg*circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0], Circuit[n].endp1[1] - circWidth/2],
                         [Circuit[n].endp2[0], Circuit[n].endp2[1] - circWidth/2], circWidth);

        break;
      case 1:
        // right wall
        var neg;
        if (Circuit[n].endp1[1]>Circuit[n].endp2[1]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, 0, -1.0, 0.0, 0.0, 0.4,
                                                    [Circuit[n].endp1[0]+circWidth/2,
                                                     Circuit[n].endp1[1]+neg*circWidth/2, 0.0], // start point
                                                    [Circuit[n].endp2[0]+circWidth/2,
                                                     Circuit[n].endp2[1]-neg*circWidth/2, 0.0]); // end point
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1, 0, 0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]-circWidth/2,
                                                       Circuit[n].endp1[1]-neg*circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]-circWidth/2,
                                                       Circuit[n].endp2[1]+neg*circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0], Circuit[n].endp1[1] + circWidth/2],
                         [Circuit[n].endp2[0], Circuit[n].endp2[1] + circWidth/2], circWidth);
        break;
      case 2:
        // bottom wall
        var neg;
        if (Circuit[n].endp1[0]>Circuit[n].endp2[0]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, 0, -1.0, 0.0, 0.0, 0.4,
                                                    [Circuit[n].endp1[0]+neg*circWidth/2,
                                                     Circuit[n].endp1[1]-circWidth/2, 0.0], // start point
                                                    [Circuit[n].endp2[0]-neg*circWidth/2,
                                                     Circuit[n].endp2[1]-circWidth/2, 0.0]); // end point
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1, 0, 0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]-neg*circWidth/2,
                                                       Circuit[n].endp1[1]+circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+neg*circWidth/2,
                                                       Circuit[n].endp2[1]+circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0] + circWidth/2, Circuit[n].endp1[1]],
                         [Circuit[n].endp2[0] + circWidth/2, Circuit[n].endp2[1]], circWidth);
        break;
      case 3:
        // top wall
        var neg;
        if (Circuit[n].endp1[0]>Circuit[n].endp2[0]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
          // outer wall first
        constraints[wallstart+2*n] = new Constraint(1, 0, -1.0, 0.0, 0.0, 0.4,
                                                    [Circuit[n].endp1[0]+neg*circWidth/2,
                                                     Circuit[n].endp1[1]+circWidth/2, 0.0], // start point
                                                    [Circuit[n].endp2[0]-neg*circWidth/2,
                                                     Circuit[n].endp2[1]+circWidth/2, 0.0]); // end point
          // inner wall next
        constraints[wallstart+2*n+1] = new Constraint(1, 0, 0, 0, 0, 0.4,
                                                      [Circuit[n].endp1[0]-neg*circWidth/2,
                                                       Circuit[n].endp1[1]-circWidth/2, 0.0], // start point
                                                      [Circuit[n].endp2[0]+neg*circWidth/2,
                                                       Circuit[n].endp2[1]-circWidth/2, 0.0]); // end point
        f[n] = new Force(0, // force type, start point, end point, width
                         [Circuit[n].endp1[0] - circWidth/2, Circuit[n].endp1[1]],
                         [Circuit[n].endp2[0] - circWidth/2, Circuit[n].endp2[1]], circWidth);
        break;
      default:
        console.log('something went wrong.');
    }
  }
  /*
  constraints[wallstart] = new Constraint(1, // wall type 
                                          0, // size not relevant for walls
                                          -1.0, // x coord (of wall center. Not used, but still included)
                                          0.0, // y
                                          0.0, // z
                                          0.4, // height
                                          [-1.0, -1.0, 0.0],
                                          [-1.0,  1.0, 0.0]);
  // top outer wall
  constraints[wallstart+1] = new Constraint(1, 0, 0.0, 1.0, 0.0, 0.4, [-1.0, 1.0, 0.0], [1.0,  1.0, 0.0]);
  // right outer wall
  constraints[wallstart+2] = new Constraint(1, 0, 1.0, 0.0, 0.0, 0.4, [1.0, 1.0, 0.0], [1.0, -1.0, 0.0]);
  // bottom outer wall
  constraints[wallstart+3] = new Constraint(1, 0, 0.0, -1.0, 0.0, 0.4, [1.0, -1.0, 0.0], [-1.0, -1.0, 0.0]);
  // left inner wall
  constraints[wallstart+4] = new Constraint(1, 0, -0.8, 0.0, 0.0, 0.4, [-0.8, -0.8, 0.0], [-0.8, 0.8, 0.0]);
  // top inner wall
  constraints[wallstart+5] = new Constraint(1, 0, 0.0, 0.8, 0.0, 0.4, [-0.8, 0.8, 0.0], [0.8, 0.8, 0.0]);
  // right inner wall
  constraints[wallstart+6] = new Constraint(1, 0, 0.8, 0.0, 0.0, 0.4, [0.8, 0.8, 0.0], [0.8, -0.8, 0.0]);
  // bottom inner wall
  constraints[wallstart+7] = new Constraint(1, 0, 0.0, -0.8, 0.0, 0.4, [0.8, -0.8, 0.0], [-0.8, -0.8, 0.0]);                                            
  */
}

function makeCircuitWalls() {
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
  /*
  switch(Circuit[n].compType) {
    case 0:
      // left wall
      var newOffset = n*12*PartEleCount;
      var neg;
      if (Circuit[n].endp1[1]>Circuit[n].endp2[1]) { neg = 1; } else { neg = -1; } // used to put circ width offsets on right sides
        // outer wall
      circWalls[newOffset+P_POSX] = Circuit[n].endp1[0]-circWidth/2-wallBuffer,
      circWalls[newOffset+P_POSY] = Circuit[n].endp1[1]+neg*(circWidth/2+wallBuffer),
      circWalls[newOffset+P_POSZ] = 0.2;
      newOffset+= PartEleCount;
      circWalls[newOffset+P_POSX] = Circuit[n].endp1[0]-circWidth/2-wallBuffer,
      circWalls[newOffset+P_POSY] = Circuit[n].endp1[1]+neg*(circWidth/2+wallBuffer),
      circWalls[newOffset+P_POSZ] = 0.2;
      newOffset+= PartEleCount;
      circWalls[newOffset+P_POSX] = Circuit[n].endp1[0]-circWidth/2-wallBuffer,
      circWalls[newOffset+P_POSY] = Circuit[n].endp1[1]+neg*(circWidth/2+wallBuffer),
      circWalls[newOffset+P_POSZ] = 0.2;
      newOffset+= PartEleCount;
      circWalls[newOffset+P_POSX] = Circuit[n].endp1[0]-circWidth/2-wallBuffer,
      circWalls[newOffset+P_POSY] = Circuit[n].endp1[1]+neg*(circWidth/2+wallBuffer),
      circWalls[newOffset+P_POSZ] = 0.2;
      newOffset+= PartEleCount;
      circWalls[newOffset+P_POSX] = Circuit[n].endp1[0]-circWidth/2-wallBuffer,
      circWalls[newOffset+P_POSY] = Circuit[n].endp1[1]+neg*(circWidth/2+wallBuffer),
      circWalls[newOffset+P_POSZ] = 0.2;
      newOffset+= PartEleCount;
      circWalls[newOffset+P_POSX] = Circuit[n].endp1[0]-circWidth/2-wallBuffer,
      circWalls[newOffset+P_POSY] = Circuit[n].endp1[1]+neg*(circWidth/2+wallBuffer),
      circWalls[newOffset+P_POSZ] = 0.2;
      newOffset+= PartEleCount;

        // inner wall
      break;
    case 1:
      // right wall
      break;
    case 2:
      // bottom wall
      break;
    case 3:
      // top wall
      break;
    default:
      console.log('makeCircuitWalls, something is wrong.');
  }
  */
  //  =====================================     OUTER WALLS    ===========================================
// left wall ---------------------------------------------------------------------------------------  
  // triangle 1
  // bottom left top (y, x, z)
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top left top
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top left bottom
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
//
//triangle 2
  // bottom left top (y, x, z)
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;  
  // bottom left bottom
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // top left bottom
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// top wall ---------------------------------------------------------------------------------------
  // top left top
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top right top
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top right bottom
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// triangle 2
  // top left top
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top left bottom
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // top right bottom
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// right wall --------------------------------------------------------------------------------------
  // top right top
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom right top
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom right bottom
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// triangle 2
  // top right top
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top right bottom
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = 1 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // bottom right bottom
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// bottom wall -------------------------------------------------------------------------------------
  // bottom right top
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom left top (y, x, z)
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom left bottom
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// triangle 2
  // bottom right top
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom right bottom
  circWalls[manOffset+P_POSX] = 1 + wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // bottom left bottom
  circWalls[manOffset+P_POSX] = -1 - wallBuffer, circWalls[manOffset+P_POSY] = -1 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
//
//
  // ==========================================        INNER WALLS        =============================================
// left wall ---------------------------------------------------------------------------------------  
  // triangle 1
  // bottom left top (y, x, z)
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top left top
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top left bottom
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
//
//triangle 2
  // bottom left top (y, x, z)
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;  
  // bottom left bottom
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // top left bottom
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// top wall ---------------------------------------------------------------------------------------
  // top left top
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top right top
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top right bottom
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// triangle 2
  // top left top
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top left bottom
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // top right bottom
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// right wall --------------------------------------------------------------------------------------
  // top right top
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom right top
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom right bottom
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// triangle 2
  // top right top
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // top right bottom
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = 0.8 - wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // bottom right bottom
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// bottom wall -------------------------------------------------------------------------------------
  // bottom right top
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom left top (y, x, z)
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom left bottom
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
// triangle 2
  // bottom right top
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = 0.2;
  manOffset += PartEleCount;
  // bottom right bottom
  circWalls[manOffset+P_POSX] = 0.8 - wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;
  // bottom left bottom
  circWalls[manOffset+P_POSX] = -0.8 + wallBuffer, circWalls[manOffset+P_POSY] = -0.8 + wallBuffer, circWalls[manOffset+P_POSZ] = -0.2;
  manOffset += PartEleCount;  

}



function initVertexBuffersNew(gl) {
//==============================================================================

  if (RenderMode == 0) {
    makeCircuit();
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

  makeCircuit();
  makeCircuitWalls();
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
