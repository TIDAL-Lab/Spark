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
 * 3 --> webgl non-AR
 * 4 --> webgl AR
 * 5 --> webgl + circuit model on the same screen
 */
int CONDITION = 1;
bool SHOW_MARKER = false;  // AR Marker
bool SHOW_LENS = false;   // Magnifying glass object
bool USE_SERVER = false;
num CANVAS_RATIO = 0.65;
num HELP_RATIO = 0.55;

class App extends TouchManager {

   CanvasRenderingContext2D ctx;
   CanvasElement canvas;
   
   CanvasRenderingContext2D ctx2;
   CanvasElement canvas2;
   

   int width;
   int height;
  
   String id = "circuit";
   List<Component> components;
   List<ControlPoint> controlPoints;
   Circuit circuit;
   Toolbar selectionBar; 
   Toolbar editionBar;
   var model;
   
   Component genericSliderComponent; //the component that is tapped on to change its value
   Help help; // the help text
   Lens lens; // the magnifying glass object
   ImageElement deleteBoxImg;   
   int canvasMargin = 0;
   Rectangle workingBox; // the box for building circuits
   //Rectangle containerBox;
   Marker marker;
   num centerX, centerY;
   
   int condition = CONDITION;
      
   App() {
     theApp = this;
     
     // size of the monitor 
     canvas = document.querySelector("#foreground");
     ctx = canvas.getContext("2d");
     
     //canvas2 = document.querySelector("#help-canvas");
     //ctx2 = canvas2.getContext("2d");
     help = new Help(100, 100);
     setScreen();
     
     registerEvents(canvas);     
     window.onResize.listen((evt) => resizeScreen());
     // Add the app itself as a touchable object 

     circuit = new Circuit();
     components = new List<Component>();
     controlPoints = new List<ControlPoint>();
     selectionBar = new Toolbar(this, "div#selection-toolbar");
     editionBar = new Toolbar(this, "div#edition-toolbar");
     
     
     setConditions();
     // initiate delete box 
     deleteBoxImg = new ImageElement();
     deleteBoxImg.src = "images/trash-bin.png";
     deleteBoxImg.onLoad.listen((event) { draw(); });
     
     //set the working box
     CssRect toolbarRect = document.querySelector("#selection-toolbar").borderEdge;
     workingBox = new Rectangle(0, 0, CANVAS_RATIO*canvas.width, toolbarRect.top);
     centerX = workingBox.width / 2;
     centerY = workingBox.height / 2;
     
     // instantiate lens and help objects
     if (SHOW_LENS) lens = new Lens(CANVAS_RATIO*canvas.width*3/4, canvas.height/2);
     
     // create the first battery
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);    
     new Battery(centerX - 50, centerY - 50, centerX + 50, centerY - 50, voltage);     
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
     var helpButton = document.querySelector("#help-button");
     helpButton.style.left = "${w2/2-120}px";
     helpButton.style.top = "${h2+50}px";
     
     var toolbar = document.querySelector("#edition-toolbar");
     toolbar.style.right = "${w2}px";
     
     help.x = w1+50;
     help.y = h2+10;
     
   }
   
   void setConditions() {
     switch ( condition ) {
       case 1:     // no electron model
         help.max_pages = 3;
         help.helpSrc = "images/helps-control2/";
         model = new lumpModel("div#model");
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = false;
         document.querySelector("#lens-button").style.background = "transparent";
         break;
       case 2:
         help.max_pages = 4;
         help.helpSrc ="images/helps/";
         model = new agentModel("div#model");
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = false;
         break;
       case 3:
         help.max_pages = 4;
         help.helpSrc ="images/helps/";
         model = new lumpModel("div#model");
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = true;
         break;
       case 4:
         help.max_pages = 4;
         help.helpSrc ="images/helps/";
         model = new lumpModel("div#model");
         // instantiate the JsAr tag
         marker = new Marker(centerX, centerY);
         SHOW_LENS = true;
         SHOW_MARKER = true;
         USE_SERVER = true;
         break;
       case 5:
         help.max_pages = 4;
         help.helpSrc ="images/helps/";
         model = new webglModel("div#model");
         SHOW_LENS = false;
         SHOW_MARKER = false;
         USE_SERVER = true;
         CANVAS_RATIO = 0.55;
         HELP_RATIO = 0.4;
         theApp.setScreen();
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
     model.component = null;
     help.visible = false;
     setScreen();
     if (SHOW_LENS) {
       lens.x = CANVAS_RATIO*canvas.width*3/4; // fix later
       lens.y = canvas.height/2; // fix later
     }

//     centerX = workingBox.width/2;
//     centerY = workingBox.height/2;
     
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

     num boxW = deleteBoxImg.width / 7;
     num boxH = deleteBoxImg.height / 7;
     ctx.drawImageScaled(deleteBoxImg, 2 * canvasMargin, 2*canvasMargin, boxW, boxH);
     

     
     /* redraw the components */
     for (Component c in components) {
       if (c.visible) c.draw(ctx);
     }
     if (SHOW_LENS) lens.draw(ctx);
     help.draw(ctx); 
     if (SHOW_MARKER) { marker.draw(ctx); }
     //ctx.restore();
     //help.draw(ctx2);
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
