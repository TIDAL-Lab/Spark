part of SparkProject;

class ControlPoint implements Touchable {

  num x, y;
  bool dragging = false;
  //double voltage;
  Component myComponent;
  ControlPoint myConjoint;
  List<ControlPoint> connections;
  List<ControlPoint> beforeDragConnections;
  Node node = null; // it associates the corresponding node in the circuit/graph analysis

  num clickX;
  num clickY;
  
  ControlPoint(this.x, this.y) {
    theApp.addTouchable(this);
    connections = new List<ControlPoint>();
    beforeDragConnections = new List<ControlPoint>();  
  }


  bool get isConnected => connections.length > 0;


  void draw(CanvasRenderingContext2D ctx) {
    ctx.beginPath();
    //ctx.fillStyle = "gray";
    ctx.fillStyle = "red";
    if (isConnected) {
      ctx.fillStyle = "green";
    } else if (dragging) {
      ctx.fillStyle = "orange";
    }
    ctx.arc(x, y, 6, 0, PI * 2, true);
    ctx.fill();

    //ctx.save();
    ctx.arc(x, y, 10, 0, PI * 2, true);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    if (isConnected) ctx.fillStyle = "rgba(0,255,0,0.5)";
    ctx.fill();
  }


  void animate() {

  }

  /**
   * connect me, if I am connected to another control point
   */
  void makeConnection() {
    ControlPoint p = this.findConnection();
    
    /* make a connection, if any, but don't connect if it is connecting two components together */    
    if (p != null && !p.myConjoint.connections.contains(this.myConjoint)) {
      for (ControlPoint cp in p.connections) {
        if (cp.myConjoint.connections.contains(this.myConjoint)) return;
      }
        x = p.x;
        y = p.y;
        this.connectTo(p);
    }
  }

  ControlPoint findConnection () {
    for (ControlPoint cp in theApp.controlPoints) {
      if (isOverlapping(cp) && cp != this) return cp;
    }
    return null;
  }

  bool isOverlapping(ControlPoint cp) {
    return ((cp.x - x).abs() <= 20 && (cp.y - y).abs() <= 20);
  }
  
  /** add all the new connections to p1 and p2 and also adds p1 to the connections of p2.connections
  @param p1 the cp that is being dragged
  @param p2 the cp that p1 is getting connected to
  @return     void
  */
  void connectTo(ControlPoint p) {
      this.connections.add(p);
      this.connections.addAll(p.connections);
      for (ControlPoint cp in p.connections) cp.connections.add(this);
      p.connections.add(this);      
  }
  /** 
   * remove the connections from the connection lists
   */
  
  void clearConnections() {
    for (ControlPoint p in connections) {
      p.removeConnection(this);
    }
    connections.clear();
  }
  
  void removeConnection(ControlPoint p) {
    for (int i=0; i<connections.length; i++) {
      if (connections[i] == p) {
        connections.removeAt(i);
        return;
      }
    }
  }
  /** update the circuit graph after a touchUp event
   * only update if the list of connections before and after the event are not equal
   * there are 3 cases:
   * Case A: a cp is connected to another cp -> collapse node
   * Case B: a cp is disconnected -> split node
   * Case C: a cp is disconnected and then connected to a different cp in a single event
  */  
  void updateCircuit() {
    if (!areCPListsEqual(beforeDragConnections, connections)) {
      if (beforeDragConnections.isEmpty) { /* Case A: collapse node */
        theApp.circuit.collapseNode(this, this.connections.first);
      }
      else if (connections.isEmpty) { /* Case B: splite node */
        theApp.circuit.splitNode(this, beforeDragConnections.first);
      }
      else { /* Case C */
        theApp.circuit.splitNode(this, beforeDragConnections.first);
        theApp.circuit.collapseNode(this, this.connections.first);
      }
    }
    else if (isConnected) { /* a cp is disconnected and then connected back in a single drag event */
      Sounds.playSound("ping");
    }
  }
  /* TODO */
  bool inBox(num deltaX, num deltaY) {
    if (x + deltaX < theApp.workingBox.width && y + deltaY < theApp.workingBox.height
        && myConjoint.x + deltaX < theApp.workingBox.width && myConjoint.y + deltaY < theApp.workingBox.height) {
      return true;
    }
    return false;
    
  }

/* ------------------------
   Touch Events
   the connections are all cleared at touchDown and then made again at touchUp event
   At touchDrag nothing in connections change
 * ------------------------ */
  
  bool containsTouch(Contact event) {
    num tx = event.touchX;
    num ty = event.touchY;
    return (tx >= x - 13 && tx <= x + 13 && ty >= y - 13 && ty <= y + 13);
  }

  bool touchDown(Contact event) {
    document.querySelector("#generic-slider").style.display = "none";
    dragging = true;
    clickX = event.touchX;
    clickY = event.touchY;
    
    beforeDragConnections.clear();
    beforeDragConnections.addAll(connections); /* a copy of connections before the drag */
    clearConnections();
    
    //App.repaint();
    return true;
  }

  void touchUp(Contact event) {
    theApp.lens.findComponent();
    dragging = false;
    makeConnection();
    updateCircuit();    
    App.repaint();
  }

  void touchDrag(Contact event) {
    
    if (myComponent is Wire) {
      var dist = (event.touchX - myConjoint.x)*(event.touchX - myConjoint.x) + (event.touchY - myConjoint.y)*(event.touchY - myConjoint.y);
      if (dist > 40 * 40) { /* don't let the wire length to become less than 40 */
      x = event.touchX;
      y = event.touchY;
      }
    } 
    
    else {
      num x1 = myConjoint.x;
      num y1 = myConjoint.y;
      num l = myComponent.length;

      x = event.touchX;
      y = event.touchY;
      
      /* calculate the drag force */
      num d = sqrt((x - x1)*(x - x1) + (y - y1) * (y - y1));
      num force = (l - d);
      num fx = force * (x1 - x) / d;
      num fy = force * (y1 - y) / d;
      /* if the other controlPoint is not connected, drag it */
      if (!myConjoint.isConnected) {
        
        myConjoint.x += fx;
        myConjoint.y += fy;
        /* move the slider */
        //this.myComponent.moveSlider(fx, fy);
      }
      /* if the other controlPoint is connected, rotate the component */
      else { 
        x -= fx;
        y -= fy;
      }
    }
    App.repaint();

  }

  void touchSlide(Contact event) {}
  

}

/** split one node into two nodes and then remove the joint node
@param cp    the component's control point that is going to be split
@return     void
*/
bool areCPListsEqual (List<ControlPoint> list1, List<ControlPoint> list2) {
  if (list1.length != list2.length) return false;
  for (int i=0; i < list1.length; i++) {
    if (list1[i] != list2[i]) return false;
  }
  return true;
}