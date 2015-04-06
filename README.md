# oo.js
Yet another object oriented JS library

# Example of Package Declaration
```javascript
package("oo.statechart.state")
  .class( "AbstractState",
    function(){
      this.name = undefined;

      this.enter = function(){};
      this.exit = function(){};
    })
  .class( "BasicState", "AbstractState",
    function(name){
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
  .class( "CompositeState", "BasicState",
    function(name) {
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

# Example using Require
```javascript
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

    window.sc = sc;
  });
```
