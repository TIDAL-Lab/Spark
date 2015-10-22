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


class TouchManager {

  /* A list of touchable objects on the screen */
  List<Touchable> touchables = new List<Touchable>();
   
  /* Bindings from event IDs to touchable objects */
  Map<int, Touchable> touch_bindings = new Map<int, Touchable>();
   
  /* Is the mouse currently down */
  bool mdown = false;
  
  /* Element that receives touch or mouse events */
  Element parent = null;
  
  /* Touch event frame from microsoft surface */
  var pframe = null;
     
  TouchManager();
   

/*
 * The main class must call this method to enable mouse and touch input
 */ 
  void registerEvents(Element element) {
    parent = element;
    
    //element.onMouseDown.listen((e) => _mouseDown(e));
    //element.onMouseUp.listen((e) => _mouseUp(e));
    //element.onMouseMove.listen((e) => _mouseMove(e));
    //element.onMouseOut.listen((e) => _mouseExit(e));
    element.onTouchStart.listen((e) => _touchDown(e));
    element.onTouchMove.listen((e) => _touchDrag(e));
    element.onTouchEnd.listen((e) => _touchUp(e));
      
    // Prevent screen from dragging on ipad
    document.onTouchMove.listen((e) => e.preventDefault());
    
    print("register events");
/*    
    // Attempt to connect to the microsoft surface input stream
    try {
      var socket = new WebSocket("ws://localhost:405");
      socket.onOpen.listen((evt) => print("connected to surface."));
      socket.onMessage.listen((evt) => processTouches(evt.data));
      socket.onError.listen((evt) => print("error in surface connection."));
      socket.onClose.listen((evt) => print("surface connection closed."));
    }
    catch (x) {
      print("unable to connect to surface.");
    }
    */
  }
  
     
/*
 * Add a touchable object to the list
 */
  void addTouchable(Touchable t) {
    touchables.add(t);
  }
   

/*
 * Remove a touchable object from the master list
 */
  void removeTouchable(Touchable t) {
    touchables.remove(t);
  }
   
   
/*
 * Find a touchable object that intersects with the given touch event
 */
  Touchable findTouchTarget(Contact tp) {
    for (int i=touchables.length - 1; i >= 0; i--) {
      if (touchables[i].containsTouch(tp)) {
        return touchables[i];
      }
    }
    return null;
  }
   

/*
 * Convert mouseUp to touchUp events
 */
  void _mouseUp(MouseEvent evt) {
    Touchable target = touch_bindings[-1];
    if (target != null) {
      Contact c = new Contact.fromMouse(evt);
      target.touchUp(c);
    }
    touch_bindings[-1] = null;
    mdown = false;
  }
  
  
/*
 * Convert mouseOut to touchExit event
 */
  void _mouseExit(MouseEvent evt) {
    Touchable target = touch_bindings[-1];
    if (target != null) {
      Contact c = new Contact.fromMouse(evt);
      target.touchUp(c);
    }
    touch_bindings[-1] = null;
    mdown = false;
  }
   
   
/*
 * Convert mouseDown to touchDown events
 */
  void _mouseDown(MouseEvent evt) {
    Contact t = new Contact.fromMouse(evt);
    Touchable target = findTouchTarget(t);
    if (target != null) {
      if (target.touchDown(t)) {
        touch_bindings[-1] = target;
      }
    }
    mdown = true;
  }
   
   
/*
 * Convert mouseMove to touchDrag events
 */
  void _mouseMove(MouseEvent evt) {
    if (mdown) {
      Contact t = new Contact.fromMouse(evt);
      Touchable target = touch_bindings[-1];
      if (target != null) {
        target.touchDrag(t);
      } else {
        target = findTouchTarget(t);
        if (target != null) {
          target.touchSlide(t);
        }
      }
    }
  }
   
   
  void _touchDown(var tframe) {
    for (Touch touch in tframe.changedTouches) {
      Contact t = new Contact.fromTouch(touch, parent);
      Touchable target = findTouchTarget(t);
      if (target != null) {
        if (target.touchDown(t)) {
          touch_bindings[t.id] = target;
        }
      }
    }
  }
   
   
  void _touchUp(var tframe) {
    for (Touch touch in tframe.changedTouches) {
      Contact t = new Contact.fromTouch(touch, parent);
      Touchable target = touch_bindings[t.id];
      if (target != null) {
        target.touchUp(t);
        touch_bindings[t.id] = null;
      }
    }
    if (tframe.touches.length == 0) {
      touch_bindings.clear();
    }
  }
   
   
  void _touchDrag(var tframe) {
    for (Touch touch in tframe.changedTouches) {
      Contact t = new Contact.fromTouch(touch, parent);
      Touchable target = touch_bindings[t.id];
      if (target != null) {
        target.touchDrag(t);
      } else {
        target = findTouchTarget(t);
        if (target != null) {
          target.touchSlide(t);
        }
      }
    }
  }
  void _psTouchDown(var tframe) {
    for (Contact t in tframe) {
      Touchable target = findTouchTarget(t);
      if (target != null) {
        if (target.touchDown(t)) {
          touch_bindings[t.id] = target;
        }
      }
    }
  }
   
   
  void _psTouchUp(var tframe) {
    for (Contact t in tframe) {
      Touchable target = touch_bindings[t.id];
      if (target != null) {
        target.touchUp(t);
        touch_bindings[t.id] = null;
      }
    }
  }
   
   
  void _psTouchDrag(var tframe) {
    for (Contact t in tframe) {
      Touchable target = touch_bindings[t.id];
      if (target != null) {
        target.touchDrag(t);
      } else {
        target = findTouchTarget(t);
        if (target != null) {
          target.touchSlide(t);
        }
      }
    }
  }
  /*
   * Process JSON touch events from microsoft surface
   */
  void processTouches(data) {
    var frame = JSON.decode(data);

    var changed = [];
    bool down = false;
    bool drag = false;
    bool up = false;

    for (var t in frame['touches']) {
      if (t["down"]) {
        changed.add(new Contact.fromJSON(t));
        down = true;
      }
      else if (t["drag"]) {
        changed.add(new Contact.fromJSON(t));
        drag = true;
      }
      else if (t["up"]) {
        changed.add(new Contact.fromJSON(t));
        up = true;
      }
    }

    frame["changedTouches"] = changed;
    if (down) _psTouchDown(changed);
    if (drag) _psTouchDrag(changed);
    if (up) _psTouchUp(changed);
    
    if (changed.length > 0) {
      Contact c = changed[0];
      int mx = c.touchX.toInt();
      int my = c.touchY.toInt();
      String type = "mousedown";
      if (drag) type = "mousemove";
      if (up) type = "mouseup";
      //sendMouseEvent(mx, my, type);
    }

    pframe = frame;
  }
  
  void sendMouseEvent(int mx, int my, String type) {
    Element el = document.elementFromPoint(mx, my);
    if (el != null) {
      if (el is ButtonElement || el is InputElement) {
        MouseEvent me = new MouseEvent(type, screenX : mx, screenY : my, clientX : mx, clientY : my);
        el.dispatchEvent(me);
        print("dispatched $type");
      }
    }  
  }
}


/*
 * Objects on the screen must implement this interface to receive touch events
 */
abstract class Touchable {
  
  bool containsTouch(Contact event);
   
  // This gets fired if a touch down lands on the touchable object. 
  // Return true to 'own' the touch event for the duration 
  // Return false to ignore the event (e.g. if disabled or if you want slide events)
  bool touchDown(Contact event);
   
  void touchUp(Contact event);
   
  // This gets fired only after a touchDown lands on the touchable object
  void touchDrag(Contact event);
   
  // This gets fired when an unbound touch events slides over an object
  void touchSlide(Contact event);

}


class Contact {
  int id;
  int tagId = -1;
  num touchX = 0;
  num touchY = 0;
  bool tag = false;
  bool up = false;
  bool down = false;
  bool drag = false;
  bool finger = false;
  
  Contact(this.id);
  
  Contact.fromMouse(MouseEvent mouse) {
    id = -1;
    touchX = mouse.offset.x.toDouble();
    touchY = mouse.offset.y.toDouble();
    finger = true;
  }

  
  Contact.fromTouch(Touch touch, Element parent) {
    num left = window.pageXOffset;
    num top = window.pageYOffset;
    
    if (parent != null) {
      Rectangle box = parent.getBoundingClientRect();
      left += box.left;
      top += box.top;
    }
    
    id = touch.identifier;
    touchX = touch.page.x.toDouble() - left;
    touchY = touch.page.y.toDouble() - top;
    finger = true;
  }
  
  Contact.fromJSON(var json) {
    id = json['identifier'];
    touchX = json['pageX'];
    touchY = json['pageY'];
    up = json['up'];
    down = json['down'];
    drag = json['drag'];
    tag = json['tag'];
    tagId = json['tagId'];
  }
}