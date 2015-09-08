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

class Help implements Touchable {
  num x,y;
  num dragX, dragY;
  num clickX, clickY;
  num iw, ih;
  ImageElement img;
  int number, max;
  bool visible = false;
  String helpSrc;
  Help (num x, num y) {
    this.x = x;
    this.y = y;

    img = new ImageElement();
    if (theApp.condition == 0) {
      helpSrc = "images/helps-control/";
    }
    else {
      helpSrc ="images/helps/";
    }
    String temp = helpSrc +"bg.png";
    setImage(temp);
    
    theApp.addTouchable(this);
    
  }
  
  //int get index => helpSources.indexOf(img.src);
  
  void draw(CanvasRenderingContext2D ctx) { 
    if (this.visible) {
      ctx.beginPath(); 
      ctx.save();
      ctx.translate(this.x, this.y);
      iw = img.width / 2.5;
      ih = img.height / 2.5;
      ctx.drawImageScaled(theApp.help.img, 5, 0, iw, ih);
      ctx.restore();
    }
  }
  
  void setImage(String src) {
    img.src = src;
    /* load the image right away */
    img.onLoad.listen((event) { App.repaint(); }); 
  }
  
  void initiate () {
    //visible = true;
    //img.src = "images/helps/bg.png";
    //App.repaint();
  }
  
  void show () {
    ButtonElement button = document.getElementsByClassName("help-button").first;
    button.style.display = "none";
    visible = true;
    img.src = helpSrc + "help1.png";
    number = 1;
    App.repaint();
  }
  
  void next() {
    if (theApp.condition==0) {
      max = 3;
    }
    else {
      max = 4;
    }
    if (number != max) {
      number++;
      img.src = helpSrc + "help${number.toString()}.png";
    }
    App.repaint();    
  }
  
  void back() {
    if (number != 1){
      number--;
      img.src = helpSrc + "help${number.toString()}.png";
    }
    App.repaint();    
  }
  
  void close() {
    visible = false;
    App.repaint();  
    //ButtonElement button = document.query("model1 .help-button");
    ButtonElement button = document.getElementsByClassName("help-button").first;
    button.style.display = "block";
  }
  /* ------------------------
  Touch Events
* ------------------------ */  
  bool containsTouch(Contact event) {
    if (visible) {
      num tx = event.touchX;
      num ty = event.touchY;
      if (tx >= x && (tx <= x + iw) && ty >= y && (ty <= y + ih)) {
        print("lens contains touch");
      }
      return (tx >= x && tx <= x + iw && ty >= y && ty <= y + ih);
    }
    return false;
  }
 
  bool touchDown(Contact event){
    dragX = event.touchX;
    dragY = event.touchY; 
    
    clickX = event.touchX;
    clickY = event.touchY;
    
    //App.repaint();
    return true;
  }
   
  void touchUp(Contact event){
    /* if it is clicked, take an action if the click is on a button */
    if (clickX == event.touchX && clickY == event.touchY) {
      /* is it on next? */
      if (clickX > (x + 0.8 * iw) && clickX <= (x + iw) && clickY > (y + 0.8 * ih) && clickY <= (y + ih)) {
        this.next();
      }
      /* is it on back? */
      if (clickX > (x + 0.6 * iw) && clickX <= (x + 0.8 * iw) && clickY > (y + 0.8 * ih) && clickY <= (y + ih)) {
        this.back();
      }
      /* is it on close? */
      if (clickX > (x + 0.45 * iw) && clickX <= (x + 0.6 * iw) && clickY > (y + 0.8 * ih) && clickY <= (y + ih)) {
        this.close();
        initiate();
        visible = false;
      }
    }
  }
  
  void touchDrag(Contact event) {
    /*
    num deltaX = event.touchX - dragX;
    num deltaY = event.touchY - dragY;

    dragX += deltaX;
    dragY += deltaY;
    this.x += deltaX;
    this.y += deltaY;
    //this.move(deltaX, deltaY);
    /* redraw everything */
    App.repaint(); 
    */
  }
   
  void touchSlide(Contact event) {}
  
  
}