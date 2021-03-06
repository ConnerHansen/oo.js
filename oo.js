(function(safe){
  if(safe)
    oo = window.oo || {};
  else
    oo = window;

  oo.classToPackage = {};
  oo.types = {};
  oo._read = function() {
    var self = this,
      retStr = "";

    for(var i=0; i<arguments.length; ++i) {
      var __vn = arguments[i],
        __nm = __vn;

      // strip off any leading symbols
      // then make the leading character upper case
      __nm = __nm.replace(/^[_$]/, "")
        .replace(__nm[0], __nm[0].toUpperCase());

      // now generate the new getter
      // self[ "get" + __nm ] = eval("(function(){return " + __vn + "})");
      retStr += "(self['get" + __nm + "']=function(){return " + __vn + "});";
    }

    return retStr;
  };

  oo._write = function() {
    var self = this,
      retStr = "";

    for(var i=0; i<arguments.length; ++i) {
      var __vn = arguments[i],
        __nm = __vn;

      // strip off any leading symbols
      // then make the leading character upper case
      __nm = __nm.replace(/^[_$]/, "")
        .replace(__nm[0], __nm[0].toUpperCase());

      // now generate the new setter
      // self[ "set" + __nm ] = eval("(function(value){return " + __vn + "=value})");
      retStr += "(self['set" + __nm + "']=function(value){return " + __vn + "=value});";
    }

    return retStr;
  };

  Class = oo.Class || function Class() {
    var $self = {},
      self = this;

    // TODO: add ability to check extension/inheritance path
    // self.typeOf = function( clss ) {
    //   // lookup or access?
    //   if(clss)
    //     ;
    //   else
    //     return
    // };
  };

  Package = oo.Package || function Package( name ) {
    var define,
      extend,
      package,
      require,
      inherit,
      _classes = {},
      _deps = {},
      self = this;

    function buildScopeDef(pkgs) {
      var scopeDef = "";

      for(var i=0; i<pkgs.length; ++i) {
        var currPkg, globalPkg;

        // We allow for string based or real package paths
        if( typeof pkgs[i] == "string" ) {
          currPkg = package(pkgs[i]);
          globalPkg = oo.package(pkgs[i]);
        } else {
          currPkg = pkgs[i];
          globalPkg = pkgs[i];
        }

        var currPkg = currPkg || globalPkg,
          details = currPkg.getClasses(),
          ids = details[0],
          classes = details[1];

        if(!globalPkg)
          for(var j=0; j<classes.length; ++j) {
            scopeDef += "var " + ids[j] + "=" + this.path() + "." + pkgs[i] + "." + ids[j] + ";";
          }
        else
          for(var j=0; j<classes.length; ++j) {
            scopeDef += "var " + ids[j] + "=" + currPkg.path() + "." + ids[j] + ";";
          }
      }

      return scopeDef;
    }

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

      return [
        classes,
        classes.map(function(entry){
          return scope[entry];
        })];
    };

    // Create redirecting private variables. This allows for local calls within
    // class/package definitions (ie define rather than this.define)
    define = function(extension, def) {
      return self.define.apply(self, arguments);
    };

    self.define = function(def) {
      // call with:
      // [path]+, def -- creates an extension of class using def, including the paths in the local scope

      var pkgs = [],
        params = "";

      // Are we including other packages in this definition scope?
      if(arguments.length > 1) {
        // Don't include the last one, that's the defintion
        for(var i=0; i < arguments.length - 1; ++i) {
          pkgs.push(arguments[i]);
        }

        def = arguments[ arguments.length - 1 ];
        params = buildScopeDef(pkgs);
      }

      def = self.extend(self, params, Class, def);
      // var id = def.name;
      //
      // Allow anonymous functions
      // if( id ) {
      //   this[id] = def;
      //   _classes[id] = def;
      //   oo.classToPackage[ def ] = self.path() + "." + id;
      // }

      // Return the definition...
      return def;
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

      // We do this because swapping arg vars actually overwrites the
      // argument order, so this way we preserve everything
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
            globalPkg = oo.package(_args[i]),
            details,
            ids,
            classes,
            pkgHeader = "$package.";

          if(!currPkg && globalPkg) {
            currPkg = globalPkg;
            pkgHeader = "";
          } else
            throw new RuntimeError("package " + _args[i] + " cannot be found in the global or local scopes");

          details = currPkg.getClasses(),
          ids = details[0],
          classes = details[1];

          for(var j=0; j<classes.length; ++j) {
            scope_def += "var " + ids[j] + "=" + pkgHeader + _args[i] + "." + ids[j] + ";";
          }
        }

        // Create the scope
        var scopeFunc = "function(scope, func) {" +
          "eval(scope);" +
          "return eval('(' + func.toString() + ')').call(this);" +
        "}";

        return eval( "(" + scopeFunc + ")").call(this, scope_def, func)
      } else {
        // Now execute the function!
        return func.apply(this);
      }
    };

    // Create redirecting private variables. Wat.
    extend = function(clss, def) {
      self.extend.apply(self, arguments);
    };

    self.instanceOf = function( clss ) {
      if( clss ) {
        return (clss && this.package[this.className] == clss) ? true : false;
      } else
        return this.package[ this.className ];
    };

    self.typeOf = function( clss ) {
      if( clss )
        return oo.typeOf(self, clss);
      else
        return oo.typeOf(self);
    }

    self.extend = function(clss, def) {
      var scope = this,
        params = "";

      if( arguments.length < 2)
        throw new RuntimeError("extend takes at least two arguments: the class to extend and the definition");
      else {
        // We're dealing with a definition
        if( arguments[arguments.length - 2] == Class ){
          if( arguments.length == 4) {
            var args = [arguments[0], arguments[1], arguments[2], arguments[3]];

            scope = args[0];
            params = args[1];
            clss = args[2];
            def = args[3];
          } else if(arguments.length == 3) {
            var args = [arguments[0], arguments[1], arguments[2]];

            scope = args[0];
            clss = args[1];
            def = args[2];
          }
        // Okay, so it isn't a definition, it's an extension
        } else {
          var pkgs = [];

          // Are we including other packages in this definition scope?
          if(arguments.length > 2) {
            // Don't include the last one, that's the defintion
            for(var i=0; i < arguments.length - 2; ++i) {
              pkgs.push(arguments[i]);
            }

            params = buildScopeDef(pkgs);
          }

          clss = arguments[ arguments.length - 2 ];
          def = arguments[ arguments.length - 1 ];
        }
      }

      if( typeof clss == "string" ) {
        var match = self[ clss ];

        if(!match) {
          for(var i=0; i<pkgs.length; ++i) {
            match = oo.package(pkgs[i])[ clss ] || match;
          }
        }

        // If clss is null, then we should crash
        clss = match;
      }


      var start = clss.toString(),
        tail = def.toString();

      start = "";
      // Get the new function's header
      var header = tail.match(/^function[\w\s\(\),]+\{/)[0];

      // Define our reader and writer -- move the _read and _write
      // functions to globals, this way we're not redefining so much
      var read = function(){eval(oo._read.apply(self,arguments))};
      var write = function(){eval(oo._write.apply(self, arguments))};
      var read_write = function() {r.apply(self,arguments);w.apply(self, arguments);};

      var _static = function(__func, __force) {
        var name = __func.name;
        if( !self.constructor.prototype[name] || __force ) {
          var __func_str = __func.toString();
          __func_str = __func_str.replace(/\{/, "{var self=this;");
          self.constructor.prototype[name] = eval.call(window,"(" + __func_str + ")");
        }
        self[name] = function() {self.constructor.prototype[name].apply(self, arguments)};
      };

      var supr = "";
      if( oo.classToPackage[clss] && clss.name )
        supr = "self.super=function(){" + oo.classToPackage[clss] +".apply(self, arguments);self.className=\"" + def.name + "\"}";

      //
      var name = def.name;
      if( name )
        name = "\"" + def.name + "\"";
      else
        name = null;

      // Now remove the header, create the local self scope,
      // setup the automated functions
      tail = "var self=this;"
        + "var $self=self.$||{};"
        + "var inherited=false;"
        + "if(self.$){inherited=true;}"
        + "self.$ = $self;"
        + "if(!inherited){"
        + "self.package=" + self.path() + ";"
        + "self.className=" + name + ";"
        // + "var _read=" + _read.toString() + ";"
        // + "var _write=" + _write.toString() + ";"
        + "self.instanceOf = " + self.instanceOf.toString() + ";"
        + "self.typeOf = " + self.typeOf.toString() + ";"
        + "};"
        + supr + ";"
        + "var r=" + read.toString() + ";"
        + "var w=" + write.toString() + ";"
        + "var rw=" + read_write.toString() + ";"
        + "var static=" + _static.toString() + ";"
        + params
        + tail.replace(header, "")
          .replace(/\}$/, ";if(!inherited){delete self.$;}}");

      // Strip off the inherited class's function header and footer,
      // and replace with the new header
      tail = tail.replace( start, "");
      start = header + "\n" + start + "\n";

      // Now assemble the new scope!
      var assembledScope = start + "\n" + tail + "",
        extendedFunc = eval.call(scope, "(" + assembledScope + ")");

      if(extendedFunc.name) {
        this[extendedFunc.name] = _classes[extendedFunc.name] = extendedFunc;
        oo.classToPackage[ extendedFunc ] = self.path() + "." + extendedFunc.name;

        if( clss ) {
          oo.types[ self.path() + "." + extendedFunc.name ] = clss;
          extendedFunc.prototype = Object.create(clss.prototype);
          extendedFunc.prototype.constructor = extendedFunc;
        } else
          oo.types[ self.path() + "." + extendedFunc.name ] = true;
      }

      return extendedFunc;
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
        tail = def.toString(),
        // Get the new function's header
        header = tail.match(/^function[\w\s\(\),]+\{/)[0],
        pkgs = [];

      // Are we including other packages in this inherit scope?
      if(arguments.length > 2) {
        // Don't include the last one, that's the defintion
        for(var i=0; i < arguments.length - 2; ++i) {
          pkgs.push(arguments[i]);
        }

        header += buildScopeDef(pkgs);
        clss = arguments[ arguments.length-2 ];
        def = arguments[ arguments.length-1 ];
      }

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
      var extendedFunc = eval.call(this, "(" + assembledScope + "})");

      // Allow anonymous functions
      if( extendedFunc.name ) {
        this[extendedFunc.name] = extendedFunc;
        _classes[extendedFunc.name] = this[extendedFunc.name];
        oo.classToPackage[ extendedFunc.name ] = self.path() + "." + extendedFunc.name;
      }

      return extendedFunc;
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

  oo.instanceOf = function( clss, ext ) {
    if( ext )
      return clss.constructor == ext;
    else {
      return oo.types[ clss.constructor ];
    }
  };

  oo.typeOf = function( clss, ext ) {
    if( ext ) {
      var arr;

      if(typeof clss == "object") {
        var parent = oo.typeOf( oo.instanceOf(clss) );
        arr = [clss.constructor];

        if( parent )
          arr.concat( oo.typeOf( parent ));
        // arr = [clss.constructor]oo.typeOf( oo.instanceOf(clss) );
      } else
        arr = oo.typeOf( clss );

      return arr.indexOf( ext ) != -1;
    } else {
      var parent = oo.types[ clss ],
        arr = [ clss ];

      if(parent)
        return arr.concat( oo.typeof( parent ));
      else {
        return arr;
      }
    }
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
      // if(typeof _args[0] == "object")
      //   scope = _args.shift();

      var scope_def = "";
      for(var i=0; i<_args.length; ++i) {
        var currPkg = (typeof _args[i] == "string") ? package(_args[i]) : _args[i],
          details = currPkg.getClasses(),
          ids = details[0],
          classes = details[1],
          pkg = _args[i];

        if(typeof pkg != "string")
          pkg = pkg.path();

        for(var j=0; j<classes.length; ++j) {
          scope_def += "var " + ids[j] + "=" + currPkg.path() + "." + ids[j] + ";";
        }
      }

      // Create the scope
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

function StubbedMethodError(message) {
  this.name = "StubbedMethodError",
  this.message = message,
  this.stack = (new Error()).stack;
}
StubbedMethodError.prototype = new Error;

abstract = function() {
  throw new AbstractCallError("Cannot execute abstract function");
}

stub = function() {
  try {
    throw new StubbedMethodError("Stubbed method called");
  } catch(err) {
    console.warn(err.message + ": " + err.stack);
  }
}
