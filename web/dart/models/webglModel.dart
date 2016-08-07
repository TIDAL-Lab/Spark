part of SparkProject;


class webglModel extends Model {
  IFrameElement frame = document.querySelector("#model-frame");
  
  webglModel() : super() { 
    frame.src = "../three.js/Spark-webgl.html";    
    theApp.circuit.solve();
    
    // getting the window of the iframe
    var receiver = frame.contentWindow;
    receiver.postMessage("hello model iframe!!", 'http://localhost:8080');
    
  }
  
  void closeModel() {
    document.querySelector("#model").style.display = "none";
    theApp.help.close();    
  }
  
  void launchModel() {    
    
    context.callMethod('publishPubnub', []);    
    document.querySelector("#model").style.display = "block";
    theApp.help.show();
    
    theApp.circuit.solve();
  }
  
  void updateModel() {}
  
  void resetModel() {
    //launchModel(); 
    frame.src = "../three.js/Spark-webgl.html";
    document.querySelector("#model").style.display = "block";
//    theApp.help.show();
//    theApp.circuit.solve();
  }
}