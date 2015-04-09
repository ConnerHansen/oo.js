//////////////////////////////////////////////////////////////
// Statecharts!
//////////////////////////////////////////////////////////////
package( "oo.statechart", function() {

  /// Statechart is capable of executing its own set of states.
  this.class(
    function Statechart(name) {
        var current,
          macrosteps = [],
          microsteps = [],
          root = new oo.statechart.state.CompositeState("_root"),
          running = false;

        ////////////////////////////////////
        // Private!
        ////////////////////////////////////
        function fireMicro(event, data) {
          microsteps.push([event, data]);

          if(!running) {
            running = true;

            while(microsteps.length > 0) {
              var activeTransitions = root.getCurrent().getOutgoing(),
                ms = microsteps.shift(),
                event = ms[0],
                data = ms[1];

              var t = activeTransitions[event];
              if(t) {
                if(t.test(event, data))
                  root.setCurrent(t.fire(event, data));
              }
            }

            running = false;
          }
        }

        ////////////////////////////////////
        // Pubic!
        ////////////////////////////////////
        this.current = function() {
          return root.getCurrent();
        };

        this.fire = function(event, data) {
          // console.log("Firing: " + event);

          macrosteps.push([event, data]);
          if(!running) {
            while(macrosteps.length > 0) {
              var ms = macrosteps.shift();
              fireMicro(ms[0], ms[1]);
            }

            fireMicro();
          }
        };

        this.root = function() {
          return root;
        };

      });
  });

package("oo.statechart.state", function() {

  /// BasicState and adds incoming and outgoing transitions
  this.class(
    function BasicState(name){
      var incomingPaths = {},
        outgoingPaths = {};

      this.name = name;

      this.addIncoming = function(path) {
        incomingPaths[path.events[0]] = path;
      };

      this.addOutgoing = function(path) {
        outgoingPaths[path.events[0]] = path;
      };

      this.enter = function(event, data){};

      this.exit = function(event, data){};

      this.getIncoming = function() {
        return incomingPaths;
      };

      this.getOutgoing = function() {
        return outgoingPaths;
      };

      this.removeIncoming = function(state) {
        delete incomingPaths[state.name];
      };

      this.removeOutgoing = function(state) {
        delete outgoingPaths[state.name];
      };

    });

  /// CompositeState extends BasicState and adds the ability to track internal states.
  this.extend(
    this.BasicState,
    function CompositeState(name) {
      var states = {},
        initialState,
        currentState;

      this.addState = function(state) {
        states[state.id] = state;
      };

      this.getCurrent = function() {
        return currentState;
      };

      this.getInitial = function() {
        return initialState;
      }

      this.removeState = function(state) {
        return delete states[state.id];
      };

      this.setCurrent = function(state) {
        console.log("Leaving " + currentState.name);
        currentState = state;
        console.log("Entering " + currentState.name);
      };

      this.setInitial = function(state) {
        initialState = state;

        if(!currentState)
          currentState = initialState;
      };
    });
});

package("oo.statechart.transition", function() {

  /// Transition
  /// transitions connect two classes
  this.class(
    function Transition(events, from, to, triggers, guard){
      /////////////////////////////
      // private :)
      /////////////////////////////
      function step(event, data) {
        if(from)
          from.exit(event, data);

        if(to)
          to.enter(event, data);

        return to;
      }

      /////////////////////////////
      // public :D
      /////////////////////////////
      this.test = function(event, data) {
        return this.events.indexOf(event) != -1 &&
          ((!this.guard) || (this.guard && this.guard()));
      }

      this.fire = function(event, data) {
        var ret = from;

        if(this.test(event, data)) {
          ret = step(event, data);

          if(triggers)
            for(var i=0; i<triggers.length; ++i) {
              // fire transition events on the state machine somehow...
            }
        }

        return ret;
      };

      this.setFrom = function(state) {
        if(from)
          from.removeOutgoing(this);

        from = state;

        if(from)
          from.addOutgoing(this);
      };

      this.setTo = function(state) {
        if(to)
          to.removeIncoming(this);

        to = state;

        if(to)
          to.addIncoming(this);
      };

      /////////////////////////////
      // constructor logic...
      /////////////////////////////
      if(typeof events == "string")
        events = [events];
      else if(events == undefined)
        events = [undefined];

      this.triggers = triggers || [];
      this.events = events;
      this.guard = guard;

      this.setFrom(from);
      this.setTo(to);

  });
});

package("oo.statechart.state", function() {

  this.extend(
    BasicState,
    function IfState(name) {

      // Enter the state
      this.enter = function(event, data) {
        // Evaluate all transitions in order until a match
        // is found and then fire that
        var keys = Object.keys(this.getOutgoing());

        for(var i=0; i<keys.length; ++i) {
          var outgoing = this.getOutgoing[keys[i]];

          if(outgoing.test(event, data)) {
            outgoing.fire(event, data);
          }
        }
      };

  });

});

package("oo.statechart.transition", function() {

  this.inherit(
    Transition,
    function ActiveTransition(event, from, to, triggers, guard, perform){

      // Directly override the internal scope of
      // version of step in Transition :O
      function step(event, data) {
        this.from.exit(event, data);
        // Boom. We now have a transition that can perform an event
        if(perform)
          perform();

        this.to.enter(event, data);
      }

    });

});

package( "oo.statechart.events", function() {

  /// Mouse Event provides a set of convenience functions for a mouse event.
  /// This is used for statechart events
  this.class(
    function MouseEvent(event) {

      var button = getButton(event),
        type = getEventType(),
        eventString = button + "_" + type;

      function getButton() {
        var which;

        switch(event.which) {
          case 1:
            which = "left"
            break;
          case 2:
            which = "middle"
            break;
          case 3:
            which = "right"
            break;
          default:
            which = "mouse";
        }

        return which;
      }

      function getEventType() {
        return event.type.replace(/mouse/, "");
      }

      this.trigger = function() {
        return eventString;
      }

    });

});

package("model", function(){
  // Concrete element
  this.class(
    function ConcreteElement(name) {
      this.abstract = null;
      this.x = 0;
      this.y = 0;
      this.name = name;

      // Inner implementation.
      function render() {
        throw new Error("function has not been implemented!");
      }

      this.render = function() {
        render();
      };
  });

  // Abstract element!
  this.class(
    function AbstractElement(name) {
      this.name = name;
  });

});

package("model", function(){
  // Inherit ConcreteElement and modify its private scope
  this.inherit( ConcreteElement,
    function ConcreteBox(name, abstract) {
      // I need to figure out a better way to scope this.
      this.abstract = abstract || new model.AbstractBox(name);

      function render() {
        console.log("woo!");
      }

      type(model.AbstractBox, this.abstract);
  });

  // Extend AbstractElement -- we're only adding
  this.extend( AbstractElement,
    function AbstractBox(name) {
      this.width = 0;
      this.height = 0;
  });

});

// Now execute a block!
// require("model", function(){
//   box1 = new ConcreteBox("Test Box!");
//
//   // Watch, we overrode the private scope!
//   box1.render();
// });

// Now do something!
require(
"oo.statechart",
"oo.statechart.state",
"oo.statechart.transition",
"oo.statechart.events",
  function() {


    // Create a basic statechart
    var sc = new Statechart( "Sample Statechart" ),
      startState = new BasicState("Initialize"),
      waitState = new BasicState("Wait State"),
      choice = new IfState("Choice"),
      mouseFollow = new IfState("Mouse Follow"),

      mouseDown = new BasicState("Mouse Down"),
      mouseDragging = new BasicState("Mouse Dragging"),
      mouseFollowing = new BasicState("Mouse Following"),

      doneInitializing = new Transition(undefined, startState, waitState),

      eventMouseFollow = new Transition("mouse_move", waitState, mouseFollow),
      eventMouseFollow = new Transition(undefined, mouseFollow, waitState),
      eventMouseDown = new Transition("left_down", waitState, mouseDown),
      eventMouseDragging = new Transition("left_move", mouseDown, mouseDragging),
      eventMouseContDragging = new Transition("left_move", mouseDragging, mouseDragging),
      eventMDReleased = new Transition("left_up", mouseDragging, waitState);

    var body = document.getElementsByTagName("body")[0],
      draggableDiv = document.getElementById("draggable"),
      mouseDiv = document.getElementById("mouse");

    mouseDragging.enter = function(event, data) {
      draggableDiv.style["left"] = data.x + "px";
      draggableDiv.style["top"] = data.y + "px";
    };

    mouseFollow.enter = function(event, data) {
      mouseDiv.style["left"] = data.x + "px";
      mouseDiv.style["top"] = data.y + "px";
    };

    body.onmousemove = function(event) {
      var mEvent = new MouseEvent(event);
      sc.fire(mEvent.trigger(), event);
    };

    body.onmousedown = function(event) {
      var mEvent = new MouseEvent(event);
      sc.fire(mEvent.trigger(), event);
    };

    body.onmouseup = function(event) {
      var mEvent = new MouseEvent(event);
      sc.fire(mEvent.trigger(), event);
    };

    body.onmousewheel = function(event) {
      var mEvent = new MouseEvent(event);
      sc.fire(mEvent.trigger(), event);
    };

    sc.root().setInitial(startState);
    sc.fire();
  });
