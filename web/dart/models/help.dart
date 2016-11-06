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
  ParagraphElement p3;
  int page;
  String helpSrc;  // is set in setConditions in App class
  
  Help () {
    img = document.querySelector("#help-image");
    setImage("images/helps-components/help0.png");   
      
    p = new ParagraphElement();
    p = document.querySelector("#type");
    
    p2 = new ParagraphElement();
    p2 = document.querySelector("#description");
    
    p3 = new ParagraphElement();
    p3 = document.querySelector("#valuesText");
    
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
    if (theApp.model.component != null) {
      Component c = theApp.model.component;
      String type = c.type;
      //p.text = "This is a " + type;
      switch (type) {
        case "Battery":
          //p2.text = "Battery produces energy (voltage) for a circuit";
          p2.text = "";
          break;
        case "Wire":
          //p2.text = "Wire is a conductive material that electrons can move through easily";
          p2.text ="";
          break;
        case "Bulb":
          p2.text = "Light bulb is a type of a resistor that can emit light";
          break;
        case "Resistor":
          p2.text = "A resistor is a conductive material that can slow down the movement of electrons in a circuit";
          break;
      }
    }
    
    else if (theApp.webglComponent != null) {
      
      Component c = theApp.webglComponent;
      String type = c.type;
      var iFormated = c.current.toStringAsPrecision(3);
      var vFormated = c.voltageDrop.toStringAsPrecision(3);
      var rFormated = c.resistance.toStringAsPrecision(1);
      var brightness = c.current/0.3;
      var bFormated = brightness.toStringAsPrecision(2);
      
//      p.text = "This is a " + type;
//      switch (type) {
//        case "Battery":
//          p2.text = "Battery produces energy (voltage) for a circuit";
//          break;
//        case "Wire":
//          p2.text = "Wire is a conductive material that electrons can move through easily";
//          break;
//        case "Bulb":
//          p2.text = "Light bulb is a type of a resistor that can emit light";
//          break;
//        case "Resistor":
//          p2.text = "Resistor is a conductive material that can slow down the movement of electrons in a circuit";
//          break;
//      }
      
      switch (type) {
        case "Wire":
          showPage(0);
          break;
        case "Battery":
          showPage(1);
          break;
        case "Resistor":
          showPage(2);
          break;
        case "Bulb":
          showPage(3);
          break;
      }
      
//      if (c.type == "Battery") p3.text = "Current=${iFormated} Resistance=${rFormated} Voltage=${vFormated}" ;
//      else if (c.type == "Bulb") p3.text = "Current=${iFormated} Resistance=${rFormated} Brightness=${bFormated}" ;
//      else p3.text = "Current=${iFormated} Resistance=${rFormated}" ;
      showValues(c.type, vFormated, iFormated, rFormated, bFormated);
    }
    
    else { // component is null
//      p.text = "";
//      p2.text = "";
//      p3.text = "";
      clearValues();
      
    }

  }
  
  void showPage(num page) {
    img.src = helpSrc + "help${page.toString()}.png";
    var div = document.querySelector("#main-page");
    div.style.display = "none";
    
//    var button = document.querySelector("#back-button");
//    button.style.display = "inline";
  }
  
  void back() {
    img.src = "images/helps-components/help0.png";
    var button = document.querySelector("#back-button");
    button.style.display = "none";
    
//    var div = document.querySelector("#main-page");
//    div.style.display = "block";
    

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

void showValues(type, v, i, r, b) {
  //print("showing the values");
  
  var p = document.querySelector("#description");
  p.text = "";
  
  p = document.querySelector("#comp-type");
  p.text = type;

  p = document.querySelector("#current-value");
  p.text = "Current = " + i.toString();

  p = document.querySelector("#resistance-value");
  p.text = "Resistance = " + r.toString();

  p = document.querySelector("#voltage-value");
  if (type == 'Battery') p.text = "Voltage = " + v.toString();
  //else p.innerHTML = "Voltage Drop = " + vFormated.toString();
  else p.text = "";

  p = document.querySelector("#brightness-factor");
  if (type == "Bulb") {   
    p.text = "Brightness Factor = " + b.toString();
  }
  else {
    p.text = "";
  }
}
 
void clearValues() {
  //print("clear the values");
  var p = document.querySelector("#comp-type");
  //p.text = "Tap on a component to see its measures";
  p.text = "";
  
  p = document.querySelector("#description");
  p.text = "Tap on a component above to learn more about it!";
  
  p = document.querySelector("#current-value");
  p.text = "";

  p = document.querySelector("#resistance-value");
  p.text = "";

  p = document.querySelector("#voltage-value");
  p.text = "";

  p = document.querySelector("#brightness-factor");
  p.text = "";
 
}

void flashValues() {
  //print("clear the values");
  var p = document.querySelector("#comp-type");
  //p.text = "Tap on a component to see its measures";
  p.text = "";
  
//  p = document.querySelector("#description");
//  p.text = "Tap on a component above to learn more about it!";
  
  p = document.querySelector("#current-value");
  p.text = "";

  p = document.querySelector("#resistance-value");
  p.text = "";

  p = document.querySelector("#voltage-value");
  p.text = "";

  p = document.querySelector("#brightness-factor");
  p.text = "";
 
}
