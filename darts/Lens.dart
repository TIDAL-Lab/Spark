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

class Lens implements Touchable {

  num x, y;
  num iw, ih;
  num dragX, dragY;
  ImageElement img;

  Lens(num x, num y) {
    this.x = x;
    this.y = y;
   
    img = new ImageElement();
    setImage("images/magnifier.png");
    
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
    iw = img.width / 2.5;
    ih = img.height / 2.5;
    ctx.drawImageScaled(img, 0, 0, iw, ih);
    ctx.restore();
    }
  
  void findComponent() {
    num mx = x + iw/2;
    num my = y + ih/2;
    if (onComponent(theApp.model1.component, mx, my)) return; /* if it is not on top of the model component */
    else {
      for (Component c in theApp.components) {
        if (onComponent(c, mx, my)) {
          if (c is Wire || c is Resistor || c is Bulb) {
            theApp.model1.launchModel(c);
            return;
          }
        }
      }
  
//      document.query("#model1").style.display = "none";
//      theApp.model1.component = null;
      theApp.model1.closeModel();
    }
  }
  
  bool onComponent(Component c, num mx, num my) { 
    if (c != null) {
      num cx = c.screenToComponentX(mx, my);
      num cy = c.screenToComponentY(mx, my);
      num cw = sqrt((c.start.x - c.end.x)*(c.start.x - c.end.x) + (c.start.y - c.end.y)*(c.start.y - c.end.y)) - 20;
      num ch = ih;
      return (cx.abs() <= cw/2 && cy.abs() <= ch/2);
    }
    return false;
  }
  
/* ------------------------
  Touch Events
* ------------------------ */  
  bool containsTouch(Contact event) {
    num tx = event.touchX;
    num ty = event.touchY;
    if (tx >= x && tx <= x + iw && ty >= y && ty <= y + ih) {
      print("lens contains touch");
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
    findComponent(); 
    App.repaint();
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