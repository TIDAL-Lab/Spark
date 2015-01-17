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
/**
 *  circuit class implements a circuit analyzer based on Kirchhoff’s circuit laws
 *  to calculate the currents and voltage drops of each component. 
 *  The circuit analyzer runs every time that a change is introduced to the
circuit, which then updates and stores the new variables of each component. 
*/


class Circuit {
/* ------------------------
  Class variables
 * ------------------------ */
  
  List<Edge> edges;
  List<Node> nodes;
  //List<ConnectedGraph> graphs;
  List<Loop> loops;
  num numCG;
  num time;
  Matrix solution;
  List<Battery> burntBatteries;
  num maxCurrent = 10;


/* ------------------------
  Constructor
 * ------------------------ */

  Circuit() {
    //this.app = app;
    nodes = new List<Node>();
    edges = new List<Edge>();
  }
  
/* ------------------------
  Solving the Circuit Methods
 * ------------------------ */
  /** solve the circuit, update the components' variables and send the JSON data to the server
   */  
  void solve() {
    resetGraph();
    findSpanningForest();
    var backEdges = edges.where((e) => e.label == 'back'); //note: backEdges is a "lazy" iterable
    for (Edge b in backEdges) {
      loops.add(findLoop(b));
    }
    
    KirchhoffSolver circuitSolver = new KirchhoffSolver(this);

    solution = circuitSolver.ApplySolver();
    for (int i=0; i < loops.length; i++) {
      loops[i].current = solution.get(i,0);
    }
    
    updateComponents();
    theApp.model1.updateModel();     
    sendDataToServer();
  }


  /** reset the graph to be revisited
   */  
  void resetGraph() {
    loops = new List<Loop>();
    for (Node n in nodes) {
      n.visited = false;
      n.parent = null;
      n.discoverTime = 0;
    }
    for (Edge e in edges) {
      e.loops = new List<Loop>();
      e.label = null;
    }
  }
  
  /** update the circuit variables of each component using the above solution. 
   */  
  void updateComponents () {
    for (Edge e in this.edges) {
      Component c = e.component;
      c.current = 0.0;
      for (Loop l in e.loops) {
        c.current += l.current;
      }
      c.direction = 0;
      if (c.current != 0) {
        c.direction = e.direction * c.current.sign;
      }
      c.current = c.current.abs();
      //if ( c.current > 0 ) { c.direction = 1; } // flow of electrons from start to end
      //else if ( c.current < 0 ) { c.direction = -1; } // flow of electrons from end to start
      //else { c.direction = 0; }
      
      if (!(c is Battery))
       { c.voltageDrop = c.resistance * c.current; }
      if (c is Bulb) {
        if (c.current != 0.0 && !(c as Bulb).isOn) (c as Bulb).turnOn();
        if (c.current == 0.0 && (c as Bulb).isOn) (c as Bulb).turnOff();
      }
      if (c is Battery && c.current > maxCurrent) { // a short circuit
        (c as Battery).burn(); 
        burntBatteries.add(c as Battery);        
      }
    }
  }
  
  /** create JSON data and send the string to the server
   */
  void sendDataToServer() {
    var myObj = new JsArray();
    //added to access canvas element
    CanvasElement canvas = 
          document.querySelector('#foreground');
    
    for (Edge e in this.edges) {
      
      Component c = e.component;
        var anObj = new JsObject.jsify({'type': c.type,
                                          'voltageDrop': c.voltageDrop,
                                          'current': c.current,
                                          'resistance': c.resistance,
                                          'startX': (((c.start.x -canvas.width/2)/canvas.width/2) + 0.1)*20,
                                          'startY':((c.start.y-canvas.height/2)/canvas.height/2)* 10 ,
                                          'endX': (((c.end.x - canvas.width/2)/canvas.width/2) + 0.1)*20,//shifted it by 0.1 so that it's visble on webgl scene
                                          'endY': ((c.end.y - canvas.height/2)/canvas.height/2)*10,
                                          'direction': c.direction,
                                          'innerWall':1, //returnDirection(c.start.x, c.end.x, c.start.y, c.end.y)
                                          'tag': c.ARTag
                                          });
        myObj.add(anObj);


    }

    var deleteParse = new JsObject(context['deleteParse'],[myObj]);
    deleteParse.callMethod('doDeleteParse'); 

  }
/* ------------------------
  Reflecting the touch changes into the circuit graph representation
 * ------------------------ */  
  /** called when a new component is added
  @param c    component
  @return     void
  */
  
  void addNewBranch (Component c) {
    Node n1 = new Node();
    c.start.node = n1;
    Node n2 = new Node();
    c.end.node = n2;
    Edge e = new Edge(n1, n2);
    e.component = c;
    
    nodes.add(n1);
    nodes.add(n2);
    edges.add(e);
    
    n1.adjacents.add(n2);
    n2.adjacents.add(n1);
    sendDataToServer();
  }
  
  /*int returnDirection(double x0,double x1,double y0,double y1){
      var n = 0;
      var grad = 0;
      var deltaY = y1-y0;
      var deltaX = x1-x0;
      if (deltaX == 0){
        n = 1;
      }else{
        grad = deltaY/deltaX;
      }
      if ( grad.abs() < 1){
        if (grad < 0){
          n = 3;
        }else{
          n = 2;
        }
      }else if(grad.abs() > 1){
        if (grad < 0){
          n = 0;
        }else{
          n = 1;
        }
      }
      
      return n;
    }*/
  
  /** remove a branch. For now, a branch can be removed only when it is disconnected.
  @param b    branch to be removed
  @return     void
  */

  void removeBranch (Component c) {
    Node n1 = c.start.node;
    Node n2 = c.end.node;
    Edge e = getEdge(n1, n2); 
    this.nodes.remove(n1);
    this.nodes.remove(n2);
    this.edges.remove(e);
    sendDataToServer();    
  }
 
  
  /** when two nodes are connected, unite the nodes into one joint node and then remove the old node.
  @param dragged    first cp whose node is going to be collapsed
  @param other    second cp whose node is going to be collapsed
  @return     void
  */
  
  void collapseNode( ControlPoint dragged, ControlPoint other ) {
    Node old1 = dragged.node;
    Node old2 = other.node;
    Node newNode = new Node();
    newNode.adjacents.addAll(old1.adjacents);
    newNode.adjacents.addAll(old2.adjacents);
   
    
    dragged.node = newNode;
    for (ControlPoint cp in dragged.connections) {
      cp.node = newNode;
    }
    
    for (Node n in old1.adjacents) {
      Edge e = getEdge(old1, n);
      if ( e.nodes[0] == old1 ) { e.nodes[0] = newNode; }
      else { e.nodes[1] = newNode; }
      n.adjacents.remove(old1);
      n.adjacents.add(newNode);
    }
    
    for (Node n in old2.adjacents) {
      Edge e = getEdge(old2, n);
      if ( e.nodes[0] == old2 ) { e.nodes[0] = newNode; }
      else { e.nodes[1] = newNode; }
      n.adjacents.remove(old2);
      n.adjacents.add(newNode);
    }
    
    nodes.remove(old1);
    nodes.remove(old2);
    nodes.add(newNode);
    
    burntBatteries = new List<Battery>();
    this.solve();
    /* remove the burnt batteries from the graph */
//    for (Battery bb in burntBatteries) {
//      Node n1 = bb.start.node;
//      Node n2 = bb.end.node;
//      Edge e = getEdge(n1, n2); 
//      this.edges.remove(e);
//      n1.adjacents.remove(n2);
//      n2.adjacents.remove(n1);     
//    }
    if (!burntBatteries.isEmpty) {
      this.solve();
    }
    
    Sounds.playSound("ping");

  }
  
  /** split one node into two nodes and then remove the joint node
  @param cp    the component's control point that is going to be split
  @return     void
  */
  
  void splitNode (ControlPoint dragged, ControlPoint other) {
    Node newNode = new Node();
    dragged.node = newNode;
    other.node.adjacents.remove(dragged.myConjoint.node);
    newNode.adjacents.add(dragged.myConjoint.node);
    dragged.myConjoint.node.adjacents.add(newNode);
    dragged.myConjoint.node.adjacents.remove(other.node);
    Edge e = getEdge(other.node, dragged.myConjoint.node);
    if (e.nodes[0] == dragged.myConjoint.node) e.nodes[1] = newNode;
    else e.nodes[0] = newNode; 
    
    nodes.add(newNode);
    this.solve();
    
  }
/* ------------------------
  Graph Methods
 * ------------------------ */  
  /** find the edge for the two given nodes. The edge must exist otherwise it gives an error 
   @param list of edges
   @param first node
   @param second node
   @return edge
   */
  Edge getEdge(Node n1, Node n2) {
    return this.edges.singleWhere((e) => (e.nodes.contains(n1) && e.nodes.contains(n2)));
  }
  
  /** Depth-first search for finding a spanning forest of the circuit graph
  @param  nodes
  @return 
  */
  void findSpanningForest () {
    for (Edge e in this.edges) {
      e.label = 'back';
    }
    for (Node n in this.nodes) {
      n.visited = false;
      n.discoverTime = 0;
      n.parent = null;
    }
    numCG = 0;
    time = 0;
    for (Node n in this.nodes) {
      if (!n.visited) {      
        DFSVisit(n);
        numCG++;
      }
    }
  }
  
  void DFSVisit(Node u) {
    u.graphLabel = numCG;
    u.visited = true;
    u.discoverTime = time++;
    for (Node v in u.adjacents) {
      if (!v.visited) {
        getEdge(u, v).label = 'tree'; // mark edge as a tree edge
        v.parent = u;
        v.visited = true; 
        DFSVisit(v);
      }
    }
  }
  
  /** Given the back edge, find the corresponding loop 
  @param  Edge back edge
  @return Loop one loop containing the back edge
  */  
  Loop findLoop(Edge b) {
    Loop l = new Loop();
    Node start = b.nodes[0];
    Node end = b.nodes[1];
    b.direction = -1;
    if (start.discoverTime < end.discoverTime) {
      start = b.nodes[1];
      end = b.nodes[0];
      b.direction = 1;
    }     
    while (start != end) {
      Edge e = getEdge(start, start.parent);
      // this is for deciding the direction of edge for later calculations of current.
      if (e.nodes[0] == start) {
        e.direction = 1;
      } else {
        e.direction = -1;
      }
      l.path.add(e);
      e.loops.add(l);
      start = start.parent;     
    }
    l.path.add(b);
    b.loops.add(l);
    return l;
  }
  
  /** Prim's algorithm for finding a spanning tree of a connected graph
  @param  list of nodes
  @return list of connected graphs
  */
  /*
  void findSpanningTree (ConnectedGraph graph) {
    for (Node n in graph.nodes) {
      n.visited = false;
      n.parent = null;
      n.finished = false;
    }
    
    //List<Node> queue = graph.nodes;
    Node u = graph.nodes.first; // u is the root in Prim's algorithm
    u.visited = true;
    
    while (!graph.nodes.every((n) => n.isFinished)) {
      u = graph.nodes.firstWhere((n) => n.isVisited && !n.isFinished);
      for (Node v in u.adjacents) {
        if (v.visited == false && v.finished == false) {
          getEdge(graph.edges, u, v).label = 'tree'; // mark edge as a tree edge
          v.parent = u;
          v.visited = true;  
        }
        else if (v.visited == true && v.finished == false) {
          getEdge(graph.edges, u, v).label = 'back'; // mark edge as a back edge        
        }
      }
      u.finished = true;
    }
  }
  */
  
  void printGraph() {
    var obj = [];
    var s;
    for (Node n in nodes) {
      var p = n.parent;
        s = {
             'node': nodes.indexOf(n),
             'number of adjacents': n.adjacents.length,
             'visited': n.visited,
             'discover time': n.discoverTime,
             'parent': (n.parent == null ? 'null' : nodes.indexOf(n.parent)),
             'CG label': n.graphLabel

        };
    obj.add(s);
  }
    //for (int i=0; i < loops.length; i++) {
      
      //for (Edge e in loops[i].path) {
    for (Edge e in edges){
        s = {
             //'loop': i,
             'edge label': e.label,
             'first': nodes.indexOf(e.nodes[0]),
             'second': nodes.indexOf(e.nodes[1]),
             'component': e.component.type
        };
      obj.add(s);
    }
  //}
    print(JSON.encode(obj));
  }
}
/** ------------------------
  Loop Class: it creates a path in the form of list of nodes
 * ------------------------ */
class Loop {
  num current;
  List<Edge> path;
  
  Loop () {
    path = new List<Edge>();
    current = 0;
  }
}



/** ------------------------
  Edge Class
 * ------------------------ */
class Edge {
  List<Node> nodes;
  String label; // label is either 'tree' or 'back'
  List<Loop> loops;
  Component component;
  num direction = 0;
  
  Edge (Node first, Node second)
  {
    nodes = [first, second];
    loops = new List<Loop>();
    label = null;
  }
}
/** ------------------------
  Node Class
 * ------------------------ */
class Node{ 
  num graphLabel; //this label indicated what connected graph this node belongs to.
  bool visited; 
  num discoverTime;
  Node parent;
  List<Node> adjacents;

  Node() {
    adjacents = new List<Node>();
    visited = false;
    parent = null;
  }
  
  bool get isVisited => visited;
}