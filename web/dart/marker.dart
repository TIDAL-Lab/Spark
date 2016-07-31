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

class Marker implements Touchable {

  num x, y;
  num iw, ih;
  num dragX, dragY;
  ImageElement img;

  Marker(num x, num y) {
    this.x = x;
    this.y = y;
   
    img = new ImageElement();
    setImage("images/marker2.png");
    
    theApp.addTouchable(this);
  }
  void setImage(String src) {
    img.src = src;
    /* load the image right away */
    img.onLoad.listen((event) { App.repaint(); }); 
  }
  
  void draw(CanvasRenderingContext2D ctx) { 
    ctx.beginPath(); 
    ctx.save();
    ctx.translate(this.x, this.y);
    
//    num centerX = theApp.workingBoxWidth / 2;
//    num centerY = theApp.workingBoxHeight / 2;
    iw = img.width / 6;
    ih = img.height / 6;
//    ctx.drawImageScaled(img, centerX-markerW/2, centerY-markerH/2, markerW, markerH);
    ctx.drawImageScaled(img, 0, 0, iw, ih);
    ctx.restore();
    }
  
/* ------------------------
  Touch Events
* ------------------------ */  
  bool containsTouch(Contact event) {
    num tx = event.touchX;
    num ty = event.touchY;
    if (tx >= x && tx <= x + iw && ty >= y && ty <= y + ih) {
      //print("lens contains touch");
    }
    return (tx >= x && tx <= x + iw && ty >= y && ty <= y + ih);
  }
 
  bool touchDown(Contact event){
    dragX = event.touchX;
    dragY = event.touchY;    
    //App.repaint();
    return true;
  }
   
  void touchUp(Contact event){
    /* if the lens is over component launch its model */
    //findComponent(); 
    App.repaint();
    theApp.circuit.sendDataToServer();
  }
   
  // This gets fired only after a touchDown lands on the touchable object
  void touchDrag(Contact event) {
    num deltaX = event.touchX - dragX;
    num deltaY = event.touchY - dragY;

    dragX += deltaX;
    dragY += deltaY;
    this.x += deltaX;
    this.y += deltaY;
    //this.move(deltaX, deltaY);
    /* redraw everything */
    App.repaint(); 
  }
   
  // This gets fired when an unbound touch events slides over an object
  void touchSlide(Contact event) {
    
  }

}