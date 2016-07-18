part of SparkProject;

class Model {
  App app;
  String id; // html id for toolbar div tag
  Random rand = new Random();
  Component component = null;
  
  Model(String id) {
    this.id = id;
    ButtonElement button;
    button = document.querySelector("$id #close-button");
    if (button != null) button.onClick.listen((e) => closeModel());
    
    button = document.querySelector("#help-button");
    if (button != null) button.onClick.listen((e) => theApp.help.show());
    
  }
  
  void closeModel() {}
  void reset() {
    
  }
  
}