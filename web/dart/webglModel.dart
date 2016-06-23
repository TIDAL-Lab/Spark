part of SparkProject;


class webglModel {
  
  App app;
  String id; // html id for toolbar div tag
  Random rand = new Random();
  Component component;
   
  webglModel(this.app, String id) {
    //theApp.help.show();
    ButtonElement button;
    button = document.querySelector("$id .close-button");
    if (button != null) button.onClick.listen((e) => closeModel());
    
    button = document.querySelector("$id .help-button");
    //if (button != null) button.style.display = "none";
    if (button != null) button.onClick.listen((e) => theApp.help.show());
    
    
  }
  
  void closeModel() {
    document.querySelector("#model1").style.display = "none";
    //theApp.model1.component = null;
    theApp.help.close();    
  }
  
  void launchModel() {
    
    //theApp.model1.component = c;
    //String i = c.current.toString();
    //String r = c.resistance.toString();
    //String v = c.voltageDrop.toString();
    
    IFrameElement frame = document.querySelector("div#model1 #model-frame");
//    frame.width = "50";
//    frame.height = "50";
    //frame.src = "probe.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
    frame.src = "../three.js/Spark-webgl.html";
    document.querySelector("#model1").style.display = "block";
    theApp.help.initiate();
  }
  
  /** update the model if it is open 
   */ 
  updateModel() {
//    Component c = theApp.model1.component;
//    if (document.querySelector("#model1").style.display == "block" && !(c is Battery)) {
//      
//      String i = c.current.toString();
//      String r = c.resistance.toString();
//      String v = c.voltageDrop.toString();
//      
//      IFrameElement frame = document.querySelector("div#model1 #model-frame");
//      String frameSource;
//      //frameSource = "probe.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
//      frame.src = "../three.js/Spark-webgl.html";
//      //print(frame.src);
//      if (!frame.src.endsWith(frameSource)) frame.src = frameSource; // update only if it is updated!
//    }
  }

}