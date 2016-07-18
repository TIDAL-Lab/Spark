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
//import 'package:intl/intl.dart'; //this is for number format for AR tags

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
// remove intl package, instead use core:double.toStringAsFixed  
//  var iFormated = new NumberFormat("#0.000").format(i);
//  var vFormated = new NumberFormat("#0.000").format(v);
//  var rFormated = new NumberFormat("#0.0").format(r);
  
  var iFormated = i.toStringAsFixed(3);
  var vFormated = v.toStringAsFixed(3);
  var rFormated = r.toStringAsFixed(1);
  
  ParagraphElement p = new ParagraphElement();
  
//  p = document.querySelector("#type");
//  p.text = p.text = "This is a wire";
  
  p = document.querySelector("#voltage-value");
  p.text = "Voltage Drop = ${vFormated}";
  
  p = document.querySelector("#current-value");
  p.text = "Current = ${iFormated}";
  
  p = document.querySelector("#resistance-value");
  p.text = "Resistance = ${rFormated}";
 
  WireModel model = new WireModel(v);
  model.restart();
  model.play(1);
  
 /* 
  // An old attempt to get the input values from the html file
  SpanElement s = new SpanElement();
  s = document.querySelector("#resistance");
  var res = double.parse(s.text);
  */
}

class WireModel extends SparkModel {
  
  WireModel(num v) : super('Wire', 'wire'){

    initE = 0.08;
    decE = 0.005;
    incE = 0.04;

    diameter = 7;
    voltage = v * 10;
    patchSize = 20;
    resize(width, height);
  }

  void setupPatches(){
    // define the conductor patches
    for (int i=0; i<worldWidth; i++) {
      // the wire is "diameter" patches width
      for (int j=- (diameter ~/ 2 + 2); j < (1 + diameter ~/ 2 - 2); j++) {
        int px = i + minPatchX;
        int py = j;
        setupConductorPatch(px, py, 270, "bottom");
      }
    }
  }
  
  void sproutIons() {
    
    for (Patch p in conductors) {
      if (conductors.indexOf(p) % 3 == 0 && p.x % 2 == 0 ) {
        sproutIon(p.x, p.y);
      }
    }
  }

}
