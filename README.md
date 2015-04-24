# oo.js
Yet another object oriented JS library. This implementation of Object Oriented design in JavaScript is meant to be an experiment, and as such is not intended for production usage yet. The underlying goal of oo.js is to allow package and class access/construction that more closely resembles a "classical" OO structure. The main oo.js script exposes a handful of functions to help achieve this.

# Functions
- **package( path, [func] )** - makes a package or executes within a package's scope
  - _path_ - the path of the package (ex: "org.sample.statechart" )
  - _[func]_ - the function to execute within the package scope
- **extend( class, def)** - extends the class scope with def
  - _class_ - the class to extend. This can either be a string name (if executed in the package scope) or a direct reference to the class. Extension will define a new class that is a chain of the extended and extending classes. This means that the private scope of _class_ will not be exposed to _def_, leaving _def_ only with access to the protected and public scopes.
  - _def_ - the definition of the new class to use. This must be a named function.
- **inherit( class, def)** - creates def within the class scope
  - _class_ - the class to inherit. This can either be a string name (if executed in the package scope) or a direct reference to the class. Inheritance will define a new class that is a union of the inherited and inheriting classes. This means that all of the inner workings of _class_ are exposed to _def_ directly as though they are in the same scope (ie, _def_ can see any vars declared in _class_). This means that all three scopes (private, protected, and public) will be shared between _class_ and _def_.
  - _def_ - the definition of the new class to use. This must be a named function.
- **require( path..., func)** - runs a function within a scope that is built out of all of the required packages
  - _path..._ - this is a variable length argument. Paths that are passed in can either be direct (ie: org.example.test_pkg) or by string reference (ie: "org.example.test_pkg"). You can include as many paths as you want, and all of their public scopes will be injected into _func_.
  - _func_ - the function to execute. This function will have direct access to all of the internal classes in the various paths passed in. Name collision is handled in a last-one-wins manner.
- **type( type, obj)** - Tests whether or not obj is the expected type. If not an exeception will be thrown
  - _type_ - string or object definition of the type to require an object to be. This does not yet support inheritance or extension.
  - _obj_ - the object to test.

### Inheritance vs Extension in oo.js
Inheritance can be thought of as meaning "I am _x_, but with fundamental differences." While extension can be thought of as "I am fundamentally _x_, but with additions." Here's a quick reference image to give an explanation of the difference between the two in oo.js:

![Blergh vs Blargh](https://raw.githubusercontent.com/ConnerHansen/oo.js/master/oo.js%20philosophy.png)

In the extension block, we can see that the root scope and added scope are isolated from each other. They share the protected ($this) and public (this) scopes for the class, but do not share the private scope. In the inheritance block, we can see that the root scope and added scope are ultimately merged together. They share all three scopes: public (this), protected ($this), and private (var and function definitions). 

## package
The package function provides a simple way to declare/access a package and its classes. We also provide internal class, extend, and inherit functions for convenience in order to maintain package scopes.

### Example
This following is an example of a simple class declaration in the org.example.animal package.
```javascript
package("org.example.animal", function(){
  
  /// Animal provides a basic framework for other
  /// critter types
  define(function Animal(name){
    // Private scope!
    var type,
      move;
    
    self.move = function() {
      console.log(move);
    };
    
    self.speak = function() {
      console.log(speak);
    };
    
    self.identify = function() {
      console.log("I'm " + name + " and I'm a(n) " + type);
    };
    
  });
  
});
```
This will result in the org.example.animal package being created if it doesn't already exist and the Animal class being added to that package. If you were to want to access the Animal class, you can easily do so either via a *require* call or directly from the global scope:
```javascript
var animal = new org.example.Animal("my name");
```

## inherit
Inherit allows for the internal scope of a class to be added to.

### Example
```javascript
package("org.example.animal", function(){
  
  /// Animal provides a basic framework for other
  /// critter types
  define(function Animal(name){
    var type,
      move;
    
    self.move = function() {
      console.log(move);
    };
    
    self.speak = function() {
      console.log(speak);
    };
    
    self.identify = function() {
      console.log("I'm " + name + " and I'm a(n) " + type);
    };
    
  });
  
  /// Dog inherits Animal because a dog is an animal
  inherit(
    this.Animal,
    function Dog(name) {
      move = "walk";
      speak = "bark!";
      type = "dog";
      
      self.wag = function() {
        console.log("*tail wagging intensifies*");
      };
      
    });
    
});
```
Dog will now be defined alongside Animal. Dog additionally will have an extra method (dog.wag) that Animal does not. Additionally, even though Dog augments the scope of Animal directly (note how move, speak, and type were never declared within Dog! They don't need to be, they were declared in Animal! :D) Animal itself remains unchanged. 

## extend
Extend chains the scope of def onto the class that is being extended.

### Example
```javascript
package("org.example.animal", function(){
  
  /// Animal provides a basic framework for other
  /// critter types
  define(function Animal(name){
    var type,
      move;
    
    self.move = function() {
      console.log(move);
    };
    
    self.speak = function() {
      console.log(speak);
    };
    
    self.identify = function() {
      console.log("I'm " + name + " and I'm a(n) " + type);
    };
    
  });

  /// Dog inherits Animal because a dog is an animal
  inherit(
    this.Animal,
    function Dog(name) {
      move = "walk";
      speak = "bark!";
      type = "dog";
      
      self.wag = function() {
        console.log("*tail wagging intensifies*");
      };
      
    });
  
  /// Bloodhound extends Dog because a bloodhound is a dog
  extend(
    this.Dog,
    function Bloodhound(name) {
      
      self.hunt = function() {
        console.log("Imma huntin!");
      };
      
    });
  
});
```
Here Bloodhound extends Dog. Bloodhound doesn't need to override the internals of Dog, but it does add to Dog. Bloodhound has all of the variable values that Dog has, but with the added method hunt() as well.

## Class Chaining Declaration
Classes can also be tacked on after the package declaration. 

```javascript
package("oo.statechart.state")
.class(
  function AbstractState(){
    self.name = undefined;

    self.enter = function(){};
    self.exit = function(){};
  })

.extend( "AbstractState",
  function BasicState(name){
    var incomingPaths = {},
      outgoingPaths = {};

    self.name = name;

    self.addIncoming = function(path) {
      incomingPaths[path.events] = path;
    };

    self.addOutgoing = function(path) {
      outgoingPaths[path.events] = path;
    };

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

  })

.extend( "BasicState",
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
      currentState = state;
    };

    self.setInitial = function(state) {
      initialState = state;

      if(!currentState)
        currentState = initialState;
    };
  });
```

## require
The require call is used to execute a function within a mixed scope. The function takes in a series
of packages, and then executes the provided function. Require will bring in all of the classes in each
of the packages into the functions local scope -- which means they are directly accessible by name.

### Example
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
