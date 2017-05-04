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
int CONDITION = 4;
bool SHOW_MARKER = false;  // AR Marker
bool SHOW_LENS = false;   // Magnifying glass object
bool USE_SERVER = false;
num CANVAS_RATIO = 0.7;
num HELP_RATIO = 0.4;

bool USE_PATTERN = false;


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
   Model model = null;
   
   Component genericSliderComponent; //the component that is tapped on to change its value
   Component webglComponent = null;
   Help help; // the help text
   Lens lens; // the magnifying glass object
   ImageElement deleteBoxImg;   
   int canvasMargin = 0;
   //Rectangle workingBox; // the box for building circuits
   Marker marker;
   num centerX, centerY;
   num workingBoxWidth, workingBoxHeight;
   num frameCenterX, frameCenterY, frameWidth, frameHeight; // the frame that maps the connection to the electron model (condition 3)
   
   int condition = CONDITION;
   bool batteryMarker = false; // a falg to check if there is a battery with marker in the work station
      
   App() {
     theApp = this;
     
     if (condition != 1) context.callMethod('initPubnub', []);
     
     // receiving message from the iframe
     window.onMessage.listen((evt) => receiveMessage(evt));
     
     // size of the monitor 
     canvas = document.querySelector("#foreground");
     ctx = canvas.getContext("2d");
     
     registerEvents(canvas);     
     window.onResize.listen((evt) => resizeScreen()); 
       
     help = new Help();
     
     selectionBar = new Toolbar(this, "div#selection-toolbar");
     editionBar = new Toolbar(this, "div#edition-toolbar");
     
     // initiate delete box 
     deleteBoxImg = new ImageElement();
     deleteBoxImg.src = "images/trash-bin.png";
     deleteBoxImg.onLoad.listen((event) { draw(); });
     
     setConditions();
     
     // instantiate lens and help objects
     if (SHOW_LENS) lens = new Lens(CANVAS_RATIO*canvas.width*3/4, canvas.height/2);
     
     
     setScreen();
       
     // set the sendData helper button
     ButtonElement button = document.querySelector("#sendData-button");
     if (button != null) {
       button.onClick.listen((evt) => this.circuit.sendData());
     }
     

     
     // instantiate the JsAr tag
     if (SHOW_MARKER) marker = new Marker(centerX, centerY);
       
     // create the first battery
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);    
     new Battery(centerX - 50, centerY-100, centerX + 50, centerY-100, voltage); 
     
     if (condition==3 || condition==4) {
       var helpButtons = document.querySelector("#main-page");
       helpButtons.style.display = "none";
     }
   }
   
   void receiveMessage(evt) { // receives message from the iframe
     //window.console.log('circuit received message');
     
     // message is the component ID
     if (evt.data is int) {         
       int index = evt.data;
       if (index == -1) {
         theApp.webglComponent = null;
         theApp.help.show();
       }
       else {
         //theApp.webglComponent = null;
         //theApp.help.show();
         flashValues();
        new Future.delayed(const Duration(milliseconds:100), () {
          Component c = components[index];
          theApp.webglComponent = c;
          theApp.help.show();
        });

        //print("V: ${c.voltageDrop} I: ${c.current} R: ${c.resistance}");
       }
     }
     
     else if (evt.data is String) {
       print(evt.data);
     }
     // message is navigation controls for repositioning the frame
     else if (evt.data is List) {  // evt.data is a JSArray from touch controls
       if (evt.data.length == 1) { // zoom data
         var delta = evt.data[0];
         frameWidth += delta * 0.7;  // before: 1
         frameHeight += delta*0.7;   // before: 0.75
//         frameWidth *= (1 + delta);
//         frameHeight *= (1 + delta);
         repaint();
       }
       else { //evt.data.length is 2 --> pan data
         //print(evt.data.runtimeType.toString());
         frameCenterX += evt.data[0]*0.35; // before: ??
         frameCenterY -= evt.data[1]*0.42;  // before: ??
         repaint();
       }


     }
   }
   
   void setConditions() {
     switch ( condition ) {
       case 1:     // no electron model
         help.helpSrc = "images/helps-control/";
         model = new lumpModel();
         SHOW_LENS = true;
         SHOW_MARKER = false;
         USE_SERVER = false;
         CANVAS_RATIO = 0.65;
         HELP_RATIO = 0.4;
         document.querySelector("#lens-button").style.display = "none";
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
         help.helpSrc ="images/helps-components/";
         model = new webglModel();
         (model as webglModel).launchModel(); 
         SHOW_LENS = false;
         SHOW_MARKER = false;
         USE_SERVER = false;
         CANVAS_RATIO = 0.6;
         HELP_RATIO = 0.4;
//         CANVAS_RATIO = 0.65;
//         HELP_RATIO = 0.3;
         break;
       case 4:
         help.helpSrc ="images/helps-components/";
         model = new Model();  // not really using this
         SHOW_LENS = false;
         USE_PATTERN = false;
         if (!USE_PATTERN) SHOW_MARKER = true; // only one of SHOW_MARKER or USE_PATTERN should be true in this condition.            
         USE_SERVER = true;
         CANVAS_RATIO = 0.75;
         HELP_RATIO = 0.3;
         break;
     }
   }
   
   void setScreen() {
     width = window.innerWidth;
     height = window.innerHeight;
     
     canvas.width = width;
     canvas.height = height;

     var w1 = (width*CANVAS_RATIO).toInt();    
     var w2 = (width*(1-CANVAS_RATIO)).toInt();
     var h2 = (height*(1-HELP_RATIO)).toInt();
     var h3 = (height*(HELP_RATIO)).toInt();
     
     var modelspace = document.querySelector("#model");
     modelspace.style.width = "${w2}px";     
     modelspace.style.height = "${h2}px";
     modelspace.style.left = "${w1}px"; 

     var toolbar = document.querySelector("#edition-toolbar");
     toolbar.style.right = "${w2}px";
     
     var div = document.querySelector("#help");
     div.style.top = "${h2}px";
     div.style.width = "${w2}px";
     div.style.height = "${h3}px";
     
     var button = document.querySelector("#help-button");
     button.style.left = "${w2*1.5/5}px";
     button.style.top = "${h2+50}px";
     
     var ratio;
     if (condition == 4) ratio = 0.6;
     else if (condition == 3) ratio = 0.5;
     else if (condition == 1) ratio = 1;
     
     var img = document.querySelector("#help-image");
     img.style.width = "${w2*ratio}px";
     img.style.height = "${h3}px";

       
     div = document.querySelector("#help-window");
     div.style.width = "${w2*(1-ratio)}px";
     div.style.height = "${h3}px";

     
     // set the working box
     //set the working box
     CssRect toolbarRect = document.querySelector("#selection-toolbar").borderEdge;
     workingBoxWidth = CANVAS_RATIO*canvas.width;
     workingBoxHeight = toolbarRect.top;
     centerX = workingBoxWidth / 2;
     centerY = workingBoxHeight / 2;
     
     // set the frame, only for non-AR condition
     frameCenterX = centerX;
     frameCenterY = centerY;
     frameWidth = w2;
     frameHeight = h2;     
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
     
     setScreen();
     if (SHOW_LENS) {
       lens.x = CANVAS_RATIO*canvas.width*3/4; // fix later
       lens.y = canvas.height/2; // fix later
     }

     centerX = workingBoxWidth/2;
     centerY = workingBoxHeight/2;
     
   
     // reset the sliders
     InputElement slider1 = document.querySelector("#battery-slider");
     slider1.value = "2.0";
     querySelector("#battery-value").text = "Voltage = 2";
     InputElement slider2 = document.querySelector("#resistor-slider");
     slider2.value = "1.0";
     querySelector("#resistor-value").text = "Resistance = 1";
     
     model.resetModel();
     
     /* create the first battery */
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);
     new Battery(centerX - 50, centerY-100, centerX + 50, centerY-100, voltage);    
     
   }

   /* Draw */
   void draw() {
     ctx.clearRect(0, 0, canvas.width, canvas.height);

     ctx.strokeStyle = 'white';
     ctx.lineWidth = 2;
     ctx.fillStyle = "rgba(255,255,255,0.2)";
     ctx.strokeRect(0, 0, workingBoxWidth, workingBoxHeight);
     ctx.fillRect(0, 0, workingBoxWidth, workingBoxHeight);

     //draw the frame
     if (condition == 3) {
       //ctx.strokeStyle = 'transparent';
       ctx.strokeStyle = "rgba(255,255,255,0.2)";
       ctx.lineWidth = 2;
       ctx.fillStyle = "rgba(255,255,255,0.2)";
  
       ctx.strokeRect(frameCenterX - frameWidth/2, frameCenterY - frameHeight/2, frameWidth, frameHeight);
       ctx.fillRect(frameCenterX - frameWidth/2, frameCenterY - frameHeight/2, frameWidth, frameHeight);
     }
     
     num boxW = deleteBoxImg.width / 6;
     num boxH = deleteBoxImg.height / 6;
     // commented: the image is changed to a button for the purpose of hidden send data behind the curtain!
     //ctx.drawImageScaled(deleteBoxImg, 5, 5, boxW, boxH);
     

     
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
     if (SHOW_MARKER) {
            theApp.removeTouchable(theApp.marker);
            theApp.addTouchable(theApp.marker);
     }
     
     /* redraw the components of app*/
     theApp.draw();
     
   }
   
   
 

}
