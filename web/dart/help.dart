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

class Help {
  ImageElement img;
  ParagraphElement p;
  ParagraphElement p2;
  int page;
  String helpSrc;  // is set in setConditions in App class
  
  Help () {
    img = document.querySelector("#help-image");
    setImage("images/helps/bg.png");   
    
    p = new ParagraphElement();
    p = document.querySelector("#type");
    
    p2 = new ParagraphElement();
    p2 = document.querySelector("#description");
    
    var button = document.querySelector("#page0-button");
    if (button != null) button.onClick.listen((e) => showPage(0));
    
    button = document.querySelector("#page1-button");
    if (button != null) button.onClick.listen((e) => showPage(1));
    
    button = document.querySelector("#page2-button");
    if (button != null) button.onClick.listen((e) => showPage(2));
    
    button = document.querySelector("#page3-button");
    if (button != null) button.onClick.listen((e) => showPage(3));
    
    button = document.querySelector("#back-button");
    if (button != null) button.onClick.listen((e) => back());
    
    button = document.querySelector("#close-help-button");
    if (button != null) button.onClick.listen((e) => close());
  }
  
  //int get index => helpSources.indexOf(img.src);
  
  void draw(CanvasRenderingContext2D ctx) { 
  }
  
  void setImage(String src) {
    img.src = src;
    /* load the image right away */
    img.onLoad.listen((event) { App.repaint(); }); 
  }
  
  void show () {
    this.back();
    var div = document.querySelector("#help");
    div.style.display = "block";
    ButtonElement button = document.querySelector("#help-button");
    button.style.display = "none";
    String type = theApp.model.component.type;
    p.text = "This is a " + type;
    switch (type) {
      case "Battery":
        p2.text = "Battery produces energy (voltage) for a circuit";
        break;
      case "Wire":
        p2.text = "Wire is a conductive material that electrons can move through easily";
        break;
      case "Bulb":
        p2.text = "Light bulb is a type of a resistor that can emit light";
        break;
      case "Resistor":
        p2.text = "A resistor is a conductive material that can slow down the movement of electrons in a circuit";
        break;
    }
  }
  
  void showPage(num page) {
    img.src = helpSrc + "help${page.toString()}.png";
    var div = document.querySelector("#main-page");
    div.style.display = "none";
    
    var button = document.querySelector("#back-button");
    button.style.display = "inline";
  }
  
  void back() {
    img.src = "images/helps/bg.png";
    var button = document.querySelector("#back-button");
    button.style.display = "none";
    
    var div = document.querySelector("#main-page");
    div.style.display = "block";
    

  }
  
//  void next() {
//    if (page < max_pages) {
//      page++;
//      img.src = helpSrc + "help${page.toString()}.png";
//    }
//    App.repaint();    
//  }
//  
//  void back() {
//    if (page > 1){
//      page--;
//      img.src = helpSrc + "help${page.toString()}.png";
//    }
//    App.repaint();    
//  }
//  
  void close() {
    var button = document.querySelector("#help-button");
    button.style.display = "block";
    
    var div = document.querySelector("#help");
    div.style.display = "none";
  }

}