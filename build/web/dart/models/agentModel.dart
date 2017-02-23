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


class agentModel extends Model {
  
  agentModel() : super() { }
  
  void launchModel(Component c) { 
    this.component = c;
    String i = c.current.toString();
    String r = c.resistance.toString();
    String v = c.voltageDrop.toString();
    
    IFrameElement frame = document.querySelector("#model-frame");
    if (c is Wire) frame.src = "NetTango-models/wire.html?i=${i}&r=${r}&v=${v}";
    if (c is Resistor || c is Bulb) frame.src = "NetTango-models/resistor.html?i=${i}&r=${r}&v=${v}";
    if (c is Battery) frame.src = "lumpModel.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
    
    document.querySelector("#model").style.display = "block";
    theApp.help.show();
  }
  
  void closeModel() {
    IFrameElement frame = querySelector("#model-frame");
    frame.src = "";
    document.querySelector("#model").style.display = "none";
    this.component = null;
    theApp.help.close();
  }
  
  /** update the model if it is open 
   */ 
  updateModel() {
    Component c = this.component;
    if (document.querySelector("#model").style.display == "block" && !(c is Battery)) {
      
      String i = c.current.toString();
      String r = c.resistance.toString();
      String v = c.voltageDrop.toString();
      //frame.src = "http://spark-project.appspot.com/Resistor?i=${i}&r=${r}&v=${v}";
      IFrameElement frame = document.querySelector("div#model #model-frame");
      String frameSource;
      if (c is Wire) {
        frameSource = "NetTango-models/wire.html?i=${i}&r=${r}&v=${v}";
      }
      else { // resistor or bulb
        frameSource = "NetTango-models/resistor.html?i=${i}&r=${r}&v=${v}";
      }
      if (!frame.src.endsWith(frameSource)) frame.src = frameSource; // update only if it is updated!
    }
  }

}