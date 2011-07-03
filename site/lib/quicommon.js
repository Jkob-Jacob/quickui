//
// BrowserDependent
//
BrowserDependent = Control.subclass("BrowserDependent", function renderBrowserDependent() {
	this.properties({
		"content": [
			" ",
			this._define("$BrowserDependent_content", Control("<span id=\"BrowserDependent_content\" />")),
			" ",
			this._define("$BrowserDependent_elseContent", Control("<span id=\"BrowserDependent_elseContent\" />")),
			" "
		]
	}, Control);
});
BrowserDependent.prototype.extend({
    
	ifBrowser: Control.property(),
	content: Control.bindTo("$BrowserDependent_content", "content"),
	elseContent: Control.bindTo("$BrowserDependent_elseContent", "content"),
	ifSupport: Control.property(),
	
	initialize: function() {
		var usingSpecifiedBrowser = (this.ifBrowser() === undefined) || !!$.browser[this.ifBrowser()];
		var browserSupportsProperty = (this.ifSupport() === undefined) || !!$.support[this.ifSupport()];
		var allConditionsSatisfied = usingSpecifiedBrowser && browserSupportsProperty;
		this.$BrowserDependent_content().toggle(allConditionsSatisfied);
		this.$BrowserDependent_elseContent().toggle(!allConditionsSatisfied);
	}
});

//
// BrowserSpecific
//
BrowserSpecific = Control.subclass("BrowserSpecific", function renderBrowserSpecific() {
	this.properties({
		"content": [
			" ",
			this._define("$BrowserSpecific_content", Control("<span id=\"BrowserSpecific_content\" />")),
			" ",
			this._define("$BrowserSpecific_elseContent", Control("<span id=\"BrowserSpecific_elseContent\" />")),
			" "
		]
	}, Control);
});
BrowserSpecific.prototype.extend({

	content: Control.bindTo("$BrowserSpecific_content", "content"),
	elseContent: Control.bindTo("$BrowserSpecific_elseContent", "content"),
	ifBrowser: Control.property(),
	ifSupport: Control.property(),
	
	initialize: function() {
		var usingSpecifiedBrowser = (this.ifBrowser() === undefined) || !!$.browser[this.ifBrowser()];
		var browserSupportsProperty = (this.ifSupport() === undefined) || !!$.support[this.ifSupport()];
		var allConditionsSatisfied = usingSpecifiedBrowser && browserSupportsProperty;
		this.$BrowserSpecific_content().toggle(allConditionsSatisfied);
		this.$BrowserSpecific_elseContent().toggle(!allConditionsSatisfied);
	}
});

//
// ButtonBase
//
ButtonBase = Control.subclass("ButtonBase");
ButtonBase.prototype.extend({
	
	isFocused: Control.property.bool(null, false),
	isKeyPressed: Control.property.bool(null, false),
	isMouseButtonDown: Control.property.bool(null, false),
	isMouseOverControl: Control.property.bool(null, false),
	
	initialize: function() {
		var self = this;
		this
			.blur(function(event) { self.trackBlur(event); })
			.click(function(event) {
				if (self.disabled())
				{
					event.stopImmediatePropagation();
				}
			})
			.focus(function(event) { self.trackFocus(event); })
			.hover(
				function(event) { self.trackMousein(event); },
				function(event) { self.trackMouseout(event); }
			)
			.keydown (function(event) { self.trackKeydown(event); })
			.keyup (function(event) { self.trackKeyup(event); })
			.mousedown(function(event) { self.trackMousedown(event); })
			.mouseup(function(event) { self.trackMouseup(event); });
		this._renderButton();
	},
	
	trackBlur: function(event) {
		
		this.removeClass("focused");

		// Losing focus causes the button to override any key that had been pressed.
		this.isKeyPressed(false);

		this.isFocused(false);
		this._renderButton();
	},
	
	// The current state of the button.
	buttonState: function() {
		if (this.disabled())
		{
			return ButtonBase.state.disabled;
		}
		else if ((this.isMouseButtonDown() && this.isMouseOverControl())
			|| this.isKeyPressed())
		{
			return ButtonBase.state.pressed;
		}
		else if (this.isFocused())
		{
			return ButtonBase.state.focused;
		}
		else if (this.isMouseOverControl() /* || this.isMouseButtonDown() */)
		{
			return ButtonBase.state.hovered;
		}

		return ButtonBase.state.normal;
	},

    disabled: Control.bindTo("applyClass/disabled", function(disabled) {
		this._renderButton();
	}),
	
	trackFocus: function(event) {
        if (!this.disabled()) 
        {
            this.addClass("focused");
            this.isFocused(true);
            this._renderButton();
        }
	},
	
	trackKeydown: function(event) {
		if (!this.disabled() && (event.keyCode == 32 /* space */ || event.keyCode == 13 /* return */))
		{
			this.isKeyPressed(true);		
			this._renderButton();
		}
	},
	
	trackKeyup: function(event) {
		this.isKeyPressed(false);
		this._renderButton();
	},
	
	trackMousedown: function(event) {
        if (!this.disabled())
        {
            this.addClass("pressed");
            this.isMouseButtonDown(true);
            this._renderButton();
        }
	},
	
	trackMousein: function(event) {
        if (!this.disabled()) 
        {
            this.addClass("hovered");
            this.isMouseOverControl(true);
            this._renderButton();
        }
	},
	
	trackMouseout: function(event) {
		this
			.removeClass("focused")
			.removeClass("hovered")
			.removeClass("pressed");
		this.isMouseOverControl(false);
		this._renderButton();
	},
	
	trackMouseup: function(event) {
		this.removeClass("pressed");
		this.isMouseButtonDown(false);
		this._renderButton();
	},
	
	_renderButtonState: function(buttonState) {},
	
	_renderButton: function() {
		this._renderButtonState(this.buttonState());
	}
});
$.extend(ButtonBase, {
	state: {
		normal: 0,
		hovered: 1,
		focused: 2,
		pressed: 3,
		disabled: 4
	}
});

//
// Layout
//
Layout = Control.subclass("Layout");
Layout.prototype.extend({
    
    initialize: function() {
        Layout.track(this);
    },
    
    // Base implementation does nothing.
    layout: function() {
        return this;
    }
    
    /* For debugging
    _log: function(s) {
        console.log(this.className + "#" + this.attr("id") + " " + s);
        return this;
    }
    */
    
});

// Class methods.
// TODO: Factor DOMNodeInserted listening into Control, where it can be used by other classes.
Layout.extend({
    
    /*
     * Re-layout any controls in the DOM.
     */
    recalc: function() {
        //console.log("recalc");
        // Call the layout() method of any control whose size has changed.
        for (var i = 0, length = this._controlsToLayout.length; i < length; i++)
        {
            var $control = Control(this._controlsToLayout[i]).control();
            var previousSize = $control.data("_size"); 
            var size = {
                height: $control.height(),
                width: $control.width()
            };
            if (previousSize === undefined ||
                size.height != previousSize.height ||
                size.width != previousSize.width)
            {
                $control
                    .data("_size", size)
                    .layout();
            }
        }
    },
    
    /*
     * Start tracking the indicated controls for layout purposes.
     * We won't actually lay them out until they're added to the DOM.
     */
    track: function($controls) {
        //$controls._log("tracking");
        this._initialize();
        this._controlsNotYetInDOM = $controls.get().concat(this._controlsNotYetInDOM);
        this._addControlsInDocument();
    },

    /* TODO: Allow a control to be stop being tracked for layout purposes.
    untrack: function($controls) {
        ...
        this.recalc();
    },
    */
   
    /*
     * If any pending controls are now in the DOM, add them to the list of
     * controls to layout.
     */
    _addControlsInDocument: function() {
        var needsRecalc = false;
        var i = 0;
        while (i < this._controlsNotYetInDOM.length)
        {
            var control = this._controlsNotYetInDOM[i];
            if ($.contains(document.body, control))
            {
                this._controlsToLayout.push(control);
                //Control(control).control()._log("added to layout list");
                this._controlsNotYetInDOM.splice(i, 1);   // Remove control
                needsRecalc = true;
            }
            else
            {
                i++;
            }
        }
        if (needsRecalc)
        {
            this.recalc();
        }
        this._listenForDOMNodeInserted();
    },
    
    /*
     * An element has been added to the document;
     */ 
    _documentNodeInserted: function(event) {
        //console.log("_documentNodeInserted");
        Layout._addControlsInDocument();
    },
    
    /*
     * Initialize layout engine overall (not a specific instance).
     */
    _initialize: function() {
        
        if (this._initialized)
        {
            // Already did this.
            return;
        }
        
        // The following control arrays are maintained in order such that
        // DOM parents come before their children. 
        this._controlsNotYetInDOM = [];
        this._controlsToLayout = [];
        
        this._listeningForDOMNodeInserted = false;
       
        // Recalc layout whenever the window size changes.
        $(window).resize(function() {
            Layout.recalc();
        });
        
        this._initialized = true;
    },
    
    /*
     * If we we're tracking any controls that haven't been added to the DOM,
     * then listen for DOMNodeInserted events.
     */
    _listenForDOMNodeInserted: function() {
        if (!this._listeningForDOMNodeInserted && this._controlsNotYetInDOM.length > 0)
        {
            //console.log("start listening for DOMNodeInserted");
            $(document).bind("DOMNodeInserted", this._documentNodeInserted);
            this._listeningForDOMNodeInserted = true;
        }
        else if (this._listeningForDOMNodeInserted && this._controlsNotYetInDOM.length == 0)
        {
            //console.log("stop listening for DOMNodeInserted");
            $(document).unbind("DOMNodeInserted", this._documentNodeInserted);
            this._listeningForDOMNodeInserted = false;
        }
    }
        
});

//
// List
//
List = Control.subclass("List");
List.prototype.extend({
    
    itemClass: Control.property(
        function() { this._refresh(); },
        null,
        function(className) {
            return eval(className);
        }
    ),
        
    items: Control.property(function() { this._refresh(); }),
    
    //
    // This mapFn should be a function that accepts one object
    // (typically a data object) and returns a new object whose
    // properties map directly to property settors defined by the
    // target itemClass.
    //
    mapFn: Control.property(null, null),
    
    _refresh: function() {
        var itemClass = this.itemClass();
        var items = this.items();
        var mapFn = this.mapFn();
        if (itemClass && items)
        {
            var self = this;
            var controls = $.map(items, function(item, index) {
                var properties;
                if (mapFn)
                {
                    // Map item to control properties with custom map function.
                    properties = mapFn.call(self, item, index);
                }
                else if (typeof item == "string" || item instanceof String)
                {
                    // Simple string; use as content property.
                    properties = { content: item };
                }
                else
                {
                    // Use the item as is for the control's properties.
                    properties = item;
                }
                var control = itemClass.create(properties);
                return control;
            });
            this.content(controls);
        }
    }
    
});

//
// Overlay
//
Overlay = Control.subclass("Overlay");
Overlay.prototype.extend({

	blanket: Control.property(),
	blanketColor: Control.property(),
	blanketOpacity: Control.property(),
	dismissOnInsideClick: Control.property.bool(),
	dismissOnOutsideClick: Control.property.bool(null, true),
	
	initialize: function()
	{
		var self = this;
		this.click(function() {
			if (self.dismissOnInsideClick())
			{
				self.hideOverlay();
			}
		});
	},
	
	closeOverlay: function() {
	    return this
	        .hideOverlay()
	        .remove();
	},
	
	hideOverlay: function()
	{
        this
			.hide()
			.css("z-index", null); // No need to define Z-order any longer.
		if (this.blanket() != null)
		{
			this.blanket().remove();
			this.blanket(null);
		}
		
        this.trigger("overlayClosed");  // TODO: Rename to overlayHidden? Move trigger to closeOverlay?
        
        return this;
	},
    
    // Subclasses should override this to position themselves.
    positionOverlay: function() {
        return this;
    },
    	
	showOverlay: function()
	{
		if (this.blanket() == null)
		{
			this.blanket(this._createBlanket());
		}
		
		/* Show control and blanket at the top of the Z-order. */
		var maximumZIndex = this._maximumZIndex();
		this.blanket()
			.css("z-index", maximumZIndex + 1)
			.show();
			
		return this
			.css("z-index", maximumZIndex + 2)
			.show()
			.positionOverlay()
			.trigger("overlayOpened");
	},

	_createBlanket: function() {
	    
		var $blanket = this
			.after("<div id='blanket'/>")
			.next();
			
        var dismissOnOutsideClick = this.dismissOnOutsideClick();
	    var color = this.blanketColor() ||
	                    (dismissOnOutsideClick ? false : "black");
	    var opacity = this.blanketOpacity() ||
                        (dismissOnOutsideClick ? 0.01 : 0.25);
			
		var self = this;
		$blanket
			.click(function() {
				if (self.dismissOnOutsideClick())
				{
					self.hideOverlay();
				}
			})
			.css({
				cursor: "default",
				position: "fixed",
				opacity: opacity,
				top: 0,
				left: 0,
				width: "100%",
				height: "100%"
			});
        if (color)
        {
            $blanket.css("background-color", color);
        }
        
		return $blanket;
	},
		
	/* Return the maximum Z-index in use by the page and its top-level controls. */
	_maximumZIndex: function()
	{
		var topLevelElements = $("body").children().andSelf();
		var zIndices = $.map(topLevelElements, function(element) {
			switch ($(element).css("position")) {
				case "absolute":
				case "fixed":
					var zIndex = parseInt($(element).css("z-index")) || 1;
					return zIndex;
			}
		});
		return Math.max.apply(null, zIndices);
	}
});

//
// Page
//
Page = Control.subclass("Page");
/*
 * General page utility functions.
 */
Page.prototype.extend({
	
	// If true, have the page fill its container.
	fill: Control.bindTo("applyClass/fill"),

    urlParameters: function() {
        return Page.urlParameters();
    },
    	
	// Gets or sets the title of the page.
	title: function(value) {
		if (value !== undefined)
		{
			document.title = value;
		}
		return document.title;
	}

});

/*
 * Class members.
 */
Page.extend({
    
    /*
     * Load the given class as the page's top-level class.
     * 
     * If element is supplied, that element is used to instantiate the control;
     * otherwise the entire body is given over to the control. 
     */
    loadClass: function(pageClass, element, properties) {
    
        var pageClassFn;
        if ($.isFunction(pageClass))
        {
            pageClassFn = pageClass;
        }
        else
        {
            // Convert a string to a function.
            // Only do the conversion if the string is a single, legal
            // JavaScript function name.
            var regexFunctionName = /^[$A-Za-z_][$0-9A-Za-z_]*$/;
            if (!regexFunctionName.test(pageClass))
            {
            	return null;
            }
            pageClassFn = eval(pageClass);
        }
        
        var $element = element ? $(element) : $("body");
        
        var $page = $element
            .empty()                // Remove elements
            .attr("class", "")      // Remove classes
            .control(pageClassFn, properties);
        
        return $page;
    },

    /*
     * Start actively tracking changes in a page specified on the URL.
     * For a URL like www.example.com/index.html#page=Foo, load class Foo.
     * If the page then navigates to www.example.com/index.html#page=Bar, this
     * will load class Bar in situ, without forcing the browser to reload the page. 
     */
    trackClassFromUrl: function(defaultPageClass, element) {
        
        // Watch for changes in the URL after the hash.
        $(window).hashchange(function() {
            var pageClassName = Page.urlParameters().page;
            var pageClass = pageClassName || defaultPageClass;
            Page.loadClass(pageClass, element);
        })
            
        // Trigger a page class load now.
        $(window).hashchange();
    },
    
    /*
     * Return the URL parameters (after "&" and/or "#") as a JavaScript object.
     * E.g., if the URL looks like http://www.example.com/index.html?foo=hello&bar=world
     * then this returns the object
     *
     *    { foo: "hello", bar: "world" }
     *
     */
    urlParameters: function() {
        var regex = /[?#&](\w+)=([^?#&]*)/g;
        var results = {};
        var match = regex.exec( window.location.href );
        while (match != null)
        {
            var parameterName = match[1];
            var parameterValue = match[2];
            results[parameterName] = parameterValue;
            match = regex.exec( window.location.href );
        }
        return results;
    }    
    
});

/*
 * General utility functions made available to all controls.
 */
Control.prototype.extend({
	
	/*
	 * Look up the page hosting a control.
	 */
	page: function() {
        // Get the containing DOM element subclassing Page that contains the element
        var pages = this.closest(".Page");
        
        // From the DOM element, get the associated QuickUI control.
        return (pages.length > 0) ? pages.control() : null;
	}
    
});

//
// Popup
//
Popup = Overlay.subclass("Popup", function renderPopup() {
	this.properties({
		"dismissOnInsideClick": "true"
	}, Overlay);
});

//
// PopupButton
//
PopupButton = Control.subclass("PopupButton", function renderPopupButton() {
	this.properties({
		"content": [
			" ",
			this._define("$PopupButton_content", Control("<div id=\"PopupButton_content\" />")),
			" ",
			this._define("$PopupButton_popup", Popup.create({
				"id": "PopupButton_popup"
			})),
			" "
		]
	}, Control);
});
PopupButton.prototype.extend({
	
	content: Control.bindTo("$PopupButton_content", "content"),
	popup: Control.bindTo("$PopupButton_popup", "content"),

	initialize: function()
	{
		var self = this;
		this.$PopupButton_content().click(function() {
			self.showPopup();
		});
		this.$PopupButton_popup().positionOverlay = function() {
			return self.positionPopup();
		};
	},
	
    positionPopup: function()
    {
        var $contentElement = this.$PopupButton_content();
        var contentTop = $contentElement.position().top;
        var contentHeight = $contentElement.outerHeight(true);
        var $popupElement = this.$PopupButton_popup();
        var popupHeight = $popupElement.outerHeight(true);

        // Try showing popup below.
        var top = contentTop + contentHeight;
        if (top + popupHeight > $(document).height() &&
            contentTop - popupHeight >= 0)         
        {
            // Show popup above.
            top = contentTop - popupHeight;
        }
        $popupElement.css("top", top);
        
        var contentLeft = $contentElement.position().left;
        var popupWidth = $popupElement.outerWidth(true);
        if (contentLeft + popupWidth > $(document).width())
        {
            // Popup will go off right edge of viewport
            var left = $(document).width() - contentLeft - popupWidth;
            left -= 20; // HACK to adjust for scroll bar on right; should really test for that.
            if (contentLeft + left >= 0)
            {
                // Move popup left
                $popupElement.css("left", left);
            }
        }
        
        return this;
    },
    	
	showPopup: function()
	{
		this.$PopupButton_popup().showOverlay();
	}
	
});

//
// Sprite
//
Sprite = Control.subclass("Sprite");
Sprite.prototype.extend({
	
	image: Control.bindTo("css/background-image"),

	// The height of a single cell in the strip, in pixels.
	cellHeight: Control.property(function(value) {
		this.css("height", value + "px");
		this._shiftBackground();
	}),
	
	// The cell currently being shown.
	currentCell: Control.property(function(value) {
		this._shiftBackground();
	}, 0)

});
Sprite.prototype.iterators({
    _shiftBackground: function() {
        if (this.currentCell() != null && this.cellHeight() != null) {
            var y = (this.currentCell() * -this.cellHeight()) + "px";
            if ($.browser.mozilla)
            {
                // Firefox 3.5.x doesn't support background-position-y,
                // use background-position instead.
                var backgroundPosition = this.css("background-position").split(" ");
                backgroundPosition[1] = y;
                this.css("background-position", backgroundPosition.join(" "));          
            }
            else
            {
                // Not Firefox
                this.css("background-position-y", y);
            }
        }
    }
});

//
// Switch
//
Switch = Control.subclass("Switch");
Switch.prototype.extend({
	
	initialize: function() {
	    if (this.children().not(".hidden").length > 1)
	    {
            // Show first child by default. 
            this.activeIndex(0);
	    }
	},
    
    // The currently visible child.
    activeChild: function(activeChild) {
        if (activeChild === undefined)
        {
            return this.children().not(".hidden")[0];
        }
        else
        {
            /*
             * Apply a "hidden" style instead of just forcing display to none.
             * If we did that, we would have no good way to undo the hiding.
             * A simple .toggle(true) would set display: block, which wouldn't
             * be what we'd want for inline elements.
             */
            this.children().not(activeChild).toggleClass("hidden", true);
            $(activeChild).toggleClass("hidden", false);
        }
    },
    
    // The index of the currently visible child.
    activeIndex: function(index)
    {
        if (index === undefined)
        {
            return this.children().index(this.activeChild());
        }
        else
        {
            this.activeChild(this.children()[index]);
        }
    }
        
});

//
// Tab
//
Tab = Control.subclass("Tab");
Tab.prototype.extend({
    name: Control.property()
});

//
// TabSet
//
TabSet = Control.subclass("TabSet", function renderTabSet() {
	this.properties({
		"content": [
			" ",
			VerticalPanels.create({
				"content": [
					" ",
					" ",
					this._define("$TabSet_content", Control("<div id=\"TabSet_content\" />")),
					" "
				],
				"fill": "true",
				"top": [
					" ",
					this._define("$buttons", List.create({
						"id": "buttons"
					})),
					" "
				]
			}),
			" "
		]
	}, Control);
});
TabSet.prototype.extend({

    content: Control.bindTo("$TabSet_content", "content", function() { this._refresh(); }),
    selectTabOnClick: Control.property(null, true),
    buttons: Control.bindTo("$buttons", "children"),
    tabButtonClass: Control.bindTo("$buttons", "itemClass", function() { this._refresh(); }),
    tabs: Control.bindTo("$TabSet_content", "children"),

    selectedTab: function(tab) {
        if (tab === undefined)
        {
            return this.tabs().eq(this.selectedTabIndex);
        }
        else
        {
            var tabIndex = this.tabs().index(tab);
            this.selectedTabIndex(tabIndex);
        }
    },

    selectedTabIndex: Control.property(function(index) {
        
        this.buttons()
            .removeClass("selected")    // Deselect all tab buttons.
            .eq(index)
            .addClass("selected");      // Select the indicated button.
        
        this.tabs()
            .hide()                     // Hide all tabs
            .eq(index)
            .show();                    // Show the selected tab.
        
        this.trigger("onTabSelected", [ index, this.tabs()[index] ]);
    }),
    
    _refresh: function() {
        
        if (this.tabButtonClass() === undefined)
        {
            return;
        }
        
        // Show the names for each tab as a button.
        this.$buttons().items(this._tabNames());

        // By default, clicks on a tab select the tab.
        // TODO: If buttons are moved elsewhere, unbind click event.
        var self = this;
        this.buttons().click(function() {
            if (self.selectTabOnClick())
            {
                var buttonIndex = self.buttons().index(this);
                if (buttonIndex >= 0)
                {
                    self.selectedTabIndex(buttonIndex);
                }
            }
        });
        
        if (this.tabs().length > 0 && this.selectedTabIndex() === undefined) {
            // Select first tab by default.
            this.selectedTabIndex(0);
        }
    },
    
    _tabNames: function() {
        return this.tabs()
            .map(function(index, element) {
                var $control = $(element).control();
                return ($control && $.isFunction($control.name))
                    ? $control.name()
                    : "";
            })
            .get();
    }
});

//
// ToggleButton
//
ToggleButton = ButtonBase.subclass("ToggleButton", function renderToggleButton() {
	this.properties({

	}, ButtonBase);
});
ToggleButton.prototype.extend({
	
	selected: Control.bindTo("applyClass/selected"),
	
	initialize: function() {
		ToggleButton.superclass.prototype.initialize.call(this);
		var self = this;
		this.click(function() {
            if (!self.disabled())
            {
                self.toggle();
            }
		});
	},
	
	toggle: function(value) {
		this.selected(value || !this.selected());
	}
});

//
// VerticalAlign
//
VerticalAlign = Control.subclass("VerticalAlign");

//
// VerticalPanels
//
VerticalPanels = Layout.subclass("VerticalPanels", function renderVerticalPanels() {
	this.properties({
		"content": [
			" ",
			this._define("$VerticalPanels_top", Control("<div id=\"VerticalPanels_top\" />")),
			" ",
			this._define("$VerticalPanels_content", Control("<div id=\"VerticalPanels_content\" />")),
			" ",
			this._define("$VerticalPanels_bottom", Control("<div id=\"VerticalPanels_bottom\" />")),
			" "
		]
	}, Layout);
});
VerticalPanels.prototype.extend({
    
    bottom: Control.bindTo("$VerticalPanels_bottom", "content"),
    content: Control.bindTo("$VerticalPanels_content", "content"),
    fill: Control.bindTo("applyClass/fill"),
    top: Control.bindTo("$VerticalPanels_top", "content"),
    
    layout: function() {
        //this._log("layout");
        var panelHeight = this.$VerticalPanels_top().outerHeight() + this.$VerticalPanels_bottom().outerHeight();
        var availableHeight = this.height() - panelHeight;
        this.$VerticalPanels_content().height(availableHeight);
        return this;
    }
});

//
// Dialog
//
Dialog = Overlay.subclass("Dialog", function renderDialog() {
	this.properties({
		"dismissOnOutsideClick": "false"
	}, Overlay);
});
// Class method
Dialog.extend({
	showDialog: function(dialogClass, properties, callbackOk, callbackCancel) {
		$("body")
			.append("<div/>")
			.find(":last")
	        .bind({
	            ok: function() {
	                if (callbackOk)
	                {
	                    callbackOk.call(this);
	                }
	            },
	            cancel: function() {
	                if (callbackCancel)
	                {
	                    callbackCancel.call(this);
	                }
	            }
	        })
			.control(dialogClass, properties)
			.showOverlay();
	}
});

Dialog.prototype.extend({
	
	initialize: function() {
		Dialog.superClass.prototype.initialize.call(this);
		var self = this;
		this.keydown(function(event) {
			if (event.keyCode == 27)
			{
				self.cancel();
			}
		});
	},

	cancel: function() {
		return this
			.trigger("cancel")
			.closeOverlay();
	},
	
	close: function() {
		return this
			.trigger("ok")
			.closeOverlay();
	},
	
	positionOverlay: function() {
		// Center dialog horizontally and vertically.
		return this.css({
			left: ($(window).width() - this.outerWidth()) / 2,
			top: ($(window).height() - this.outerHeight()) / 2
		});
	}
});

//
// HorizontalPanels
//
HorizontalPanels = Layout.subclass("HorizontalPanels", function renderHorizontalPanels() {
	this.properties({
		"content": [
			" ",
			this._define("$HorizontalPanels_left", Control("<div id=\"HorizontalPanels_left\" />")),
			" ",
			this._define("$HorizontalPanels_content", Control("<div id=\"HorizontalPanels_content\" />")),
			" ",
			this._define("$HorizontalPanels_right", Control("<div id=\"HorizontalPanels_right\" />")),
			" "
		]
	}, Layout);
});
HorizontalPanels.prototype.extend({
    
    content: Control.bindTo("$HorizontalPanels_content", "content"),
    fill: Control.bindTo("applyClass/fill"),
    left: Control.bindTo("$HorizontalPanels_left", "content"),
    right: Control.bindTo("$HorizontalPanels_right", "content"),
	
	layout: function() {
        //this._log("layout");
	    var panelLeftWidth = this.$HorizontalPanels_left().outerWidth();
	    var panelRightWidth = this.$HorizontalPanels_right().outerWidth();
	    this.$HorizontalPanels_content().css({
	        left: panelLeftWidth,
	        right: panelRightWidth
	    });
        return this;
	}
});

