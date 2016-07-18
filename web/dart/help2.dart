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
  int page, max_pages;
  bool visible = false;
  String helpSrc;  // is set in setConditions in App class
  
  Help (num x, num y) {
    this.x = x;
    this.y = y;

    img = new ImageElement();
    setImage("images/helps/bg.png");    
    theApp.addTouchable(this);
    
  }
  
  //int get index => helpSources.indexOf(img.src);
  
  void draw(CanvasRenderingContext2D ctx) { 
    if (this.visible) {
      ctx.beginPath(); 
      ctx.save();
      ctx.translate(this.x, this.y);
      iw = img.width / 3;
      ih = img.height / 3;
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
//    visible = true;
//    img.src = "images/helps/help1.png";
//    App.repaint();
  }
  
  void show () {
    ButtonElement button = document.querySelector("#help-button");
    button.style.display = "none";
    visible = true;
    //img.src = helpSrc + "help1.png";
    page = 1;
    App.repaint();
  }
  
  void next() {
    if (page < max_pages) {
      page++;
      img.src = helpSrc + "help${page.toString()}.png";
    }
    App.repaint();    
  }
  
  void back() {
    if (page > 1){
      page--;
      img.src = helpSrc + "help${page.toString()}.png";
    }
    App.repaint();    
  }
  
  void close() {
    visible = false;
    App.repaint();  
    ButtonElement button = document.querySelector("#help-button");
    //ButtonElement button = document.getElementsByClassName("help-button").first;
    button.style.display = "block";
  }
  /* ------------------------
  Touch Events
* ------------------------ */  
  bool containsTouch(Contact event) {
    if (visible) {
      num tx = event.touchX;
      num ty = event.touchY;
//      if (tx >= x && (tx <= x + iw) && ty >= y && (ty <= y + ih)) {
//        print("help contains touch");
//        
//      }
//      
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
    
    if ((clickX - event.touchX).abs()<10 && (clickY - event.touchY).abs()<10) {
//      print(clickX);
//      print(event.touchX);
      /* is it on next? */
      if (clickX > (x + 0.8 * iw) && clickX <= (x + iw) && clickY > (y + 0.5 * ih) && clickY <= (y + ih)) {
        this.next();
      }
      /* is it on back? */
      if (clickX > (x + 0.6 * iw) && clickX <= (x + 0.8 * iw) && clickY > (y + 0.5 * ih) && clickY <= (y + ih)) {
        this.back();
      }
      /* is it on close? */
      if (clickX > (x + 0.45 * iw) && clickX <= (x + 0.6 * iw) && clickY > (y + 0.5 * ih) && clickY <= (y + ih)) {
        this.close();
        initiate();
        visible = false;
      }
    }
  }
  
  void touchDrag(Contact event) {
//    print("touch drag");
//    num deltaX = event.touchX - dragX;
//    num deltaY = event.touchY - dragY;
//
//    dragX += deltaX;
//    dragY += deltaY;
//    this.x += deltaX;
//    this.y += deltaY;
//    //this.move(deltaX, deltaY);
//    /* redraw everything */
//    App.repaint(); 

  }
   
  void touchSlide(Contact event) {}
  
  
}