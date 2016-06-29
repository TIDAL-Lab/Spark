part of SparkProject;


class webglModel {
  
  App app;
  String id; // html id for toolbar div tag
  Random rand = new Random();
  Component component;
   
  webglModel(String id) {
    //theApp.help.show();
    ButtonElement button;
    button = document.querySelector("$id #close-button");
    if (button != null) button.onClick.listen((e) => closeModel());
    
    button = document.querySelector("#help-button");
    //if (button != null) button.style.display = "none";
    if (button != null) button.onClick.listen((e) => theApp.help.show());
    
    
  }
  
  void closeModel() {
    document.querySelector("#model").style.display = "none";
    //document.querySelector("#help").style.display = "none";
    //theApp.model.component = null;
    theApp.help.close();    
  }
  
  void launchModel() {
    theApp.model.component = null;
    IFrameElement frame = document.querySelector("div#model #model-frame");
    frame.src = "../three.js/Spark-webgl.html";
    document.querySelector("#model").style.display = "block";
    //document.querySelector("#help").style.display = "block";
    theApp.help.initiate();
  }
  
  /** update the model if it is open 
   */ 
  updateModel() {
//    Component c = theApp.model.component;
//    if (document.querySelector("#model").style.display == "block" && !(c is Battery)) {
//      
//      String i = c.current.toString();
//      String r = c.resistance.toString();
//      String v = c.voltageDrop.toString();
//      
//      IFrameElement frame = document.querySelector("div#model #model-frame");
//      String frameSource;
//      //frameSource = "probe.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
//      frame.src = "../three.js/Spark-webgl.html";
//      //print(frame.src);
//      if (!frame.src.endsWith(frameSource)) frame.src = frameSource; // update only if it is updated!
//    }
  }

}