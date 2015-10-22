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


class Toolbar {

  
  App app;
  String id; // html id for toolbar div tag
  Random rand = new Random();
   
  Toolbar(this.app, String id) {
    
    num centerX = app.width / 2;
    num centerY = app.height / 2;
    
    num w = app.width;
    num h = app.height;
    
    ButtonElement button;
    
    button = document.querySelector("$id #battery-button");
    if (button != null) {
      CssRect rect = button.borderEdge;
      //button.onMouseDown.listen((evt) => createComponent(rect, "Battery"));
      button.onTouchStart.listen((evt) => createComponent(rect, "Battery"));
      
    }
  
    button = document.querySelector("$id #wire-button"); /* do not remove $id, it causes some errors! */
    if (button != null) {
      CssRect rect = button.borderEdge;
      //button.onMouseDown.listen((evt) => createComponent(rect, "Wire"));
      button.onTouchStart.listen((evt) => createComponent(rect, "Wire"));
    }
    
    button = document.querySelector("$id #resistor-button");
    if (button != null) {
      CssRect rect = button.borderEdge;
      //button.onMouseDown.listen((evt) => createComponent(rect, "Resistor"));
      button.onTouchStart.listen((evt) => createComponent(rect, "Resistor"));
    }
    
    button = document.querySelector("$id #bulb-button");
    if (button != null) {
      CssRect rect = button.borderEdge;
      //button.onMouseDown.listen((evt) => createComponent(rect, "Bulb"));
      button.onTouchStart.listen((evt) => createComponent(rect, "Bulb"));
    }
      
    button = document.querySelector("$id #reset-button");
    if (button != null) button.onClick.listen((evt) => this.app.reset());
      
    /* update the values of sliders, whenever it is changed */
    InputElement slider1 = document.querySelector("#battery-slider");
    if (slider1 != null) {
      changeValue("battery-value", double.parse(slider1.value)); /* initiate the slider value */
      //slider1.onChange.listen((e) => changeValue("battery-value", double.parse(slider1.value)));
      slider1.onTouchMove.listen((e) => sliderMove(e, "#battery-slider"));
      //slider1.onMouseMove.listen((e) => sliderMove(e, "#battery-slider"));
      slider1.onTouchEnd.listen((e) => changeValue("battery-value", double.parse(slider1.value)));
      //slider1.onMouseUp.listen((e) => changeValue("battery-value", double.parse(slider1.value)));
    }

    
    InputElement slider2 = document.querySelector("#wire-slider");
    //changeValue("wire-value", double.parse(slider.value));
    //slider.onChange.listen((evt) => changeValue("wire-value", double.parse(slider.value)));

    
    InputElement slider3 = document.querySelector("#resistor-slider");
    if (slider3 != null) {
    changeValue("resistor-value", double.parse(slider3.value));
    //slider3.onChange.listen((evt) => changeValue("resistor-value", double.parse(slider3.value)));
    slider3.onTouchMove.listen((e) => sliderMove(e, "#resistor-slider"));
    slider3.onTouchEnd.listen((e) => changeValue("resistor-value", double.parse(slider3.value)));
    }
    
    InputElement slider4 = document.querySelector("#bulb-slider");
    if (slider4 != null) {
    changeValue("bulb-value", double.parse(slider4.value));
    //slider4.onChange.listen((evt) => changeValue("bulb-value", double.parse(slider4.value)));
    slider4.onTouchMove.listen((e) => sliderMove(e, "#bulb-slider"));
    slider4.onTouchEnd.listen((e) => changeValue("bulb-value", double.parse(slider4.value)));
    }
  }
  
  void createComponent(CssRect rect, String type) {
    num cx = rect.left + rect.width / 2 + rand.nextInt(24) - 12;
    num cy = rect.top + rect.height / 2 - rand.nextInt(24);
    switch (type) {
      case 'Battery':
        InputElement slider = querySelector("#battery-slider");
        var voltage = double.parse(slider.value);
        new Battery(cx - 50, cy - 100, cx + 50, cy - 100, voltage);
        break;
      case 'Wire':
        new Wire(cx - 50, cy - 100, cx + 50, cy - 100);
        break;
      case 'Resistor':
        InputElement slider = querySelector("#resistor-slider");
        var resistance = double.parse(slider.value);
        new Resistor(cx - 50, cy - 100, cx + 50, cy - 100, resistance);
        break;
      case 'Bulb':
        InputElement slider = querySelector("#bulb-slider");
        var resistance = double.parse(slider.value);
        //var resistance = 1.0;
        new Bulb(cx - 50, cy - 100, cx + 50, cy - 100, resistance);
        break;
    }
  }
}
void sliderMove(UIEvent evt, String who) {
  InputElement slider = document.querySelector(who);
  Rectangle box = slider.getBoundingClientRect();
  num left = box.left + window.pageXOffset;
  num top = box.top + window.pageYOffset;
  num width = box.width;
  num tx, ty;
  if (evt is TouchEvent) {
    tx = evt.changedTouches[0].client.x - left;
    ty = evt.changedTouches[0].client.y - top;
  }
  if (evt is MouseEvent) {
    tx = evt.client.x - left;
    ty = evt.client.y - top;
  }  
  if (tx < width / 5.0) {
    slider.value = "1.0";
  } else if (tx < width * 2 / 5) {
    slider.value = "1.5";
  } else if (tx < width * 3 / 5) {
    slider.value = "2";
  } else if (tx < width * 4 / 5) {
    slider.value = "2.5";
  } else {
    slider.value = "3.0";
  }
}
//
//void sliderTouch(TouchEvent tframe, String who) {
//  InputElement slider = document.querySelector(who);
//  Rectangle box = slider.getBoundingClientRect();
//  num left = box.left + window.pageXOffset;
//  num top = box.top + window.pageYOffset;
//  num width = box.width;
//  num tx = tframe.changedTouches[0].client.x - left;
//  num ty = tframe.changedTouches[0].client.y - top;
//  if (tx < width / 5.0) {
//    slider.value = "1.0";
//  } else if (tx < width * 2 / 5) {
//    slider.value = "1.5";
//  } else if (tx < width * 3 / 5) {
//    slider.value = "2";
//  } else if (tx < width * 4 / 5) {
//    slider.value = "2.5";
//  } else {
//    slider.value = "3.0";
//  }
//}

void changeValue(String who, num value) {
  switch (who) {
    case 'battery-value':
      querySelector("#battery-value").text = "Voltage = ${value}";
      break;
    case 'wire-value':
      break;
    case 'resistor-value':
      querySelector("#resistor-value").text = "Resistance = ${value}";
      break;
    case 'bulb-value':
      //query("#bulb-value").text = "${value} ohm";
      break;
  }

}
