/*
 * NetTango
 * Northwestern University
 *
 * This project was funded in part by the National Science Foundation.
 * Any opinions, findings and conclusions or recommendations expressed in this
 * material are those of the author(s) and do not necessarily reflect the views
 * of the National Science Foundation (NSF).
 */
part of NetTango;

class Patch extends Agent implements Touchable {
  int x, y; // patch coordinates
  num fieldDirection; // in radians
  String region;
  var forceX;
  var forceY;
  
  Patch(Model model, this.x, this.y) : super(model) {
   // color = new Color(0, 100, 0, 0);
    //color = new Color(155, 210, 155, 200);
    color = new Color(0, 114, 143, 255);
    dirty = true;
    
    forceX = 0;
    forceY = 0;
  }
  
  void draw(var ctx) {
    if (dirty) {
      ctx.clearRect(x - 0.5, y - 0.5, 1, 1);
      ctx.fillStyle = color.toString();
      ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      dirty = false;
    }
  }
   
   
  bool containsTouch(Contact event) {
    double tx = model.screenToWorldX(event.touchX, event.touchY);
    double ty = model.screenToWorldY(event.touchX, event.touchY);
    return (tx >= x-0.5 && tx <= x+0.5 && ty >= y-0.5 && ty <= y+0.5);
  }
  

  bool touchDown(Contact event) { return false; }
  void touchUp(Contact event) { }
  void touchSlide(Contact event) { }
  void touchDrag(Contact event) { }
   
   
   
  AgentSet turtlesHere() {
    AgentSet turtleshere = new AgentSet();
    // go through all turtles
    for (Turtle t in model.turtles) {
      // put the ones that have this as their patch in the list
      if (t.patchHere() == this) {
        turtleshere.add(t);
      }
    }
    return turtleshere;
  }
}