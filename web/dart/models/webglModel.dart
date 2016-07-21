part of SparkProject;


class webglModel extends Model {
   
  webglModel() : super() {  
    //launchModel();
    
  }
  
  void closeModel() {
    document.querySelector("#model").style.display = "none";
    theApp.help.close();    
  }
  
  void launchModel() {
    IFrameElement frame = document.querySelector("#model-frame");
    frame.src = "../three.js/Spark-webgl.html";
    
    // getting the window of the iframe
    var receiver = frame.contentWindow;
    receiver.postMessage("hello Elli Golli, I love you!!", 'http://localhost:8080');
    
    document.querySelector("#model").style.display = "block";
    theApp.help.show();
    
    if (USE_SERVER) {
      print("launch model");
      //theApp.circuit.solve();
      theApp.circuit.sendDataToServer();
    }
  }
  
  void updateModel() {}
}