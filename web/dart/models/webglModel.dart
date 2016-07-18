part of SparkProject;


class webglModel extends Model {
   
  webglModel(String id) : super(id) {    
    
  }
  
  void closeModel() {
    document.querySelector("#model").style.display = "none";
    theApp.help.close();    
  }
  
  void launchModel() {
    IFrameElement frame = document.querySelector("div#model #model-frame");
    frame.src = "../three.js/Spark-webgl.html";
    document.querySelector("#model").style.display = "block";
    //document.querySelector("#help").style.display = "block";
    theApp.help.show();
  }
}