
package( "org.html.dom", function() {
  // Setup some of them sweet sweet constants
  self.events = {
    CLICK: "click",
    MOUSE_OVER: "mouseover",
    MOUSE_LEAVE: "mouseleave"
  };

  self.inputs = {
    BUTTON: "button",
    CHECKBOX: "checkbox",
    HIDDEN: "hidden",
    TEXT: "text"
  };

  /**
   * Basic HtmlElement wrapper
   */
  define(
    function HtmlElement() {
      var id,
        domElement,
        html,
        style,
        css;

      // simple readers
      r("id", "domElement", "html", "style", "css");

      self.addCss = function(newCss) {
        if( css )
          css = css + " " + newCss;
        else
          css = newCss;

        self.setCss(css);
      };

      /**
       * Append a child HtmlElement to this element.
       * @param child - the child HtmlElement to add
       * @return true if the child was appended, otherwise false
       */
      self.appendChild = function(child) {
        if( domElement ) {
          domElement.appendChild(child.getDomElement());
          return true;
        }

        return false;
      };

      /**
       * Gets the content of the dom element if it exists
       * otherwise YOU GET NOTHING. GOOD DAY.
       */
      self.getContent = function() {
        if( domElement )
          return domElement.innerHTML;

        return null;
      };

      self.removeCss = function(oldCss) {
        if(css)
          css = css.replace(oldCss, "");

        self.setCss(css);
      };

      self.render = function() {
        if(domElement)
          return domElement.outerHTML;

        return "";
      };

      /**
       * Sets the wibble of the wobble and/or also the
       * innerHTML of the gd dom element
       */
      self.setContent = function(content) {
        if( domElement ) {
          domElement.innerHTML = content;
        }
      };

      /**
       * Sets the CSS class(es) for this object
       * @param value - the class string to use
       */
      self.setCss = function(value) {
        css = value;

        if(domElement)
          domElement.className = css;
      };

      /**
       * Sets the ID of the HtmlElement
       * @param value - the friggin id
       */
      self.setId = function(value) {
        id = value;

        if(domElement)
          domElement.id = id;
      };

      /**
       * Sets the HtmlElement's style string
       * @param value - the style string to use
       */
      self.setStyle = function(value) {
        style = value;

        if(domElement)
          domElement.setAttribute("style", style);
      };

    });

  /**
   * Basic Div wrapper
   */
  inherit(
    self.HtmlElement,
    function Div() {
      domElement = document.createElement("div");

      self.events = self.package.events;

      self.register = function(event, callback) {
        domElement["on" + event] = callback;
      };

      self.unregister = function(event) {
        domElementp["on" + event] = undefined;
      };
    });

  /**
   * Basic Input wrapper
   */
  inherit(
    self.HtmlElement,
    function Input() {
      var type = self.package.inputs.TEXT;
      self.inputs = self.package.inputs;
      domElement = document.createElement("input");

      r("type");

      self.setType = function(inputType) {
        type = inputType;
        domElement.setAttribute("type", type);
      };
    });

  inherit(
    self.HtmlElement,
    function UnorderedList() {
      domElement = document.createElement("ul");
    });

  inherit(
    self.HtmlElement,
    function OrderedList() {
      domElement = document.createElement("ol");
    });

  inherit(
    self.HtmlElement,
    function ListItem() {
      domElement = document.createElement("li");
    });

  inherit(
    self.HtmlElement,
    function Body() {
      domElement = document.body;

      // Kill the unneeded methods
      self.setId = undefined;
      self.setDomElement = undefined;
      self.setHtml = undefined;
    });
});

package( "org.ui.toolkit", function() {

  require("org.html.dom", function() {

    /**
     * Creates a navigation bar that rests at the top of the screen.
     */
    extend(
      "org.html.dom",
      Div,
      function NavigationBar() {
        var container = new Div(),
          logoDiv = new Div(),
          rightContainer = new Div(),
          centerContainer = new Div(),
          leftContainer = new Div(),
          scrollable = false,
          id;

        r("container", "rightContainer", "leftContainer", "centerContainer");

        self.addButton = function(text, container, callback) {
          var button = new Div();
          button.setCss("nav_button");
          button.getDomElement().innerHTML = text;

          button.getDomElement().onclick = callback;
          container.appendChild(button);

          return button;
        };

        self.isScrollable = function() {
          return scrollable;
        };

        self.setScrollable = stub;

        // Assemble the new NavigationBar
        container.setId("nav_bar");
        leftContainer.setId("left_nav_bar");
        rightContainer.setId("right_nav_bar");
        centerContainer.setId("center_nav_bar");

        container.setCss( "nav_container" );
        leftContainer.setCss("nav_div left_nav");
        centerContainer.setCss("nav_div center_nav");
        rightContainer.setCss("nav_div right_nav");

        container.appendChild(leftContainer);
        container.appendChild(centerContainer);
        container.appendChild(rightContainer);
      });

    /**
     * Specialized version of a div that provides a header, a body,
     * and a footer
     */
    extend(
      "org.html.dom",
      Div,
      function Panel() {
        var header = new Div(),
          content = new Div(),
          footer = new Div();

        var footerVisible = true,
          headerVisible = true;

        r("header", "content", "footer");

        // self.super();

        self.appendContent = function(child) {
          content.appendChild(child);
        };

        self.hideFooter = function() {
          if(footerVisible) {
            footer.setCss( footer.getCss() + " hidden" );
            footerVisible = false;
          }
        };

        self.hideHeader = function() {
          if(headerVisible) {
            header.setCss( header.getCss() + " hidden" );
            headerVisible = false;
          }
        };

        self.setContent = function(text) {
          content.setContent(text);
        };

        self.setHeader = function(text) {
          header.setContent(text);
        };

        self.setFooter = function(text) {
          footer.setContent(text);
        };

        self.showFooter = function() {
          if(!footerVisible) {
            footer.setCss( footer.getCss().replace(/hidden/g, "") );
            footerVisible = true;
          }
        };

        self.showHeader = function() {
          if(!headerVisible) {
            header.setCss( header.getCss().replace(/hidden/g, "") );
            headerVisible = true;
          }
        };

        // Constructor!
        header.setCss( "panel-header" );
        content.setCss( "panel-content" );
        footer.setCss( "panel-footer" );

        self.setCss( "panel" );
        self.appendChild(header);
        self.appendChild(content);
        self.appendChild(footer);
      });
  });

});
