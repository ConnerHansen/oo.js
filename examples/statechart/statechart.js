
//////////////////////////////////////////////////////////////
// Statechart Events
//////////////////////////////////////////////////////////////
package( "core.statechart.events", function() {

  /**
   * Defines the base StatechartEvent object. The StatechartEvent is a wrapper for
   * an event and some data
   *
   * @param event - the trigger that should be fired
   * @param data - the event data to pass into the statechart
   */
  define(
    function StatechartEvent(_event, _data){
      var event = _event,
        data = _data;

      rw("data", "event");
  });

  /**
   * Provides a wrapper for mouse events. Maps generic mouse event data to
   * events usable by the statechart
   *
   * Extends StatechartEvent
   */
  extend(
    self.StatechartEvent,
    function MouseEvent(_event, _data) {
      var button,
        type,
        eventString,
        trigger;

      rw("trigger");

      function getButton() {
        var which = "",
          data = self.getData();

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

        if(data)
          return data.type.replace(/mouse/, "");
        else
          return "";
      };

      var _setData = self.setData;
      self.setData = function(_data) {
        debugger;
        _setData(_data);

        if(_data)
          trigger = getButton() + getEventType();
        else
          trigger = undefined;

        self.setEvent(trigger);
      };

      ////////////////////////////////////
      // Constructor
      ////////////////////////////////////
      self.setData(_data);
      // self.setEvent(_event);
    });

});

//////////////////////////////////////////////////////////////
// Statecharts!
//////////////////////////////////////////////////////////////
require("core.statechart.events", function(){
package( "core.statechart", function() {

  package("state", function() {

    /**
     * A base state, capable of enter and exit actions.
     */
    define(
      function BasicState(name){

        var incoming = {},
          outgoing = {},
          statechart;

        r("incoming", "outgoing");
        rw("statechart", "name");

        self.name = name;

        self.addIncoming = function(path) {
          incoming[path.events[0]] = path;
        };

        self.addOutgoing = function(path) {
          outgoing[path.events[0]] = path;
        };

        // Do nothing by default
        self.enter = function(event, data){};
        self.exit = function(event, data){};

        self.removeIncoming = function(state) {
          delete incoming[state.name];
        };

        self.removeOutgoing = function(state) {
          delete outgoing[state.name];
        };

      });

    /**
     * Composite states are OR-states, these are states that
     * contain inner states.
     *
     * TODO: top down or bottom up? What kind of SC is this...
     */
    extend(
      self.BasicState,
      function CompositeState(name) {

        var states = {},
          initialState,
          currentState;

        function mergeKeys(left, right) {
          var hash = {},
            lKeys = Object.keys(left),
            rKeys = Object.keys(right);

          for(var i=0; i<lKeys.length; ++i) {
            hash[lKeys[i]] = left[lKeys[i]];
          }

          for(var i=0; i<rKeys.length; ++i) {
            hash[rKeys[i]] = right[rKeys[i]];
          }

          return hash;
        }

        //// Public
        self.addState = function(state) {
          states[state.id] = state;
        };

        self.getCurrent = function() {
          return currentState;
        };

        self.getInitial = function() {
          return initialState;
        }

        // Shadow the basic state's getOutgoing function
        var _getOutgoing = self.getOutgoing;
        self.getOutgoing = function() {
          var outgoing = _getOutgoing();

          if(currentState)
            return mergeKeys(outgoing, currentState.getOutgoing());
          else
            return outgoing;
        };

        self.removeState = function(state) {
          return delete states[state.id];
        };

        self.setCurrent = function(state) {
          // console.log("Leaving " + currentState.name);
          currentState = state;
          // console.log("Entering " + currentState.name);
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
        self.BasicState,
        function IfState(name) {

          // Override BasicState's enter
          self.enter = function(event, data) {
            // Evaluate all transitions in order until a match
            // is found and then fire that
            var keys = Object.keys(self.getOutgoing());

            for(var i=0; i<keys.length; ++i) {
              var outgoing = self.getOutgoing[keys[i]];

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
       * @param events - an array of events that this transition responds to
       * @param from - where are we coming from?
       * @param to - where are we going to?
       * @param triggers - an array of triggers to fire after this transition has stepped
       * @param guard - the guard function on this transition
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
        self.Transition,
        function ActiveTransition(events, from, to, triggers, guard, perform){

          // Directly override the internal scope of
          // version of step in Transition :O
          function step(event, data) {
            if(from)
              from.exit(event, data);

            // Boom. We now have a transition that can perform an event
            if(perform) {
              perform(event, data);
            }

            if(to)
              to.enter(event, data);

            return to;
          }

        });

    });

    /**
     * Wrapper for a statechart. This initializes with a root composite state
     * (ie an OR-state) by default
     *
     * @param name - the name of the statechart
     */
    define(
      "core.statechart.events",
      "core.statechart.state",
      "core.statechart.transition",
      function Statechart(name) {
        ////////////////////////////////////
        // Private
        ////////////////////////////////////
        var current,
          macrosteps = [],
          microsteps = [],
          defaultStep = new MouseEvent(undefined, undefined),
          root = new CompositeState("_root"),
          running = false;

        function fireMicro(evt) {
          microsteps.push(evt);

          if(!running) {
            running = true;

            while(microsteps.length > 0) {
              var activeTransitions = root.getOutgoing(),
                step = microsteps.shift();

              var t = activeTransitions[step.getEvent()];
              if(t) {
                if(t.test(step.getEvent(), step.getData())) {
                  root.setCurrent(t.fire(step.getEvent(), step.getData()));

                  if(typeof root.getCurrent() == "CompositeState") {

                  }
                }
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
          var event;

          // Check to see if we're looking at an event
          // TODO: add ability to see inheirtance chain
          if(evt && evt.getEvent != undefined && evt.getData != undefined)
            event = evt;
          else
            event = new StatechartEvent(evt, data);

          macrosteps.push(event);
          if(!running) {
            while(macrosteps.length > 0) {
              var step = macrosteps.shift();
              fireMicro(step);
            }

            fireMicro(defaultStep);
          }
        };

        self.root = function() {
          return root;
        };

      });

  }); // end of package
}); // end of require
