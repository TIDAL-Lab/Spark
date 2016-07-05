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

class Component implements Touchable {  
  String type;
  static int TAG;
  ImageElement img;
  ImageElement ARImg;
  
  num iw;
  num ih;
  num length = 0;  /* length from start to end connectors */

  num dragX = 0; 
  num dragY = 0;
  
  num clickX;
  num clickY;
  
  ControlPoint start;
  ControlPoint end;
  //Edge edge;
  double resistance;
  double current;
  double voltageDrop;
  num direction = 0;

  bool visited = false; /* for moving connected graphs */
  bool visible = true;
  
  RangeInputElement slider; /* control for variables */
  
  Component(this.type, num x0, num y0, num x1, num y1) {
    start = new ControlPoint(x0, y0);
    end = new ControlPoint(x1, y1);
    theApp.controlPoints.add(start);
    theApp.controlPoints.add(end);
    length = sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
    start.myComponent = this;
    start.myConjoint = end;
    end.myComponent = this;
    end.myConjoint = start;
    
    current = 0.0;
    resistance = 0.0;
    voltageDrop = 0.0;
    
    slider = new RangeInputElement() ;
   
    img = new ImageElement();
    ARImg = new ImageElement();
    //setARImgSrc();
    
    theApp.addTouchable(this);
    theApp.components.add(this);
    theApp.circuit.addNewBranch(this);
  }
  
  void setSlider () {   
    theApp.genericSliderComponent = this;
    slider.style.left = "${start.x.toInt()}px";
    slider.style.top = "${start.y.toInt()}px";
    num angle = -atan2(end.x - start.x, end.y - start.y) + PI / 2;

    angle = angle * 180 / PI; //transform to radian
    //print("this is the angle: $angle");
    slider.style.transformOriginX = "0px";
    slider.style.transformOriginY = "0px";
    slider.style.transform = "rotate(${angle}deg) translate(10px, 25px)";
    
    if (this is Battery) {
      slider.min = "2";
      slider.max = "4.0";
      slider.step = "1";
      slider.value = "${this.voltageDrop}";
    }
    else {
      slider.min = "1";
      slider.max = "3.0";
      slider.step = "1";
      slider.value = "${this.resistance}";
    }
    App.repaint();  // reset the slider thumb
    //slider.className = "component-slider";
    //document.querySelector("div#sliders").children.add(slider);
  }

  void setImage(String src) {
    img.src = src;
    /* load the image right away */
    img.onLoad.listen((event) { App.repaint(); }); 
  }


  void draw(CanvasRenderingContext2D ctx) { 
    if (this.type == "Wire") {
      ctx.strokeStyle = "rgba(222, 222, 222, 0.9)"; /* wire shade */
      ctx.lineWidth = 10;      
    }
    else {
      ctx.strokeStyle = "rgba(155,155,155,1)"; /* wire shade */
      ctx.lineWidth = 10;
    }
    
    ctx.beginPath(); 
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    ctx.stroke();
    
    num mx = (start.x + end.x) / 2;
    num my = (start.y + end.y) / 2;

    ctx.save();
    ctx.translate(mx, my);
    num angle = atan2(end.x - start.x, end.y - start.y);
    ctx.rotate(-angle + PI / 2);
    
    drawComponent(ctx);
    
    if (this.type == "Bulb") {
      // draw a juction box for the bulb
      num d2 = (end.x - start.x)*(end.x - start.x)+(end.y - start.y)*(end.y - start.y);
      num d = sqrt(d2);      
      ctx.fillStyle = "rgba(155,155,155,1)";
      ctx.fillRect(-d/2, -5, d, 10);
    }
    /* draw a box containing the component, if its model is launched */
    if (theApp.model.component == this) {
      ctx.fillStyle = "rgba(255,255,0,0.2)";
      if (this is Wire) {
        //var w = min(iw, 80);
        //var sx = theApp.lens.x + (theApp.lens.iw / 2);
        ctx.fillRect(-iw/2, -30, iw, 60);
      }
      else ctx.fillRect(-40, -30, 80, 60);
    }
    ctx.restore();
    
    start.draw(ctx);
    end.draw(ctx);
  }
  
  CanvasRenderingContext2D drawComponent(CanvasRenderingContext2D ctx) {}

  num screenToComponentX(num sx, num sy) {

    num mx = (start.x + end.x) / 2;
    num my = (start.y + end.y) / 2;
    
    var vectorA = [sx-mx, sy-my];
    var vectorB = [start.x - mx, start.y - my];
    // find cx using the dot product of the two vectors 
    num absA = sqrt(vectorA[0]*vectorA[0] + vectorA[1]*vectorA[1]);
    num absB = sqrt(vectorB[0]*vectorB[0] + vectorB[1]*vectorB[1]);
    num cosAlfa = (vectorA[0]*vectorB[0] + vectorA[1]*vectorB[1])/(absA*absB);
    // if cosAlfa > 0 => cx is negative, otherwise is positive 
    num cx = cosAlfa * absA;
    return (-cx);
  }
  
  num screenToComponentY(num sx, num sy) {
    num mx = (start.x + end.x) / 2;
    num my = (start.y + end.y) / 2;
    
    var vectorA = [sx-mx, sy-my];
    var vectorB = [start.x - mx, start.y - my];
    /* find cy using the cross product of the two vectors */
    num absA = sqrt(vectorA[0]*vectorA[0] + vectorA[1]*vectorA[1]);
    num absB = sqrt(vectorB[0]*vectorB[0] + vectorB[1]*vectorB[1]);
    num crossProduct = vectorA[0]*vectorB[1] - vectorA[1]*vectorB[0];
    num sinAlfa = crossProduct/(absA*absB);
    num cy = sinAlfa * absA;
    return (cy);
    
  }

  /** move connected components
   * This is a Breadth-First Graph search
    @param deltaX    
    @param deltaY
  */
  void moveConnectedComponents(num deltaX, num deltaY) {
    List<Component> toBeMoved = this.ConnectedComponents();
    if (toBeMoved.every((c) => c.inBox(deltaX, deltaY))) {
      for (Component c in toBeMoved) {
        c.moveComponent(deltaX, deltaY);
      }
    }
  }
  
  void moveComponent(num deltaX, num deltaY) {
    start.x += deltaX;
    start.y += deltaY;
    end.x += deltaX;
    end.y += deltaY;
    dragX += deltaX;
    dragY += deltaY;
    //if (this.slider != null) this.moveSlider(deltaX, deltaY);
  }
  
  bool inBox(num deltaX, num deltaY) {
    if (start.x + deltaX+10 < theApp.workingBox.width && start.y + deltaY < theApp.workingBox.height 
        && end.x + deltaX+10 < theApp.workingBox.width  && end.y + deltaY < theApp.workingBox.height) {
      return true;
    }
    return false;
    
  }
  
  /* move the slider with me */
  void moveSlider(num deltaX, num deltaY) {
    var oldTop = double.parse(slider.style.top.replaceFirst("px", ""));
    var oldLeft = double.parse(slider.style.left.replaceFirst("px", ""));
    this.slider.style.top = "${(oldTop + deltaY).toInt()}px";
    this.slider.style.left = "${(oldLeft + deltaX).toInt()}px";
  }

  /** remove connected components  */
  void removeConnectedComponents() {
    List<Component> toBeRemoved = this.ConnectedComponents();
    for (Component c in toBeRemoved) {
      c.removeComponent();
    }
  }
  
  void removeComponent() {
    theApp.removeTouchable(this);
    theApp.removeTouchable(this.start);
    theApp.removeTouchable(this.end);
    
    
    theApp.components.remove(this);
    theApp.controlPoints.remove(this.start);
    theApp.controlPoints.remove(this.end);
    theApp.circuit.removeBranch(this); // removing the branch from the circuit should be 
                                      // the last thing to do, as it calls the sendDataToServer function
    
    if (this == theApp.model.component) { // if the model is being shown for this component
//      document.querySelector("#model").style.display = "none";
//      theApp.model.component = null;
      theApp.model.closeModel();
    }
    

  }
  
  /** returns all the connected components
   * This is a Breadth-First Graph search  */
  List<Component> ConnectedComponents() {
    for (Component c in theApp.components) {
      c.visited = false;
    }
    List<Component> queue = new List<Component>();
    List<Component> connectedComponents = new List<Component>();
    queue.add(this);
    this.visited = true;
    while (queue.length > 0) {
     var thisComponent = queue[0];
     queue.removeAt(0);     
     connectedComponents.add(thisComponent);
     if (thisComponent.start.isConnected) {
       for (ControlPoint cp in thisComponent.start.connections) {
         if (!cp.myComponent.visited) {
           queue.add(cp.myComponent);
           cp.myComponent.visited = true;
         }
       }
     }
     if (thisComponent.end.isConnected) {
       for (ControlPoint cp in thisComponent.end.connections) {
         if (!cp.myComponent.visited) {
           queue.add(cp.myComponent);
           cp.myComponent.visited = true;
         }
       }
     }
    }
    return connectedComponents;
  }
  
/* ------------------------
   Touch Events
   The connections are all cleared at touchDown and then made again at touchUp event
   At touchDrag nothing in connections change
 * ------------------------ */
  
  bool containsTouch(Contact event) {
    num tx = event.touchX;
    num ty = event.touchY;
    num cx = screenToComponentX(tx, ty);
    num cy = screenToComponentY(tx, ty);
    num cw = sqrt((start.x - end.x)*(start.x - end.x) + (start.y - end.y)*(start.y - end.y)) - 20;
    num ch = ih;
    return (cx.abs() <= cw/2 && cy.abs() <= ch/2);
  }

  bool touchDown(Contact event) {
      document.querySelector("#generic-slider").style.display = "none";
      dragX = event.touchX;
      dragY = event.touchY;
      
      clickX = event.touchX;
      clickY = event.touchY;
      
      //App.repaint();
      return true;
  }

  void touchUp(Contact event) {
    if (SHOW_LENS) theApp.lens.findComponent();
    /* if the component is over the delete box area, remove it */
    num mx = min(start.x, end.x);
    num my = min(start.y, end.y);
    num boxW = theApp.deleteBoxImg.width / 7;
    num boxH = theApp.deleteBoxImg.height / 7;
    if (mx < boxW && my < boxH) {
      /* remove the component */
      removeConnectedComponents();
      Sounds.playSound("crunch");
      App.repaint();
      if (USE_SERVER) {
        theApp.circuit.sendDataToServer();
      }
      
      return;
    }
    
    
    /* if the component is clicked, show the generic slider */
    //if (clickX == event.touchX && clickY == event.touchY) {
    if ((clickX - event.touchX).abs()<5 && (clickY - event.touchY).abs()<5) {
      this.slider = document.querySelector("#generic-slider");
      if (this is Battery || this is Resistor) {
        this.slider.style.display = "block";
        setSlider();
        App.repaint(); 
      } 
      return;
    }
    
    /* if the lens used to be on top of me, check if still should be  */
    
    /* make a connection, if any */
    num sx = start.x;
    num sy = start.y;   
    num ex = end.x;
    num ey = end.y;

    bool connecting = false; /* to prevent connecting both start and end cps in one drag event */
    if (!start.isConnected) {
      start.makeConnection();
      if (start.isConnected) {
        num deltaX = start.x - sx;
        num deltaY = start.y - sy;
        
        theApp.circuit.collapseNode(start, start.connections.first);
        this.moveConnectedComponents(deltaX, deltaY);
        connecting = true;
      }
    }
    if (!end.isConnected) {
      end.makeConnection();
      //else if (end.connections.isNotEmpty) {
      if ( end.isConnected ) {
        num deltaX = end.x - ex;
        num deltaY = end.y - ey;
        
        theApp.circuit.collapseNode(end, end.connections.first);
        this.moveConnectedComponents(deltaX, deltaY);
      }
    }
    App.repaint();
    //print(USE_SERVER);
    if (USE_SERVER) {
      //print("use server");
      theApp.circuit.sendDataToServer();
    }    
  }

  void touchDrag(Contact event) {
    /* don't let me to be dragged out of the working box */
//    if (dragY > (theApp.workingBox.top + theApp.workingBox.height)) {
//      visible = false;
//    }
    num deltaX = event.touchX - dragX;
    num deltaY = event.touchY - dragY;

    this.moveConnectedComponents(deltaX, deltaY);
    /* redraw everything */
    App.repaint(); 
  }
  
  void touchSlide(Contact event) {

  }
}