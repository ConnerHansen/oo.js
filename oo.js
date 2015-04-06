(function(safe){
  if(safe)
    oo = {};
  else
    oo = window;

  var Class = oo.Class || function() {var $this = {};};

  var Package = oo.Class || function() {
    this._classes = [];
    this._ids = [];

    this.class = function(id, extension, def) {
      // call with:
      // id -- returns the class
      // id, extension -- creates a basic class, using extension of def
      // id, extension, def -- creates an extension of extension using def

      if(extension == undefined && def == undefined)
        return this[id];
      else if(typeof extension == "string" && def != undefined) {
        var index = this._ids.indexOf(extension);
        extension = this._classes[index];
      }

      // if we have an extension definition, but no definition,
      // then we're using the two param version of class()
      if(extension && !def) {
        def = extension;
        extension = undefined;
      }

      if(extension)
        def = extend(extension, def);
      else
        def = extend(Class, def);

      this._ids.push(id);
      this._classes.push(def);
      this[id] = def;

      // Now return the package -- this allows for classes to be chained
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

  oo.package = function(ids) {
    if(typeof ids == "string")
      ids = ids.split(".");

    var currPkg = window;

    for(var i=0; i<ids.length; ++i) {
      if(!currPkg[ids[i]]) {
        currPkg[ids[i]] = new Package();
      }
      currPkg = currPkg[ids[i]];
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
      var scope_def = "";
      for(var i=0; i<_args.length; ++i) {
        var pkg = package(_args[i]);

        for(var j=0; j<pkg._classes.length; ++j) {
          scope_def += "var " + pkg._ids[j] + "=" + pkg._classes[j].toString() + ";";
        }
      }

      // Create the scope
      eval(scope_def);
      return eval("(" + func + ")");
    } else {
      // Now execute the function!
      return func;
    }
  }

  oo.require = function(args, func) {
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
      var scope_def = "";
      for(var i=0; i<_args.length; ++i) {
        var pkg = package(_args[i]);

        for(var j=0; j<pkg._classes.length; ++j) {
          scope_def += "var " + pkg._ids[j] + "=" + pkg._classes[j].toString() + ";";
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
})();
