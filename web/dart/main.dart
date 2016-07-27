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

library SparkProject;

import 'dart:html';
import 'dart:math';
import 'dart:convert';
import 'dart:core';
//import 'package:intl/intl_browser.dart'; /* this was used for number format for the AR tags */
import 'dart:web_audio';
import 'dart:js';
//import "package:json_object/json_object.dart";
part 'app.dart';
part 'touch.dart';
part 'toolbar.dart';

part 'models/model.dart';
part 'models/agentModel.dart';
part 'models/lumpModel.dart';
part 'models/webglModel.dart';
part 'sounds.dart';
part 'slider.dart';
part 'models/help.dart';
part 'lens.dart';
part 'lens2.dart';
part 'marker.dart';
//part 'connectServer.dart';
part 'circuitAnalysis/Circuit.dart';
part 'circuitAnalysis/Matrix.dart';
part 'circuitAnalysis/LUDecomposition.dart';
part 'circuitAnalysis/QRDecomposition.dart';
part 'circuitAnalysis/KVLSolver.dart';
part 'components/ControlPoint.dart';
part 'components/Component.dart';
part 'components/Wire.dart';
part 'components/Battery.dart';
part 'components/Resistor.dart';
part 'components/Bulb.dart';


App theApp;


void main() {
  initiate();
  new App();
}

void initiate() {
  // Load sound effects 
  Sounds.loadSound("crunch");
  Sounds.loadSound("ping");
  Sounds.loadSound("ding");
  
  // update the values of the generic slider, when it is changed 
  InputElement slider = document.querySelector("#generic-slider");
  if (slider != null) {
    slider.onTouchMove.listen((e) => genericSliderTouch(e));
    slider.onTouchEnd.listen((e) => genericChangeValue(double.parse(slider.value)));
  }
  
  // set up a flag to switch between touch and mouse events (Mike's code, needs to be integrated into my code) 
/*
  /**
   * Is the given flag set to true in the URL query string?
   */
  bool isFlagSet(String name) {
    return window.location.search.indexOf("${name}=true") > 0;
  }

  /**
   * Binds a click event to a button
   */
  void bindClickEvent(String id, Function callback) {
    Element element = querySelector("#${id}");
    if (element != null) {
      if (isFlagSet("debug")) {
        element.onClick.listen(callback);
      } else {
        element.onTouchStart.listen(callback);
      }
    }
  }
   */
}