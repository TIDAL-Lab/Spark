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

class Battery extends Component  {
  static int TAG = 0x07;
  bool isBurnt = false;
  num maxCurrent = 10.0;
  ImageElement warning = new ImageElement();
  
  Battery(num x0, num y0, num x1, num y1, num v) : super("Battery",x0, y0, x1, y1) {
    setImage("images/battery3t.png");
    warning.src = "images/burnt-sign.png";
    current = 0.0;
    resistance = 0.0;
    voltageDrop = v;    
    
    //addSlider(x0, y0);
    
    theApp.circuit.addNewBranch(this);   
  }
    
    CanvasRenderingContext2D drawComponent(CanvasRenderingContext2D ctx) {
      iw = img.width / 3;
      ih = img.height / 3;
      ctx.drawImageScaled(img, -iw/2, -ih/2, iw, ih);
     if (!isBurnt) { 
     ctx.fillStyle = "rgb(120,180,35)";
     ctx.fillRect(-5, -10, 40, 20);
     ctx.fillStyle = "rgb(0, 0, 0)";
     ctx.textAlign = 'left';
     ctx.textBaseline = 'top';
     ctx.font = '10px sans-serif'; /* other fonts: verdana */
     
     ctx.fillText("V = ${voltageDrop}", -2,-5);
     }
     else { // if the battery is burnt, draw the warning
       num warningW = warning.width / 2.5;
       num warningH = warning.height / 2.5;
       ctx.drawImageScaled(warning, -iw/3.7, -ih/2, warningW, warningH);
     }
     return ctx;
    }
    /** burn the battery because of a short circuit.
     * I(short circuit) > 5.0
     */
    void burn() {
      //setImage("images/battery-burnt.png");
      voltageDrop = 0.0;
      isBurnt = true;
      Sounds.playSound("ding");
    }
}
