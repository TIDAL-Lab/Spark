import 'dart:html';
//import 'dart:math';
import 'package:intl/intl.dart'; //this is for number format for AR tags

void main() {

  /* get the input values from the url */
  String querystring = window.location.search.replaceFirst("?", "");
  List<String> list = querystring.split("&");

  num v;
  num r;
  num i;
  String type;
  CanvasRenderingContext2D ctx;
  CanvasElement canvas;
  
  for (String param in list) {
    if (param.startsWith("v=")) {
      v = double.parse(param.substring(2));
      //window.alert("Set voltage to v");
    }
    else if (param.startsWith("r=")) {
      r = double.parse(param.substring(2));
    }
    else if (param.startsWith("i=")) {
      i = double.parse(param.substring(2));
    }
    else if (param.startsWith("type=")) {
      type = param.substring(5);
      
    }
  }
  
  var iFormated = new NumberFormat("#0.000").format(i);
  var vFormated = new NumberFormat("#0.000").format(v);
  var rFormated = new NumberFormat("#0.000").format(r);
  
  ImageElement img = new ImageElement();
  
  img = document.querySelector("#component-image");
  switch (type) {
    case 'Resistor':
      img.src = "images/probe/resistor.png";
      break;
    case 'Bulb':
      img.src = "images/probe/bulb.png";
      break;
    case 'Wire':
      img.src = "images/probe/wire.png";
      break;
    case 'Battery':
      img.src = "images/probe/battery.png";
      break;
  }
  img.style.width = "150px";
  img.style.position = "absolute";
  img.style.top = "20px";
  img.style.left = "160px";
  
  ParagraphElement p = new ParagraphElement();
  
  //p = document.querySelector("#component-type");
  //p.text = "${type}";
  
  p = document.querySelector("#voltage-value");
  p.text = "Voltage Drop = ${vFormated}";
  
  p = document.querySelector("#current-value");
  p.text = "Current = ${iFormated}";
  
  p = document.querySelector("#resistance-value");
  p.text = "Resistance = ${rFormated}";
  

//  
//  ImageElement img;
//  img = new ImageElement();
//  //setImage("images/resistor2t.png");
//  img.src = "images/resistor2t.png";
//  //img.onLoad.listen((event) { draw(); }); 
//  //draw();
  
}
