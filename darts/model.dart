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


class Model {
  
  App app;
  String id; // html id for toolbar div tag
  Random rand = new Random();
  Component component;
   
  Model(this.app, String id) {
    
    ButtonElement button;
    button = document.querySelector("$id .close-button");
    if (button != null) button.onClick.listen((e) => closeModel());
    
    button = document.querySelector("$id .help-button");
    if (button != null) button.onClick.listen((e) => theApp.help.show());
    
  }
  
  void closeModel() {
    IFrameElement frame = querySelector("div#model1 #model-frame");
    frame.src = "";
    document.querySelector("#model1").style.display = "none";
    theApp.model1.component = null;
    theApp.help.close();
  }
  
  void launchModel(Component c) {
    
    theApp.model1.component = c;
    String i = c.current.toString();
    String r = c.resistance.toString();
    String v = c.voltageDrop.toString();
    
    IFrameElement frame = document.querySelector("div#model1 #model-frame");
    if (c is Wire) frame.src = "models/wire.html?i=${i}&r=${r}&v=${v}";
    else frame.src = "models/resistor.html?i=${i}&r=${r}&v=${v}";
//    if (c is Wire) frame.src = "http://spark-project.appspot.com/Wire?i=${i}&r=${r}&v=${v}";
//    else frame.src = "http://spark-project.appspot.com/Resistor?i=${i}&r=${r}&v=${v}";    
    document.querySelector("#model1").style.display = "block";
    theApp.help.initiate();
  }
  
  /** update the model if it is open 
   */ 
  updateModel() {
    Component c = theApp.model1.component;
    if (document.querySelector("#model1").style.display == "block" && !(c is Battery)) {
      
      String i = c.current.toString();
      String r = c.resistance.toString();
      String v = c.voltageDrop.toString();
      //frame.src = "http://spark-project.appspot.com/Resistor?i=${i}&r=${r}&v=${v}";
      IFrameElement frame = document.querySelector("div#model1 #model-frame");
      String frameSource;
      if (c is Wire) {
        //frameSource = "http://spark-project.appspot.com/Wire?i=${i}&r=${r}&v=${v}";
        frameSource = "models/wire.html?i=${i}&r=${r}&v=${v}";
      }
      else { // resistor or bulb
        //frameSource = "http://spark-project.appspot.com/Resistor?i=${i}&r=${r}&v=${v}";
        frameSource = "models/resistor.html?i=${i}&r=${r}&v=${v}";
      }
      print(frame.src);
      if (!frame.src.endsWith(frameSource)) frame.src = frameSource; // update only if it is updated!
    }
  }

}