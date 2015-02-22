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

void genericSliderTouch(TouchEvent tframe) {
//    String who = c + "-slider";
//    String value = c + "-value";
//    print(value);
  InputElement slider = document.querySelector("#generic-slider");
  Rectangle box = slider.getBoundingClientRect();
  num left = box.left + window.pageXOffset;
  num top = box.top + window.pageYOffset;
  num width = box.width;
  num tx = tframe.changedTouches[0].client.x - left;
  num ty = tframe.changedTouches[0].client.y - top;
  var min = double.parse(slider.min);
  var step = double.parse(slider.step);
  if (tx < width / 5.0) {
    slider.value = min.toString();
  } else if (tx < width * 2 / 5) {
    slider.value = ( min + step ).toString();
  } else if (tx < width * 3 / 5) {
    slider.value = (min + 2 * step).toString();
  } else if (tx < width * 4 / 5) {
    slider.value = (min + 3 * step).toString();
  } else {
    slider.value = (min + 4 * step).toString();
  }
  //genericChangeValue(int.parse(slider.value));

}

void genericChangeValue(num value) {
  Component c = theApp.genericSliderComponent; 
  switch (c.type) {
    case 'Battery':
      if (!(c as Battery).isBurnt) {
        c.voltageDrop = value;
        theApp.circuit.solve();
        App.repaint();
      }
      break;
    case 'Wire':
      break;
    case 'Resistor':
      c.resistance = value;
      theApp.circuit.solve();
      App.repaint();
      break;
    case 'Bulb':
      //query("#bulb-value").text = "${value} ohm";
      break;
  }

}