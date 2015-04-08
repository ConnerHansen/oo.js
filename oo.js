(function(safe){
  if(safe)
    oo = window.oo || {};
  else
    oo = window;

  Class = oo.Class || function() {var $this = {};};

  Package = oo.Package || function() {
    // this._classes = [];
    // this._ids = [];

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

    this.class = function(extension, def) {
      // call with:
      // def -- returns an extension of class, but MAKE SURE YOU USE A NAMED FUNCTION >:(
      // [id | class]+, def -- creates a basic extension of class
      // id, extension, def -- creates an extension of extension using def

      // if(typeof id == "function") {
      //   def = id;
      // } else {
        // if(extension == undefined && def == undefined)
        //   return this[id];
        if(typeof extension == "string" && def != undefined) {
          // var index = this._ids.indexOf(extension);
          // extension = this._classes[index];
          extension = this[extension];
        }
      // }

      // if we have an extension definition, but no definition,
      // then we're using the two param version of class()
      if(extension && !def) {
        def = extension;
        extension = undefined;
      }
      var id = def.name;

      if(extension)
        def = extend(extension, def);
      else
        def = extend(Class, def);

      // this._ids.push(id);
      // this._classes.push(def);
      this[id] = def;

      // Now return the package -- this allows for classes to be chained
      return this;
    };

    this.extend = function(clss, def) {
      if(typeof clss == "string" && def != undefined) {
        clss = this[clss];
      }

      def = oo.extend.call(this, clss, def);
      this[def.name] = def;

      return this;
    };

    this.inherit = function(clss, def) {
      if(typeof clss == "string" && def != undefined) {
        clss = this[clss];
      }

      def = oo.inherit.call(this, clss, def);
      this[def.name] = def;

      return this;
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

  oo.extend = function(clss, def) {
    var start = clss.toString(),
      tail = def.toString();

    // Get the new function's header
    var header = tail.match(/^function[\w\s\(\),]+\{/)[0];

    // Strip the header and footer from the extended scope
    start = start
      .replace(/^function[\w\s\(\),]+\{/, "")
      .replace(/\}$/, "");

    // Now remove the header
    tail = "function(){" + tail.replace(header, "");

    // Strip off the inherited class's function header and footer,
    // and replace with the new header
    tail = tail.replace( start, "");
    start = header + "\n" + start + "\n";

    // Now assemble the new scope!
    var assembledScope = start + "\n(" + tail + ").apply(this);";
    return eval("(" + assembledScope + "})");
  };

  oo.package = function(id, func) {
    var ids = id;
    if(typeof ids == "string")
      ids = ids.split(".");

    var currPkg = window;

    for(var i=0; i<ids.length; ++i) {
      if(!currPkg[ids[i]]) {
        currPkg[ids[i]] = new Package();
      }
      currPkg = currPkg[ids[i]];
    }

    if(func) {
      var details = currPkg.getClasses(),
        ids = details[0],
        classes = details[1],
        scopeDef = "";

      for(var j=0; j<classes.length; ++j) {
        scopeDef += "var " + ids[j] + "=" + classes[j].toString() + ";";
      }

      // Create the scope
      eval(scopeDef);
      eval("(" + func.toString() + ")").apply(currPkg);
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
          scope_def += "var " + ids[j] + "=" + classes[j].toString() + ";";
        }
      }

      // Create the scope
      eval(scope_def);
      return eval("(" + func + ")").apply(this);
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

})();
