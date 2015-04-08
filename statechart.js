//////////////////////////////////////////////////////////////
// Statecharts!
//////////////////////////////////////////////////////////////
package( "oo.statechart")
  .class( function Statechart(name) {
      include(
      "oo.statechart.state",
      "oo.statechart.transition",
        function(){
          var current,
            macrosteps = [],
            microsteps = [],
            root = new CompositeState("_root"),
            running = false;

          function fireMicro(event, data) {
            microsteps.push(event);

            if(!running) {
              running = true;

              while(microsteps.length > 0) {
                var activeTransitions = root.getCurrent().getOutgoing(),
                  event = microsteps.shift();

                var t = activeTransitions[event];
                if(t) {
                  if(t.test(event))
                    root.setCurrent(t.fire(event));
                }
                // for(var i=0; i<activeTransitions.length; ++i) {
                //   var t = activeTransitions[i];
                //
                //   if(t.test(event)) {
                //     root.setCurrent(t.fire(event));
                //     // root.setCurrent(t.step());
                //   }
                // }
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
            console.log("Firing: " + event);

            macrosteps.push(event);
            if(!running) {
              while(macrosteps.length > 0) {
                fireMicro(macrosteps.shift());
              }
            }
          };

          this.root = function() {
            return root;
          };

        }).apply(this);
    });

package("oo.statechart.state")
.class(function AbstractState(){
      this.name = undefined;

      this.enter = function(){};
      this.exit = function(){};
    })
.class("AbstractState",
    function BasicState(name){
      var incomingPaths = {},
        outgoingPaths = {};

      this.name = name;

      this.addIncoming = function(path) {
        incomingPaths[path.events] = path;
      };

      this.addOutgoing = function(path) {
        outgoingPaths[path.events] = path;
      };

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

    })
.class("BasicState",
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
        currentState = state;
      };

      this.setInitial = function(state) {
        initialState = state;

        if(!currentState)
          currentState = initialState;
      };
    });

package("oo.statechart.transition")
.class( function Transition(events, from, to, triggers, guard){
      /////////////////////////////
      // private :)
      /////////////////////////////
      function step() {
        if(from)
          from.exit();

        if(to)
          to.enter();

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
          ret = step();

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

      this.triggers = triggers || [];
      this.events = events;
      this.guard = guard;

      this.setFrom(from);
      this.setTo(to);

  });
// .class(
//   inherit(oo.statechart.transition.Transition,
//   function ActiveTransition(event, from, to, triggers, guard, perform){
//
//     // Directly override the internal scope of
//     // version of step in Transition :o
//     function step() {
//       this.from.exit();
//       // Boom. We now have a transition that can perform an event
//       if(perform)
//         perform();
//       this.to.enter();
//     }
//
// }));

// Package declaration within the required scope
// TODO: consider this, it seems a little cleaner
// require("oo.statechart.state",
//   function(){
//     debugger;
//     this.class(
//       extend(BasicState,
//       function ElseState(name){
//
//       }));
//   });
//
//
// Okay, evaluation #2:
// -- package( id ) - creates/gets package
// -- package( id, func ) - creates/gets package, executes in the current scope

// "Classic" package declaration
package("oo.statechart.state", function() {

  this.class(
    function BasicState(name){
      var incomingPaths = {},
        outgoingPaths = {};


      this.addIncoming = function(path) {
        incomingPaths[path.events] = path;
      };

      this.addOutgoing = function(path) {
        outgoingPaths[path.events] = path;
      };

      this.enter = function(){
      };

      this.exit = function(){
      };

      this.getIncoming = function() {
        return incomingPaths;
      };

      this.getName = function() {
        return name;
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

});

package("oo.statechart.state", function() {

  this.extend(
    BasicState,
    function IfState(name) {

      // Enter the state
      this.enter = function() {
        // Evaluate all transitions in order until a match
        // is found and then fire that
      };

  });

});

package("oo.statechart.transition", function() {

  this.inherit(
    Transition,
    function ActiveTransition(event, from, to, triggers, guard, perform){

      // Directly override the internal scope of
      // version of step in Transition :O
      function step() {
        this.from.exit();
        // Boom. We now have a transition that can perform an event
        if(perform)
          perform();
          
        this.to.enter();
      }

    });

});

// Now do something!
require(
"oo.statechart",
"oo.statechart.state",
"oo.statechart.transition",
  function() {
    // Create a basic statechart
    var sc = new Statechart( "Sample Statechart" ),
      b1 = new BasicState("Initial State"),
      b2 = new BasicState("Wait State"),
      t1,
      t2;

    sc.root().setInitial(b1);
    sc.root().addState(b1);
    sc.root().addState(b2);

    t1 = new Transition("a", b1, b2, ["b", "c"]);
    t2 = new Transition("b", b2, b1, ["c"]);

    console.log( "Current state: " + sc.current().name);
    sc.fire("a");
    console.log( "Current state: " + sc.current().name);
    sc.fire("b");
    console.log( "Current state: " + sc.current().name);
  });
