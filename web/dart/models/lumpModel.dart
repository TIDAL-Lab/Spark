part of SparkProject;


class lumpModel extends Model {
   
  lumpModel() : super() {  }
  
  void launchModel(Component c) {
    this.component = c;
    String i = this.component.current.toString();
    String r = this.component.resistance.toString();
    String v = this.component.voltageDrop.toString();
    
    IFrameElement frame = document.querySelector("#model-frame");
    frame.src = "lumpModel.html?i=${i}&r=${r}&v=${v}&type=${this.component.type}";
    
    document.querySelector("#model").style.display = "block";
    theApp.help.show();    
  }
  
  void closeModel() {
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
      
      IFrameElement frame = document.querySelector("div#model #model-frame");
      String frameSource;
      frameSource = "probe.html?i=${i}&r=${r}&v=${v}&type=${c.type}";
      if (!frame.src.endsWith(frameSource)) frame.src = frameSource; // update only if it is updated!
    }
  }

}