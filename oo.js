(function(safe){
  if(safe)
    oo = window.oo || {};
  else
    oo = window;

  Class = oo.Class || function() {var $self = {};};

  Package = oo.Package || function() {
    var define,
      extend,
      package,
      inherit,
      self = this,
      $pkg = this; // self, and $pkg are useless here

    // TODO: clean this up, make it more efficient
    this.getClasses = function() {
      var scope = this,
        classes = Object.keys(this).filter(function(entry){
          return entry.match(/^[A-Z]/);
        });

      return [
        classes,
        classes.map(function(entry){
          return scope[entry];
        })];
    };

    // Create redirecting private variables. This allows for local calls within
    // class/package definitions (ie define rather than this.define)
    define = function(extension, def) {
      self.define(extension, def);
    };

    this.define = function(extension, def) {
      // call with:
      // def -- returns an extension of class, but MAKE SURE YOU USE A NAMED FUNCTION >:(
      // [id | class]+, def -- creates a basic extension of class
      // id, extension, def -- creates an extension of extension using def

      if(typeof extension == "string" && def != undefined) {
        extension = this[extension];
      }

      // if we have an extension definition, but no definition,
      // then we're using the two param version of class()
      if(extension && !def) {
        def = extension;
        extension = undefined;
      }

      var id = def.name;

      if(extension)
        def = this.extend(extension, def);
      else
        def = this.extend(Class, def);

      this[id] = def;

      // Now return the package -- this allows for classes to be chained
      return this;
    };

    // Create redirecting private variables. Wat.
    package = function() {
      oo.package.apply(self, arguments);
      // if(arguments.length == 1)
      //   oo.package.call(self, arguments[0]);
      // else if(arguments.length == 2)
      //   oo.package.call(self, arguments[0], arguments[1]);
      // else if(arguments.length == 3)
      //   oo.package.call(self, arguments[0], arguments[1], arguments[3]);
    };

    this.package = function(id, func) {
      var details = this.getClasses(),
        ids = details[0],
        classes = details[1],
        scopeDef = "";

      for(var j=0; j<classes.length; ++j) {
        scopeDef += "var " + ids[j] + "=" + classes[j].toString() + ";";
      }

      eval(scopeDef);
      eval("(" + func.toString() + ")").apply(this);
    };

    // Create redirecting private variables. Wat.
    extend = function(clss, def) {
      self.extend(clss, def);
    };

    this.extend = function(clss, def) {
      var scope = this;

      if(arguments.length == 3) {
        scope = arguments[0];
        clss = arguments[1];
        def = arguments[2];
      }

      var start = clss.toString(),
        tail = def.toString();

      // Get the new function's header
      var header = tail.match(/^function[\w\s\(\),]+\{/)[0];

      // Strip the header and footer from the extended scope
      start = start
        .replace(/^function[\w\s\(\),]+\{/, "")
        .replace(/\}$/, "");

      // TODO: this is where $pkg needs to be redefined...

      // Now remove the header, create the private scope _self
      tail = "function(){ var self=this;" + tail.replace(header, "");

      // Strip off the inherited class's function header and footer,
      // and replace with the new header
      tail = tail.replace( start, "");
      start = header + "\n" + start + "\n";

      // Now assemble the new scope!
      var assembledScope = start + "\n(" + tail + ").apply(this);";
      return this[def.name] = eval.call(scope, "(" + assembledScope + "})");
    };

    // Create redirecting private variables. Wat.
    inherit = function(clss, def) {
      self.inherit(clss, def);
    };

    this.inherit = function(clss, def) {
      if(typeof clss == "string" && def != undefined) {
        clss = this[clss];
      }

      var start = clss.toString(),
        tail = def.toString();

      // Get the new function's header
      var header = tail.match(/^function[\w\s\(\),]+\{/)[0];

      // Strip the header and footer from the extended scope
      start = start
        .replace(/^function[\w\s\(\),]+\{/, "")
        .replace(/\}$/, "");

      // Now remove the header
      // tail = "function(){" + tail.replace(header, "");
      tail = tail.replace(header, "");

      // Strip off the inherited class's function header and footer,
      // and replace with the new header
      tail = tail.replace( start, "");
      start = header + "\n" + start + "\n";

      // Now strip off the ending of the most recent scope
      start = start.replace(/\}\)\.apply\(this\);[\s\}]*$/, "");

      // Now assemble the new scope!
      var assembledScope = start + "\n" + tail + ").apply(this);";

      // perform the voodoo and regenerate the class with the proper scope
      return this[def.name] = eval.call(this, "(" + assembledScope + "})");
    };

  };

  oo.inherit = function(clss, def) {
    var start = clss.toString(),
      tail = def.toString();

    // Get the new function's header
    var header = tail.match(/^function[\w\s\(\),]+\{/)[0];

    // Strip the header and footer from the extended scope
    start = start
      .replace(/^function[\w\s\(\),]+\{/, "")
      .replace(/\}$/, "");

    // Now remove the header
    // tail = "function(){" + tail.replace(header, "");
    tail = tail.replace(header, "");

    // Strip off the inherited class's function header and footer,
    // and replace with the new header
    tail = tail.replace( start, "");
    start = header + "\n" + start + "\n";

    // Now strip off the ending of the most recent scope
    start = start.replace(/\}\)\.apply\(this\);[\s\}]*$/, "");

    // Now assemble the new scope!
    var assembledScope = start + "\n" + tail + ").apply(this);";

    // perform the voodoo and regenerate the class with the proper scope
    return eval("(" + assembledScope + "})");
  };

  // TODO look into fixing this...
  // oo.extend = function(clss, def) {
  //
  // };

  oo.package = function(id, func) {
    var currPkg = this,
      calledFrom = this;

    if(arguments.length == 3) {
      calledFrom = arguments[0];
      id = arguments[1];
      func = arguments[2];
    }

    var ids = id;
    if(typeof ids == "string")
      ids = ids.split(".");


    for(var i=0; i<ids.length; ++i) {
      if(!currPkg[ids[i]]) {
        currPkg[ids[i]] = new Package();
      }
      currPkg = currPkg[ids[i]];
    }

    if(func) {
      currPkg.package(ids, func);
    }

    return currPkg;
  };

  oo.include = function(args, func) {
    if(typeof args != "string")
      throw new Error("Require must have at least one package passed in");

    // Correct for the documentation...
    var _args = [];

    for(var i=0; i<arguments.length; ++i){
      _args.push(arguments[i]);
    }

    // the last arg is actually the func object
    func = _args.pop();

    if(_args.length > 0) {
      if(typeof _args[0] == "object")
        scope = _args.shift();

      if(_args.length > 0) {
        var scope_def = "";
        for(var i=0; i<_args.length; ++i) {
          var currPkg = package(_args[i]).getClasses(),
            ids = currPkg[0],
            classes = currPkg[1];
          // var pkg = package.getClasses();

          for(var j=0; j<classes.length; ++j) {
            scope_def += "var " + ids[j] + "=" + classes[j].toString() + ";";
          }
        }
      }

      // var $pkg = currPkg;
      // Create the scope
      eval(scope_def);
      return eval("(" + func + ")");
    } else {
      // Now execute the function!
      return func;
    }
  }

  oo.require = function(args, func) {
    if(args == undefined || func == undefined)
      throw new Error("Require must have at least one package passed in and be given a function to execute");

    // Correct for the documentation...
    var _args = [],
      _scope = this;

    for(var i=0; i<arguments.length; ++i){
      _args.push(arguments[i]);
    }

    // the last arg is actually the func object
    func = _args.pop();

    if(_args.length > 0) {
      // We can also pass in the scope
      if(typeof _args[0] == "object")
        scope = _args.shift();

      var scope_def = "";
      for(var i=0; i<_args.length; ++i) {
        var currPkg = package(_args[i]),
          details = currPkg.getClasses(),
          ids = details[0],
          classes = details[1];

        for(var j=0; j<classes.length; ++j) {
          scope_def += "var " + ids[j] + "= " + _args[i] + "." + ids[j] + ";";
        }
      }

      // Create the scope
      // scope_def = "function(){" + scope_def + " return " + func.toString() + "}";
      // eval(scope_def);
      var scopeFunc = "function(scope, func) {" +
        "eval(scope);" +
        "return eval('(' + func.toString() + ')').call(this);" +
      "}";

      return eval( "(" + scopeFunc + ")").call(currPkg, scope_def, func)
      // return func.apply(this);
      // return eval("(" + scope_def + ")()").apply(currPkg);
    } else {
      // Now execute the function!
      return func.apply(this);
    }
  };

  oo.type = function(type, obj) {
    var err = false;
    if(typeof obj == "object")
      err = obj.constructor != type;
    else
      err = (typeof obj != type)

    if(err)
      throw new Error("Type enforcement failed");
  };

})(false);

package = oo.package;
extend = oo.extend;
inherit = oo.inherit;
