/*
* Spark: Agent-based electrical circuit environment
* Copyright (c) 2013 Elham Beheshti
*
*       Elham Beheshti (beheshti@u.northwestern.edu)
*       Northwestern University, Evanston, IL
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License (version 2) as
* published by the Free Software Foundation.
*
* This program is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
* General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/

part of SparkProject;

/* 
 * condition is the study condition
 * 1 --> control condition: only circuit, no ABM model
 * 2 --> ABM + circuit model, with the NetTango model embedded in the canvas
 * 3 --> webgl nonAR: circuit model on the same screen
 * 4 --> webgl AR
 */
int CONDITION = 3;
bool SHOW_MARKER = false;  // AR Marker
bool SHOW_LENS = false;   // Magnifying glass object
bool USE_SERVER = false;
num CANVAS_RATIO = 0.65;
num HELP_RATIO = 0.45;

class App extends TouchManager {

   CanvasRenderingContext2D ctx;
   CanvasElement canvas;   

   int width;
   int height;
  
   String id = "circuit";
   List<Component> components = new List<Component>();
   List<ControlPoint> controlPoints = new List<ControlPoint>();
   Circuit circuit = new Circuit();
   Toolbar selectionBar; 
   Toolbar editionBar;
   Model model;
   
   Component genericSliderComponent; //the component that is tapped on to change its value
   Component webglComponent = null;
   Help help; // the help text
   Lens2 lens; // the magnifying glass object
   ImageElement deleteBoxImg;   
   int canvasMargin = 0;
   Rectangle workingBox; // the box for building circuits
   //Rectangle containerBox;
   Marker marker;
   num centerX, centerY;
   num frameCenterX, frameCenterY, frameWidth, frameHeight;
   
   int condition = CONDITION;
   
      
   App() {
     theApp = this;
     
     // receiving message from the iframe
     window.onMessage.listen((evt) => receiveMessage(evt));
     
     // size of the monitor 
     canvas = document.querySelector("#foreground");
     ctx = canvas.getContext("2d");
     
     registerEvents(canvas);     
     window.onResize.listen((evt) => resizeScreen()); 
       
     help = new Help();
     setScreen();
     
     selectionBar = new Toolbar(this, "div#selection-toolbar");
     editionBar = new Toolbar(this, "div#edition-toolbar");
     
     
     setConditions();     
     
     //set the working box
     CssRect toolbarRect = document.querySelector("#selection-toolbar").borderEdge;
     workingBox = new Rectangle(0, 0, CANVAS_RATIO*canvas.width, toolbarRect.top);
     centerX = workingBox.width / 2;
     centerY = workingBox.height / 2;
     
     // set the frame
     frameCenterX = workingBox.width/2;
     frameCenterY = workingBox.height/2;
     frameWidth = 450;
     frameHeight = 350;
     
     // initiate delete box 
     deleteBoxImg = new ImageElement();
     deleteBoxImg.src = "images/trash-bin.png";
     deleteBoxImg.onLoad.listen((event) { draw(); });
     
     // instantiate lens and help objects
     if (SHOW_LENS) {
       //if (condition == 1) lens = new Lens(CANVAS_RATIO*canvas.width*3/4, canvas.height/2);
       if (condition == 3) lens = new Lens2(CANVAS_RATIO*canvas.width*3/4, canvas.height/2);
     }
       
     // create the first battery
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);    
     new Battery(centerX - 50, centerY, centerX + 50, centerY, voltage); 
     
     if (condition == 3) {  // because condition 1 & 2 has input variables for launchmodel(component)
       (model as webglModel).launchModel();  
       print("condition 3");
     }
   }
   
   void receiveMessage(evt) {
     window.console.log('circuit received message');
     if (evt.data is int) {         
       int index = evt.data;
       Component c = components[index];
       theApp.webglComponent = c;
       theApp.help.show();
       //print("V: ${c.voltageDrop} I: ${c.current} R: ${c.resistance}");
     }
     else if (evt.data is String) {
       print(evt.data);
     }
     else if (evt.data is List) {  // evt.data is a JSArray from touch controls
       if (evt.data.length == 1) { // zoom data
         var delta = evt.data[0] * 0.005;
         //frameWidth *= (1 + delta);
         //frameHeight *= (1 + delta);
         //repaint();
       }
       else { //evt.data.length is 2 --> pan data
         //print(evt.data.runtimeType.toString());
         frameCenterX += evt.data[0]; 
         frameCenterY -= evt.data[1];
         repaint();
       }


     }
   }
   
   void setScreen() {
     width = window.innerWidth;
     height = window.innerHeight;
     
     //canvas.width = (width*CANVAS_RATIO).toInt();
     canvas.width = width;
     canvas.height = height;
     

     
//     var workspace = document.querySelector("#workspace");
     var w1 = (width*CANVAS_RATIO).toInt();
//     var h1 = height.toInt();
//     workspace.style.width = "${w1}px";
//     workspace.style.height = "${h1}px";
//     
     var modelspace = document.querySelector("#model");
     var w2 = (width*(1-CANVAS_RATIO)).toInt();
     var h2 = (height*(1-HELP_RATIO)).toInt();
     modelspace.style.width = "${w2}px";     
     modelspace.style.height = "${h2}px";
     modelspace.style.left = "${w1}px"; 
//     
//     var textspace = document.querySelector("#help");
     var h3 = (height*(HELP_RATIO)).toInt();
//     textspace.style.width = "${w2}px";
//     textspace.style.height = "${h3-20}px";
//     textspace.style.left = "${w1}px";
//     textspace.style.top = "${h2+10}px";
//     
//     canvas2.width = w2;
//     canvas2.height = h3;
//     
     
     var toolbar = document.querySelector("#edition-toolbar");
     toolbar.style.right = "${w2}px";
     
     var div = document.querySelector("#help");
     div.style.top = "${h2}px";
     div.style.width = "${w2}px";
     div.style.height = "${h3}px";
     
     var button = document.querySelector("#help-button");
     button.style.left = "${w2*1.5/5}px";
     button.style.top = "${h2+50}px";
     
     var img = document.querySelector("#help-image");
     img.style.width = div.style.width;
     img.style.height = div.style.height;
     
//     help.x = w1+50;
//     help.y = h2+10;
     
   }
   
   void setConditions() {
     switch ( condition ) {
       case 1:     // no electron model
         help.helpSrc = "images/helps-control/";
         model = new lumpModel();
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = false;
         //CANVAS_RATIO = 0.65;
         //HELP_RATIO = 0.1;
         document.querySelector("#lens-button").style.background = "transparent";
         document.querySelector("#page0-button").style.display = "none";
         break;
       case 2:
         help.helpSrc ="images/helps/";
         model = new agentModel();
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = false;
         break;
       case 3:
         help.helpSrc ="images/helps/";
         model = new webglModel();
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = true;
         CANVAS_RATIO = 0.55;
         HELP_RATIO = 0.4;
         theApp.setScreen();
         break;
       case 4:
         help.helpSrc ="images/helps/";
         model = new lumpModel();
         // instantiate the JsAr tag
         marker = new Marker(centerX, centerY);
         SHOW_LENS = true;
         SHOW_MARKER = true;
         USE_SERVER = true;
         break;
     }
   }
   
   
   /* Resize the window
    */
   void resizeScreen() { 
    setScreen();   
    repaint();
   }

   
   /* Reset the application */
   void reset() {
     components.clear();
     controlPoints.clear();
     circuit.edges.clear();
     circuit.nodes.clear();
     circuit.updateComponents();
     document.querySelector("#model").style.display = "none";
     document.querySelector("#generic-slider").style.display = "none";
     model.reset();
     setScreen();
     if (SHOW_LENS) {
       lens.x = CANVAS_RATIO*canvas.width*3/4; // fix later
       lens.y = canvas.height/2; // fix later
     }

     centerX = workingBox.width/2;
     centerY = workingBox.height/2;
     
     frameCenterX = workingBox.width/2;
     frameCenterY = workingBox.height/2;
     frameWidth = 450;
     frameHeight = 350;
     
     // reset the sliders
     InputElement slider1 = document.querySelector("#battery-slider");
     slider1.value = "2.0";
     querySelector("#battery-value").text = "Voltage = 2";
     InputElement slider2 = document.querySelector("#resistor-slider");
     slider2.value = "1.0";
     querySelector("#resistor-value").text = "Resistance = 1";
     
     /* create the first battery */
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);
     new Battery(centerX - 50, centerY, centerX + 50, centerY, voltage);
   }

   /* Draw */
   void draw() {
     CssRect toolbarRect = document.querySelector("#selection-toolbar").borderEdge; 
     workingBox = new Rectangle(0, 0, CANVAS_RATIO*canvas.width, toolbarRect.top);   
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     //ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
     /*
     ctx.save();
     ctx.fillStyle = "rgba(250,250,250,0.8)";
     ctx.textAlign = 'left';
     ctx.textBaseline = 'top';
     ctx.font = '34px sans-serif'; /* other fonts: verdana */
     ctx.fillText("SPARK", 20, 20);
      */
     
     ctx.strokeStyle = 'white';
     ctx.lineWidth = 2;
     ctx.fillStyle = "rgba(255,255,255,0.2)";
     ctx.strokeRect(theApp.workingBox.left, theApp.workingBox.top, theApp.workingBox.width, theApp.workingBox.height);
     ctx.fillRect(theApp.workingBox.left, theApp.workingBox.top, theApp.workingBox.width, theApp.workingBox.height);

     // draw the frame
     if (condition == 3) {
       ctx.strokeStyle = 'yellow';
       ctx.lineWidth = 2;
       ctx.fillStyle = "rgba(255,255,255,0.2)";
  
       ctx.strokeRect(frameCenterX - frameWidth/2, frameCenterY - frameHeight/2, frameWidth, frameHeight);
       ctx.fillRect(frameCenterX - frameWidth/2, frameCenterY - frameHeight/2, frameWidth, frameHeight);
     }
     
     num boxW = deleteBoxImg.width / 6;
     num boxH = deleteBoxImg.height / 6;
     ctx.drawImageScaled(deleteBoxImg, 5, 5, boxW, boxH);
     

     
     /* redraw the components */
     for (Component c in components) {
       if (c.visible) c.draw(ctx);
     }
     if (SHOW_LENS) lens.draw(ctx); 
     if (SHOW_MARKER) { marker.draw(ctx); }
     //ctx.restore();
   }
   


   static void repaint() {
     /* make the lens on top of all the touchables */
     if (SHOW_LENS) {
       theApp.removeTouchable(theApp.lens);
       theApp.addTouchable(theApp.lens);
     }
     
     /* redraw the components of app*/
     theApp.draw();
     
   }
   
   
 

}
