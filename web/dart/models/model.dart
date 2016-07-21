part of SparkProject;

class Model {
  App app;
  Random rand = new Random();
  Component component = null;
  
  Model() {
   
    ButtonElement button;
    button = document.querySelector("#close-button");
    if (button != null) button.onClick.listen((e) => closeModel());
    
    button = document.querySelector("#help-button");
    if (button != null) button.onClick.listen((e) => theApp.help.show());
    
  }
  
  void closeModel() { }
  void updateModel() { }
  void reset() {
    
  }
  
}