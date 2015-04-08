# oo.js
Yet another object oriented JS library. This implementation of Object Oriented design in JavaScript is meant to be an experiment. The idea here is to allow package and class construction that more closely resembles a "classical" OO structure. 

## Provided Functions
- **package( path, [func] )**
  - _path_ - the path of the package (ex: "org.sample.statechart" )
  - _[func]_ - the function to execute within the package scope
- **extend( class, def)**
- **inherit( class, def)**
- **require( path..., func)**
- **type( type, obj)**

# package
The basic concept here is to provide a simple way to declare a package and its classes. We also provide internal class, extend, and inherit functions for convenience.

Example of a class declaration:
```javascript
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
```

Example of a class extension:
```javascript
package("oo.statechart.state", function() {

  this.extend( BasicState,
    function IfState(name) {

      // Enter the state
      this.enter = function() {
        // Evaluate all transitions in order until a match
        // is found and then fire that
      };

  });

});
```

Example of class inheritance:
```javascript
package("oo.statechart.transition", function() {

  this.inherit( Transition,
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
```

# Class Chaining Declaration
```javascript
package("oo.statechart.state")
.class(
  function AbstractState(){
    this.name = undefined;

    this.enter = function(){};
    this.exit = function(){};
  })

.extend( "AbstractState",
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

.extend( "BasicState",
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
```

# require
The require call is used to execute a function within a mixed scope. The function takes in a series
of packages, and then executes the provided function. Require will bring in all of the classes in each
of the packages into the functions local scope -- which means they are directly accessible by name.
```javascript
require(
"oo.statechart",
"oo.statechart.state",
"oo.statechart.transition",
  function() {
    var sc = new Statechart( "Sample Statechart" ),
      basic1 = new BasicState("Initial State"),
      basic2 = new BasicState("Wait State"),
      transition1 = new Transition("a", basic1, basic2, ["b", "c"]),
      transition2 = new Transition("b", basic2, basic1, ["c"]);

    sc.root().setInitial(basic1);
    sc.root().addState(basic1);
    sc.root().addState(basic2);


    window.sc = sc;
  });
```
