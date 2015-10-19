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

class Wire extends Component {

  static int TAG = 0x01;

  Wire(num x0, num y0, num x1, num y1) : super("Wire", x0, y0, x1, y1) {
    setImage("images/wire.png");
    current = 0.0;
    resistance = 0.001;
    voltageDrop = 0.0;
    
    //theApp.circuit.addNewBranch(this); 
    }
  
  CanvasRenderingContext2D drawComponent(CanvasRenderingContext2D ctx) {
    iw = sqrt(pow((start.x - end.x), 2) + pow((start.y - end.y), 2));
    ih = img.height / 3;
    /* no image to be drawn */
    return ctx;
    }
}