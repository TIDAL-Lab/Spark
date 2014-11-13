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

import 'dart:html';
import 'NetTangoJS/core/ntango.dart';
import 'core/spark.dart';
import 'package:intl/intl.dart'; //this is for number format for AR tags

void main() {

  /* get the input values from the url */
  String querystring = window.location.search.replaceFirst("?", "");
  List<String> list = querystring.split("&");
  num v;
  num r;
  num i;
  for (String param in list) {
    if (param.startsWith("v=")) {
      v = double.parse(param.substring(2));
    }
    else if (param.startsWith("r=")) {
      r = double.parse(param.substring(2));
    }
    else if (param.startsWith("i=")) {
      i = double.parse(param.substring(2));
    }
  }
  
  var iFormated = new NumberFormat("#0.00").format(i);
  var vFormated = new NumberFormat("#0.00").format(v);
  var rFormated = new NumberFormat("#0.0").format(r);
  
  ParagraphElement p = new ParagraphElement();
  p = document.querySelector("#voltage-value");
  p.text = "Voltage Drop = ${vFormated}";
  
  p = document.querySelector("#current-value");
  p.text = "Current = ${iFormated}";
  
  p = document.querySelector("#resistance-value");
  p.text = "Resistance = ${rFormated}";
 
  ResistorModel model = new ResistorModel(v, r);
  model.restart();
  model.play(1);
  
}

class ResistorModel extends SparkModel { 
  num resistance;
  int resistivity;
  ResistorModel(num voltage, num resistance) : super('Resistor', 'resistor'){ 
    initE = 0.1;
    decE = 0.01;
    
    this.voltage = voltage / 100;
    this.resistance = resistance;
    //resistivity = resistance + 1; 
    diameter = 3;
    incE = 0.04;
    
    patchSize = 20;
    resize(width, height);
  }
  
  void setupPatches() {
    // initialize all patches as insulators     
    int start = 4;
    int distH = 6;
    int distW = 2;
    int period = 2 * (distW + diameter);
    
    // define the conductor patches
    for (int i=0; i<worldWidth; i++) {
      Patch patch;
      int px = i + minPatchX;
      int py = -1 * diameter;
      
      // define the lead wire
      if (i < start - 1 || i > (worldWidth - 3)) { 
        for (int j = -2; j < diameter + 2; j++) {
          setupConductorPatch(px, py + j, -90.0, "bottom");
        }
      }  
      else if (i == start - 1) { 
        for (int j = 0; j < diameter; j++) {
          setupConductorPatch(px, py + j, -90.0, "bottom");
        }
      }    
        
      // define the up wires and part of top wire
      else if ((i - start) % period >= 0 && (i - start) % period < diameter) {
        for (py = -1 * diameter; py < distH; py++) {
          setupConductorPatch(px, py, 0.0, "up");
        }
        for (py = distH; py < diameter + distH; py++) {
          setupConductorPatch(px, py, -90.0, "top");
        }
      }
      
      // define the top wires
      else if ((i - start) % period >= diameter && (i - start) % period < (diameter + distW)) {
        for (py = distH; py < diameter + distH; py++) {
            setupConductorPatch(px, py, -90.0, "top");                   
        }
      }
        
      // define the down wires
      else if ((i - start) % period >= (diameter + distW) && (i - start) % period < (distW + 2 * diameter)) {
        for (py = 0; py < diameter + distH; py++) {
          setupConductorPatch(px, py, 180.0, "down");  
        } 
        for (py = -1 * diameter; py < 0; py++) {
          setupConductorPatch(px, py, -90.0, "bottom"); 
        } 
      }
        
      // define the bottom wires
      else if ((i - start) % period >= (distW + 2 * diameter) && (i-start) % period < 2 * (distW + diameter)) {
        for (py = -1 * diameter; py < 0; py++) {
          setupConductorPatch(px, py, -90.0, "bottom");
        }
      }
    }
  }
  
  void sproutIons() {
    
    for (Patch p in conductors) {
      if ((p.x + p.y) % (5 - resistance) == 0 ) {
        sproutIon(p.x, p.y);
      }
    }
  }

 
}