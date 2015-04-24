
//////////////////////////////////////////////////////////////
// Statechart Events
//////////////////////////////////////////////////////////////
package( "core.statechart.events", function() {

  /**
   * Defines the base StatechartEvent object. The ScEvent is a wrapper for
   * an event and some data
   *
   * @param event - the trigger that should be fired
   * @param data - the event data to pass into the statechart
   */
  define(
    function ScEvent(event, data){
      var _event = event,
        _data = data;

      self.getData = function() {
        return _data;
      };

      self.getEvent = function() {
        return _event;
      };

      self.setData = function(data) {
        _data = data;
      };

      self.setEvent = function(event) {
        _event = event;
      };
  });

  /**
   * Provices a wrapper for mouse events. Maps generic mouse event data to
   * events usable by the statechart
   *
   * Extends ScEvent
   */
  extend(
    this.ScEvent,
    function MouseEvent(event, data) {
      var button,
        type,
        eventString;

      function getButton() {
        var which = "",
          data = self.getData();

        console.log(data);
        if(data)
          switch(data.which) {
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
      };

      function getEventType() {
        var data = self.getData();

        console.log(data);
        if(data)
          return data.type.replace(/mouse/, "");
        else
          return "";
      };

      self.trigger = function() {
        var event = self.getEvent();

        if(event)
          return getButton() + "_" + getEventType();
        else
          return undefined;
      };

      ////////////////////////////////////
      // Constructor
      ////////////////////////////////////
      self.setData(data);
      self.setEvent(event);
    });

});

//////////////////////////////////////////////////////////////
// Statecharts!
//////////////////////////////////////////////////////////////
// TODO fix the require scope...
require("core.statechart.events", function(){
package( "core.statechart", function() {

  /**
   * Wrapper for a statechart. This initializes with a root composite state
   * (ie an OR-state) by default
   *
   * @param name - the name of the statechart
   */
  define(
    function Statechart(name) {
      ////////////////////////////////////
      // Private
      ////////////////////////////////////
      var current,
        macrosteps = [],
        microsteps = [],
        // TODO: core.statechart should be local...
        // Local require?
        root = new core.statechart.state.CompositeState("_root"),
        running = false;

      function fireMicro(evt) {
        microsteps.push(evt);

        if(!running) {
          running = true;

          while(microsteps.length > 0) {
            var activeTransitions = root.getCurrent().getOutgoing(),
              step = microsteps.shift();

            var t = activeTransitions[step.getEvent()];
            if(t) {
              if(t.test(step.getEvent(), step.getData()))
                root.setCurrent(t.fire(step.getEvent(), step.getData()));
            }
          }

          running = false;
        }
      };

      ////////////////////////////////////
      // Pubic
      ////////////////////////////////////
      self.current = function() {
        return root.getCurrent();
      };

      self.fire = function(evt, data) {
        var event = new core.statechart.events.MouseEvent(evt, data);

        macrosteps.push(event);
        if(!running) {
          while(macrosteps.length > 0) {
            var step = macrosteps.shift();
            fireMicro(step);
          }

          fireMicro(new core.statechart.events.MouseEvent(undefined, undefined));
        }
      };

      self.root = function() {
        return root;
      };

    });

  package("state", function() {

    /**
     * A base state, capable of enter and exit actions.
     */
    define(
      function BasicState(name){

        var incomingPaths = {},
          outgoingPaths = {};

        self.name = name;

        self.addIncoming = function(path) {
          incomingPaths[path.events[0]] = path;
        };

        self.addOutgoing = function(path) {
          outgoingPaths[path.events[0]] = path;
        };

        self.enter = function(event, data){};

        self.exit = function(event, data){};

        self.getIncoming = function() {
          return incomingPaths;
        };

        self.getOutgoing = function() {
          return outgoingPaths;
        };

        self.removeIncoming = function(state) {
          delete incomingPaths[state.name];
        };

        self.removeOutgoing = function(state) {
          delete outgoingPaths[state.name];
        };

      });

    /**
     * Composite states are OR-states, these are states that
     * contain inner states.
     *
     * TODO: top down or bottom up? What kind of SC is this...
     */
    extend(
      this.BasicState,
      function CompositeState(name) {

        var states = {},
          initialState,
          currentState;

        self.addState = function(state) {
          states[state.id] = state;
        };

        self.getCurrent = function() {
          return currentState;
        };

        self.getInitial = function() {
          return initialState;
        }

        self.removeState = function(state) {
          return delete states[state.id];
        };

        self.setCurrent = function(state) {
          console.log("Leaving " + currentState.name);
          currentState = state;
          console.log("Entering " + currentState.name);
        };

        self.setInitial = function(state) {
          initialState = state;

          if(!currentState)
            currentState = initialState;
        };

      });

      /**
       * Conditional state, this is basically syntactic sugar around a
       * basic state that automatically steps through the any valid
       * transitions
       */
      extend(
        this.BasicState,
        function IfState(name) {

          // Override BasicState's enter
          self.enter = function(event, data) {
            // Evaluate all transitions in order until a match
            // is found and then fire that
            var keys = Object.keys(this.getOutgoing());

            for(var i=0; i<keys.length; ++i) {
              var outgoing = this.getOutgoing[keys[i]];

              // TODO: bind this to the executing statechart...
              if(outgoing.test(event, data)) {
                outgoing.fire(event, data);
                break;
              }
            }
          };

      });
    });

    package("transition", function() {

      /**
       * Connect two states together.
       *
       * TODO: events should be a JSON object
       * @param events - an array of events that this transition responds to
       * @param from - where are we coming from?
       * @param to - where are we going to?
       * @triggers - an array of triggers to fire after this transition has stepped
       * @guard - the guard condition on this transition
       */
      define(
        function Transition(events, from, to, triggers, guard){
          ////////////////////////////////////
          // Private
          ////////////////////////////////////
          function step(event, data) {
            if(from)
              from.exit(event, data);

            if(to)
              to.enter(event, data);

            return to;
          }

          ////////////////////////////////////
          // Public
          ////////////////////////////////////
          self.test = function(event, data) {
            return self.events.indexOf(event) != -1 &&
              ((!self.guard) || (self.guard && self.guard()));
          }

          self.fire = function(event, data) {
            var ret = from;

            if(self.test(event, data)) {
              ret = step(event, data);

              if(triggers)
                for(var i=0; i<triggers.length; ++i) {
                  // fire transition events on the state machine somehow...
                }
            }

            return ret;
          };

          self.setFrom = function(state) {
            if(from)
              from.removeOutgoing(self);

            from = state;

            if(from)
              from.addOutgoing(self);
          };

          self.setTo = function(state) {
            if(to)
              to.removeIncoming(self);

            to = state;

            if(to)
              to.addIncoming(self);
          };

          ////////////////////////////////////
          // Constructor
          ////////////////////////////////////
          if(!events)
            events = [undefined];
          else if(typeof events == "string")
            events = [events];

          self.triggers = triggers || [];
          self.events = events;
          self.guard = guard;

          self.setFrom(from);
          self.setTo(to);

      });

      /**
       * Transition that is capable of performing some action while transitioning
       * from one state to the next
       */
      inherit(
        this.Transition,
        function ActiveTransition(events, from, to, triggers, guard, perform){

          // Directly override the internal scope of
          // version of step in Transition :O
          function step(event, data) {
            if(from)
              from.exit(event, data);

            // Boom. We now have a transition that can perform an event
            if(perform) {
              console.log("Performing transition action");
              perform(event, data);
            }

            if(to)
              to.enter(event, data);

            return to;
          }

        });

    });
  });
});
