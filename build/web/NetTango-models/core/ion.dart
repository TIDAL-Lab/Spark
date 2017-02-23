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
part of Spark;
/**
 * class for Turtles as stationary Ions
 */
class Ion extends Turtle {
  num energy;
  SparkModel sparkModel;
  
  Ion(SparkModel model) : super(model) {
    this.sparkModel = model;
    size = 0.3;
  }
  
  void tick() {
    if (energy > this.sparkModel.initE) {
      energy -= this.sparkModel.decE;
    }
  }
  
  void draw(CanvasRenderingContext2D ctx) {
    int c = (energy * 1000).toInt();
    //ctx.fillStyle = "rgba($c, 50, 50, 255)";
    ctx.fillStyle = "rgba(255, 50, 50, 255)";
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, PI * 2, true);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth=0.01;
    ctx.stroke();
  }
}

