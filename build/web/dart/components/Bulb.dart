/*
* Spark: Agent-based electrical circuit environment
* Copyright (c) 2013 Elham Beheshti
*
*       Elham Beheshti (beheshti@u.northwestern.edu)
*       Northwestern University, Evanston, IL
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License (version 2) as
* published by the Free Software Foundation.
*
* This program is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
* General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/
part of SparkProject;

class Bulb extends Component  {

  static int TAG = 0x08;
  bool isOn;
  bool isOff;
  
  ImageElement onbulb = new ImageElement();


  Bulb(num x0, num y0, num x1, num y1, num r) : super("Bulb",x0, y0, x1, y1) {
    setImage("images/bulb-off.png");
    onbulb.src = "images/bulb-on-yellow3.png";
    onbulb.src = "images/bulb-on.png";
    current = 0.0;
    resistance = 3.0;
    voltageDrop = 0.0;
    
    isOn = false;
    
    theApp.components.add(this);
    theApp.circuit.addNewBranch(this);
    
  }
  
  void turnOn() {
    //img.src = "images/bulb-on-yellow2.png";
    isOn = true;
  }
  
  void turnOff() {
    img.src = "images/bulb-off.png";
    isOn = false;
  }
  
  CanvasRenderingContext2D drawComponent(CanvasRenderingContext2D ctx) {
    iw = img.width / 2;
    ih = img.height / 2;
    ctx.drawImageScaled(img, -iw/2, -ih*0.9, iw, ih);
    
    ctx.save();
    var base = theApp.circuit.maxCurrent/2;;
    var power = 1;
    var powerScaled = 0;
    if (this.current < theApp.circuit.maxCurrent) {
      power = (this.current.abs() + 1) * (this.current.abs() + 1); // max I = 10 => power is between 1 and 100
      powerScaled = log(power)/log(base); // calculate log base 100 of power
    }
    //print(ctx.globalAlpha);
    ctx.beginPath();
    ctx.globalAlpha = log(power)/log(base);
    ctx.shadowColor = 'rgba(255,255,255,1.0)';
    ctx.shadowBlur = powerScaled*powerScaled*powerScaled*powerScaled*100;
    //print(ctx.shadowBlur);
    ctx.arc(0, -ih/1.8, iw/2, 0, 6.2832, true);
    ctx.fillStyle = 'white';
    //ctx.shadowOffsetX = 0;
    //ctx.shadowOffsetY = 0;
    ctx.fill();
    ctx.shadowBlur = 0.0;
    ctx.drawImageScaled(onbulb, -iw/2, -ih*0.9, iw, ih);
    ctx.restore();
    
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0.0;
    
    return ctx;
    }
    
  bool containsTouch(Contact event) {
    num tx = event.touchX;
    num ty = event.touchY;
    num cx = screenToComponentX(tx, ty);
    num cy = screenToComponentY(tx, ty);
    num cw = sqrt((start.x - end.x)*(start.x - end.x) + (start.y - end.y)*(start.y - end.y)) - 24;
    num ch = ih;
    
    num mx = (start.x + end.x) / 2;
    num my = (start.y + end.y) / 2;
    num cy2 = sqrt(((tx-mx)*(tx-mx) + (ty-my)*(ty-my)) - cx*cx);
    return (cx.abs() <= cw/2 && (cy <= ch/2 && -ch <= cy)); // ch/4 is just a margin
  }
  
}
