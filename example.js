// This is how we define classes and models. All classes automatically
// inherit from Class
package("a.b.c").class("MyClass", function(){
  $this.someProtectedMethod = function() {};
  this.somePublicMethod = function(){};
});

package("my.test.package").class("BaseClass", function(){
  // Private! Only visible in this scope or in an inherited scope
  function priv1(){
    ;
  }

  function priv2() {
    ;
  }

  // Protected!
  $this.prot = function() {
    ;
  };

  $this.prot2 = function() {
    ;
  };

  // Public!
  this.sample = function() {
    ;
  };

  this.test = function() {
    ;
  };

  this.moreSamples = function() {
    ;
  };
});

//////////////////////////////////////////////////////////////
// This is how we access packages
// a.b.c;
// package("a.b.c");

// This block demonstrates two things:
//  1. Require scopes the contents of the function, and brings in
//    all of the classes in the package
//
//  2. anon_class is an anonymous extension of MyClass. MyClass is
//    localized so it's accessible like a regular var
//////////////////////////////////////////////////////////////
require("a.b.c", function(){
  var anon_class = extend(MyClass, function(){
    console.log($this);
    console.log(this);

    // Expose some shit
    this.$this = $this;
    this.anon_property = 5;
  });
});

//////////////////////////////////////////////////////////////
// This is how we define basic classes within a package, with no extension
//////////////////////////////////////////////////////////////
package("org.example").class("Example", function(){
  $this.protectedMethod = function(stuff){
    console.log(stuff);
  }

  this.hex = "0x1234";
});

//////////////////////////////////////////////////////////////
// This is how we define basic classes within a package, with extension
//////////////////////////////////////////////////////////////
package("my.test.package").class("TestClass", a.b.c.MyClass, function(){
    this.mystuff = 5;
});


//////////////////////////////////////////////////////////////
// This is a basic scoped block where we are bringing in the listed
// packages and then executing the function within that scope.
//////////////////////////////////////////////////////////////
require(
  "a.b.c",
  "my.test.package",
  "org.example",
  function() {
    console.log("About to load Example and BaseClass by name!");
    var ex = new Example(),
      base = new BaseClass();

    console.log(ex);
    console.log(base);
    console.log("Holy poo!")
  });
