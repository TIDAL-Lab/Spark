import 'dart:html';

void main() {

  /* get the input values from the url */
  String querystring = window.location.search.replaceFirst("?", "");
  List<String> list = querystring.split("&");

  num v;
  num r;
  num i;
  num brightness;
  String type;
  CanvasRenderingContext2D ctx;
  CanvasElement canvas;
  
  for (String param in list) {
    if (param.startsWith("v=")) {
      v = double.parse(param.substring(2));
    }
    else if (param.startsWith("r=")) {
      r = double.parse(param.substring(2));
    }
    else if (param.startsWith("i=")) {
      i = double.parse(param.substring(2));
      brightness = i/0.3;
    }
    else if (param.startsWith("type=")) {
      type = param.substring(5);
      
    }
  }
// remove intl package, instead use core:double.toStringAsFixed    
//  var iFormated = new NumberFormat("#0.000").format(i);
//  var vFormated = new NumberFormat("#0.000").format(v);
//  var rFormated = new NumberFormat("#0.0").format(r);
  
  var iFormated = i.toStringAsPrecision(3);
  var vFormated = v.toStringAsPrecision(3);
  var rFormated = r.toStringAsPrecision(1);
  var bFormated = brightness.toStringAsPrecision(2);
 
  ParagraphElement p = new ParagraphElement();
  
  p = document.querySelector("#current-value");
  p.text = "Current = ${iFormated}";
  p.style.top = "200px";
  
  p = document.querySelector("#resistance-value");
  p.text = "Resistance = ${rFormated}";
  p.style.top = "240px";
  
  p = document.querySelector("#voltage-value");
  if (type == 'Battery') p.text = "Voltage = ${vFormated}";
  else p.text = "Voltage Drop = ${vFormated}";
  p.style.top = "280px";
  
  if (type == "Bulb") {
    p = document.querySelector("#brightness-factor");
    p.text = "Brightness Factor = ${bFormated}";
    p.style.top = "320px";
  }
 
  
//  img = document.querySelector("#component-image");
//  switch (type) {
//    case 'Resistor':
//      img.src = "images/probe/resistor.png";
//      break;
//    case 'Bulb':
//      img.src = "images/probe/bulb.png";
//      break;
//    case 'Wire':
//      img.src = "images/probe/wire.png";
//      break;
//    case 'Battery':
//      img.src = "images/probe/battery.png";
//      break;
//  }
//  img.style.width = "150px";
//  img.style.position = "absolute";
//  img.style.top = "10px";
//  img.style.left = "160px";
    
  //p = document.querySelector("#component-type");
  //p.text = "${type}";
  
//  p = document.querySelector("#type");
//  p.text = "This is a " + type;
  
//  img = document.querySelector("#voltmeter-image");
//  img.src = "images/buttons/voltmeter3.png";
//  //img.onLoad.listen((event) { App.repaint(); });
//  img.style.width = "250px";
//  img.style.position = "absolute";
//  img.style.top = "50px";
//  img.style.left = "50px";
 
}
