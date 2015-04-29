(function(safe){
  if(safe)
    oo = window.oo || {};
  else
    oo = window;

  Class = oo.Class || function() {var $self = {};};

  Package = oo.Package || function( name ) {
    var define,
      extend,
      package,
      require,
      inherit,
      _classes = {},
      self = this,
      $pkg = this,
      $package = this; // self, and $pkg are useless here

    this.path = function() {
      if(this.parent && !(this.parent instanceof Window))
        return this.parent.path() + "." + name;
      else
        return name;
    };

    // TODO: clean this up, make it more efficient
    this.getClasses = function() {
      var scope = this,
        classes = Object.keys(_classes);
        // classes = Object.keys(this).filter(function(entry){
        //   return entry.match(/^[A-Z]/);
        // });

      return [
        classes,
        classes.map(function(entry){
          return scope[entry];
        })];
    };

    // Create redirecting private variables. This allows for local calls within
    // class/package definitions (ie define rather than this.define)
    define = function(extension, def) {
      self.define.apply(self, arguments);
      // self.define(extension, def);
    };

    self.define = function(def) {
      // call with:
      // def -- returns an extension of class, but MAKE SURE YOU USE A NAMED FUNCTION >:(
      // [id | class], def -- creates a basic extension of class matching id name or extension class
      // [path]+, id | extension, def -- creates an extension of extension using def, including the paths in the local scope

      var includedPkgs = [],
        params = "";

      // Are we including other packages in this definition scope?
      if(arguments.length > 1) {
        for(var i=0; i < arguments.length - 1; ++i) {
          includedPkgs.push(arguments[i]);
        }

        var scope_def = "";
        for(var i=0; i<includedPkgs.length; ++i) {
          var currPkg = package(includedPkgs[i]),
            globalPkg = oo.package(includedPkgs[i]),
            currPkg = currPkg || globalPkg,
            details = currPkg.getClasses(),
            ids = details[0],
            classes = details[1];

          if(!globalPkg)
            for(var j=0; j<classes.length; ++j) {
              scope_def += "var " + ids[j] + "=" + this.path() + "." + includedPkgs[i] + "." + ids[j] + ";";
            }
          else
            for(var j=0; j<classes.length; ++j) {
              scope_def += "var " + ids[j] + "=" + includedPkgs[i] + "." + ids[j] + ";";
            }
        }
        params = scope_def;

        //extension = arguments[ arguments.length - 2 ];
        def = arguments[ arguments.length - 1 ];
      }

      // if(typeof extension == "string" && def != undefined)
      //   extension = this[extension];

      // if we have an extension definition, but no definition,
      // then we're using the two param version of class()
      // if(extension && !def) {
      //   def = extension;
      //   extension = undefined;
      // }

      var id = def.name;

      // if(extension)
      //   def = self.extend(self, params, extension, def);
      // else
        def = self.extend(self, params, Class, def);

      this[id] = def;
      _classes[id] = def;

      // Now return the package -- this allows for classes to be chained
      return this;
    };

    // Create redirecting private variables. Wat.
    package = function() {
      return oo.package.apply(self, arguments);
    };

    self.package = function(id, func) {
      var details = self.getClasses(),
        ids = details[0],
        classes = details[1],
        scopeDef = "";

      for(var j=0; j<classes.length; ++j) {
        scopeDef += "var " + ids[j] + "=" + classes[j].toString() + ";";
      }

      eval(scopeDef);
      eval("(" + func.toString() + ")").apply(self);
    };

    require = function() {
      self.require.apply(self, arguments);
    };

    self.require = function(args, func) {
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

      // var extend = function(clss, def) {
      //   self.extend(this, clss, def);
      // };
      //
      // var define = function(clss, def) {
      //   debugger;
      //   self.define.call(this, clss, def);
      // };

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
            scope_def += "var " + ids[j] + "=$package." + _args[i] + "." + ids[j] + ";";
          }
        }

        // Create the scope
        // scope_def = "function(){" + scope_def + " return " + func.toString() + "}";
        // eval(scope_def);
        var scopeFunc = "function(scope, func) {" +
          // "var extend = " + extend.toString() + ";" +
          // "var define = " + define.toString() + ";" +
          "eval(scope);" +
          "return eval('(' + func.toString() + ')').call(this);" +
        "}";

        return eval( "(" + scopeFunc + ")").call(this, scope_def, func)
        // return func.apply(this);
        // return eval("(" + scope_def + ")()").apply(currPkg);
      } else {
        // Now execute the function!
        return func.apply(this);
      }
    };

    // Create redirecting private variables. Wat.
    extend = function(clss, def) {
      self.extend.apply(self, arguments);
    };

    self.extend = function(clss, def) {
      var scope = this,
        params = "";

      if( arguments.length == 4) {
        scope = arguments[0];
        params = arguments[1];
        clss = arguments[2];
        def = arguments[3];
      } else if(arguments.length == 3) {
        scope = arguments[0];
        clss = arguments[1];
        def = arguments[2];
      }

      var start = clss.toString(),
        tail = def.toString();

      // Get the new function's header
      var header = tail.match(/^function[\w\s\(\),]+\{/)[0];

      // Define our reader and writer -- move the _read and _write
      // functions to globals, this way we're not redefining so much
      var read = function() {
        _read.apply(self, arguments);
      };

      var write = function() {
        _write.apply(self, arguments);
      };

      var read_write = function() {
        _read.apply(self, arguments);
        _write.apply(self, arguments);
      };

      var _read = function() {
        for(var i=0; i<arguments.length; ++i) {
          var varName = arguments[i]
            name = varName;

          // strip off any leading symbols
          // then make the leading character upper case
          name = name.replace(/^[_$]/, "")
            .replace(name[0], name[0].toUpperCase());

          self[ "get" + name ] = function(varName) {
            return function() {
              return eval( varName );
            };
          }(varName);
        }
      };

      var _write = function() {
        for(var i=0; i<arguments.length; ++i) {
          var varName = arguments[i]
            name = varName;

          // strip off any leading symbols
          // then make the leading character upper case
          name = name.replace(/^[_$]/, "")
            .replace(name[0], name[0].toUpperCase());

          self[ "set" + name ] = function(varName) {

            return function(val) {
              if(typeof val == "object")
                val = JSON.stringify(val);
              else if(typeof val == "string")
                val = "\"" + val + "\"";

              return eval(varName + "=" + val.toString() +  ";");
            };
          }(varName);
        }
      };

      // Strip the header and footer from the extended scope
      start = start
        .replace(/^function[\w\s\(\),]+\{/, "")
        .replace(/\}$/, "");

      // TODO: this is where $pkg needs to be redefined...

      // Now remove the header, create the local self scope,
      // setup the automated functions
      tail = "function(){ var self=this;"
        + "var _read=" + _read.toString() + ";"
        + "var _write=" + _write.toString() + ";"
        + "var r=" + read.toString() + ";"
        + "var w=" + write.toString() + ";"
        + "var rw=" + read_write.toString() + ";"
        + params
        + tail.replace(header, "");

      // Strip off the inherited class's function header and footer,
      // and replace with the new header
      tail = tail.replace( start, "");
      start = header + "\n" + start + "\n";

      // Now assemble the new scope!
      var assembledScope = start + "\n(" + tail + ").apply(this);";
      this[def.name] = eval.call(scope, "(" + assembledScope + "})");
      _classes[def.name] = this[def.name];
      return this[def.name]
      // return this[def.name] = eval.call(scope, "(" + assembledScope + "})");
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
      var parent = currPkg;

      if(!currPkg[ids[i]]) {
        if(func) {
          currPkg[ids[i]] = new Package(ids[i]);
          currPkg[ids[i]].parent = parent;
        } else
          return null;
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

function AbstractCallError(message) {
  this.name = "AbstractCallError",
  this.message = message,
  this.stack = (new Error()).stack;
}

AbstractCallError.prototype = new Error;

abstract = function() {
  throw new AbstractCallError("Cannot execute abstract function");
}
