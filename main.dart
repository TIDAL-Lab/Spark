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

library SparkProject;

import 'dart:html';
import 'dart:math';
import 'dart:convert';
import 'dart:core';
import 'package:intl/intl.dart'; /* this was used for number format for the AR tags */
import 'dart:web_audio';
import 'dart:js';
//import "package:json_object/json_object.dart";

part 'darts/Touch.dart';
part 'darts/toolbar.dart';
part 'darts/model.dart';
part 'darts/sounds.dart';
part 'darts/slider.dart';
part 'darts/help.dart';
part 'darts/Lens.dart';
part 'darts/connectServer.dart';
part 'circuitAnalysis/Circuit.dart';
part 'circuitAnalysis/Matrix.dart';
part 'circuitAnalysis/LUDecomposition.dart';
part 'circuitAnalysis/QRDecomposition.dart';
part 'circuitAnalysis/KVLSolver.dart';
part 'components/ControlPoint.dart';
part 'components/Component.dart';
part 'components/Wire.dart';
part 'components/Battery.dart';
part 'components/Resistor.dart';
part 'components/Bulb.dart';


App theApp;


void main() {
  
  new App();
  initiate();

}

void initiate() {
  // Load sound effects 
  Sounds.loadSound("crunch");
  Sounds.loadSound("ping");
  Sounds.loadSound("ding");
  
  // update the values of the generic slider, when it is changed 
  InputElement slider = document.querySelector("#generic-slider");
  if (slider != null) {
    slider.onTouchMove.listen((e) => genericSliderTouch(e));
    slider.onTouchEnd.listen((e) => genericChangeValue(double.parse(slider.value)));
  }
}


class App extends TouchManager {

   CanvasRenderingContext2D ctx;
   CanvasElement canvas;

   int width;
   int height;
  
   String id = "circuit";
   List<Component> components;
   List<ControlPoint> controlPoints;
   Circuit circuit;
   Toolbar selectionBar; 
   Toolbar editionBar;
   Model model1;
   Component genericSliderComponent;
   Help help;
   Lens lens;
   int ARTagCounter;
   ImageElement deleteBox;   
   int canvasMargin = 5;
   Rectangle workingBox;
   Rectangle containerBox;

      
   App() {
     
     theApp = this;
     // size of the monitor 
     width = window.innerWidth;
     height = window.innerHeight;
     canvas = document.querySelector("#foreground");
     canvas.width = width;
     canvas.height = height;
     ctx = canvas.getContext("2d");
     
     registerEvents(canvas);     
     window.onResize.listen((evt) => resizeScreen());
     // Add the app itself as a touchable object 
     new Screen();
     circuit = new Circuit();
     components = new List<Component>();
     controlPoints = new List<ControlPoint>();
     selectionBar = new Toolbar(this, "div#selection-toolbar");
     editionBar = new Toolbar(this, "div#edition-toolbar");
     
     model1 = new Model(this, "div#model1");

     lens = new Lens(690, 690);
     help = new Help(1100, 520);

     ARTagCounter = 0;
     
     // delete box 
     deleteBox = new ImageElement();
     deleteBox.src = "images/trash-bin.png";
     deleteBox.onLoad.listen((event) { draw(); });

     num centerX = (width - 530)/2;
     num centerY = height/2;
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);
     components.add(new Battery(centerX - 50, centerY, centerX + 50, centerY, voltage));
    
     var t = 65;
   }
   /* Resize the window
    */
   void resizeScreen() {
     width = window.innerWidth;
     height = window.innerHeight;

     canvas.width = width;
     canvas.height = height;
     
    repaint();
   }

   
   /* Reset the application */
   void reset() {
     ARTagCounter = 0;
     components.clear();
     controlPoints.clear();
     circuit.edges.clear();
     circuit.nodes.clear();
     circuit.updateComponents();
     circuit.sendDataToServer();
     document.querySelector("#model1").style.display = "none";
     document.querySelector("#generic-slider").style.display = "none";
     model1.component = null;
     help.visible = false;
     lens.x = 690;
     lens.y = 690;

     num centerX = workingBox.width/2;
     num centerY = workingBox.height/2;
     /* create the first battery */
     InputElement slider = querySelector("#battery-slider");
     var voltage = double.parse(slider.value);
     components.add(new Battery(centerX - 50, centerY, centerX + 50, centerY, voltage));
   }

   /* Draw */
   void draw() {
     CssRect toolbarRect = document.querySelector("#selection-toolbar").borderEdge; 
     containerBox = new Rectangle(canvasMargin, canvasMargin,width - (4*canvasMargin), toolbarRect.top -(3*canvasMargin));
     workingBox = new Rectangle(canvasMargin, canvasMargin,width - 530, toolbarRect.top -(3*canvasMargin));
     
     ctx.clearRect(0, 0, canvas.width, canvas.height);
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
     ctx.strokeRect(workingBox.left, workingBox.top, workingBox.width, workingBox.height);
     ctx.fillRect(workingBox.left, workingBox.top, workingBox.width, workingBox.height);

     /*
     if (this.gridsOn == true) {
       drawGrids (margin, margin, width - (3*margin), rect.top.toInt() - (2*margin));
     }
     */     
     num boxW = deleteBox.width / 7;
     num boxH = deleteBox.height / 7;
     ctx.drawImageScaled(deleteBox, 2 * canvasMargin, 2*canvasMargin, boxW, boxH);
     
     /* redraw the components */
     for (Component c in components) {
       if (c.visible) c.draw(ctx);
     }
     lens.draw(ctx);
     help.draw(ctx);
     //ctx.restore();
     
   }
   


   static void repaint() {
     /* make the lens on top of all the touchables */
     theApp.removeTouchable(theApp.lens);
     theApp.addTouchable(theApp.lens);
     /* redraw the components of app*/
     theApp.draw();
     //theApp.circuit.sendDataToServer();
   }
   
}


class Screen implements Touchable {

   Screen() {
      theApp.addTouchable(this);
   }

   bool containsTouch(Contact event) {
     return true;
   }

   bool touchDown(Contact event) { 
     document.querySelector("#generic-slider").style.display = "none";
     App.repaint();
     return true;
   }

   void touchUp(Contact event) {
     //App.repaint();
   }

   void touchDrag(Contact event) {
   }

   void touchSlide(Contact event) {

   }
}




