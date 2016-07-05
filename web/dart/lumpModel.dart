part of SparkProject;


class lumpModel {
  
  App app;
  String id; // html id for toolbar div tag
  Random rand = new Random();
  Component component;
   
  lumpModel(String id) {
    //theApp.help.show();
    ButtonElement button;
    button = document.querySelector("$id #close-button");
    if (button != null) button.onClick.listen((e) => closeModel());
    
    button = document.querySelector("#help-button");
    //button.style.display = "block";
    if (button != null) button.onClick.listen((e) => theApp.help.show());
    
    
  }
  
  void closeModel() {
    document.querySelector("#model").style.display = "none";
    //document.querySelector("#help").style.display = "none";
    theApp.model.component = null;
    theApp.help.close();    
  }
  
  void launchModel(Component c) {
    if (theApp.help.visible) {theApp.help.close();}
    theApp.model.component = c;
    String i = c.current.toString();
    String r = c.resistance.toString();
    String v = c.voltageDrop.toString();
    
    IFrameElement frame = document.querySelector("div#model #model-frame");
    frame.src = "probe.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
    
    document.querySelector("#model").style.display = "block";
    //document.querySelector("#help-button").style.display = "block";
    theApp.help.show();
    //document.querySelector("div#help .help-button").style.display = "block";
    
    theApp.help.initiate();
  }
  
  /** update the model if it is open 
   */ 
  updateModel() {
    Component c = theApp.model.component;
    if (document.querySelector("#model").style.display == "block" && !(c is Battery)) {
      
      String i = c.current.toString();
      String r = c.resistance.toString();
      String v = c.voltageDrop.toString();
      
      IFrameElement frame = document.querySelector("div#model #model-frame");
      String frameSource;
      frameSource = "probe.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
      if (!frame.src.endsWith(frameSource)) frame.src = frameSource; // update only if it is updated!
    }
  }

}