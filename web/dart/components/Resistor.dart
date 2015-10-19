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

class Resistor extends Component {

  static int TAG = 0x03;

  Resistor(num x0, num y0, num x1, num y1, num r) : super("Resistor", x0, y0, x1, y1) {
    setImage("images/resistor2t.png");
    
    current = 0.0;
    resistance = r;
    voltageDrop = 0.0;
    
    //addSlider(x0, y0);
    //theApp.circuit.addNewBranch(this); 
  }
  
  CanvasRenderingContext2D drawComponent(CanvasRenderingContext2D ctx) {
    iw = img.width / 4;
    ih = img.height / 4;
    ctx.drawImageScaled(img, -iw/2, -ih/2, iw, ih);
    //ctx.fillStyle = "rgba(120,180,35,250)";
    //ctx.fillRect(-5, -10, 40, 20);
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '12px sans-serif'; /* other fonts: verdana */
    
    ctx.fillText("R = ${resistance}", -20,-22);

    return ctx;
    }
}
