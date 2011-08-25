//
// BrowserSpecific
//
BrowserSpecific = Control.subclass("BrowserSpecific");
BrowserSpecific.prototype.extend({

    "default": Control.property(),
    "mozilla": Control.property(),
    "msie": Control.property(),
    "opera": Control.property(),
    "webkit": Control.property(),
	
	initialize: function() {
	    var content;
	    if ($.browser.mozilla)
	    {
	        content = this.mozilla();
	    }
	    else if ($.browser.msie)
	    {
	        content = this.msie();
	    }
	    if ($.browser.opera)
	    {
	        content = this.opera();
	    }
	    if ($.browser.webkit)
	    {
	        content = this.webkit();
	    }
	    if (content === undefined)
	    {
	        content = this["default"]();
	    }
	    this.content(content);
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
// DeviceSpecific
//
DeviceSpecific = Control.subclass("DeviceSpecific");
// Class members
DeviceSpecific.extend({
    isMobile: function() {
        var userAgent = navigator.userAgent;
        return (userAgent.indexOf("Mobile") >= 0 && userAgent.indexOf("iPad") < 0); 
    }    
});

DeviceSpecific.prototype.extend({

    "defaultClass": Control.property["class"](),
    "mobileClass": Control.property["class"](),
    "default": Control.property(),
    "mobile": Control.property(),
    
    initialize: function() {

        var deviceClass;
        var deviceClasses;
        var deviceContent;

        // Determine which content, class, and styles to apply.        
        if (DeviceSpecific.isMobile())
        {
            deviceClass = this.mobileClass();
            deviceClasses = "mobile";
            deviceContent = this.mobile();
        }
        if (deviceClass === undefined)
        {
            deviceClass = this.defaultClass();
        }
        if (deviceContent === undefined)
        {
            deviceContent = this["default"]();
        }
        
        // Transmute, if requested. After this, we need to take care to 
        // reference the control with the new class; "this" will be the old class. 
        var $control = deviceClass
            ? this.transmute(deviceClass, false, true)
            : this;
        
        // Apply device-specific content, if defined.
        if (deviceContent)
        {
            $control.content(deviceContent);
        }
        
        // Apply device-specific CSS classes, if defined.
        if (deviceClasses)
        {
            $control.addClass(deviceClasses);
        }
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
// TODO: Most of this has been factored into the new insertedIntoDocument() event,
// so rewrite this to use that.
Layout.extend({
    
    /*
     * Re-layout any controls in the DOM.
     */
    recalc: function() {
        //console.log("recalc");
        // Call the layout() method of any control whose size has changed.
        var i = 0;
        while (i < this._controlsToLayout.length)
        {
            var $control = Control(this._controlsToLayout[i]).control();
            if ($control)
            {
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
                i++;
            }
            else
            {
                // Control unavailable, likely no longer in DOM;
                // remove it from our list of controls to track.
                this._controlsToLayout.splice(i, 1);
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
        $controls.insertedIntoDocument(function() {
            this.layout();
            Layout._controlsToLayout = Layout._controlsToLayout.concat(this);
        });
    },

    /* TODO: Allow a control to be stop being tracked for layout purposes.
    untrack: function($controls) {
        ...
        this.recalc();
    },
    */
    
    /*
     * Initialize layout engine overall (not a specific instance).
     */
    _initialize: function() {
        
        if (this._initialized)
        {
            // Already did this.
            return;
        }
        
        // The following control array is maintained in order such that
        // DOM parents come before their children. 
        this._controlsToLayout = [];
        
        // Recalc layout whenever the window size changes.
        $(window).resize(function() {
            Layout.recalc();
        });
        
        this._initialized = true;
    }
        
});

//
// List
//
List = Control.subclass("List");
List.prototype.extend({
    
    // The control class that should be used to render items in the list.
    itemClass: Control.property["class"](function() { this._refresh(); }, Control),
    
    // The collection of controls in the list generated by setting the items() property.
    controls: Control.bindTo("children", "cast"),
    
    // True if the control should mark itself dirty when it gets a change event.
    dirtyOnChange: Control.property.bool(null, false),
    
    // True if the control contents have been changed since the controls were first created.
    isDirty: Control.property.bool(null, true),
    
    // A copy of the items the last time they were created or refreshed.
    _itemsCache: Control.property(),
    
    initialize: function() {
        var self = this;
        this.change(function(event) {
            if (self.dirtyOnChange()) {
                // Assume the list is dirty.
                self.isDirty(true);
            }
        });
    },
    
    // The items in the list.
    items: function(items) {
        if (items === undefined)
        {
            if (this.isDirty())
            {
                this
                    ._itemsCache(this._getItemsFromControls())
                    .isDirty(false);
            }
            return this._itemsCache();
        }
        else
        {
            return this
                ._itemsCache(items)
                ._createControlsForItems(items)
                .isDirty(false);
        }
    },
    
    //
    // Used to map an incoming list item to property setters on the control
    // class indicated by itemClass. This can either be a simple string,
    // in which case it will be taken as the name of a control class property,
    // Alternately, this can be a function of the form:
    //
    //      function foo(index, item) { ... }
    //
    // where index is control's position in the list, and item is the list item.
    // If item is undefined, the map function is being invoked as a getter,
    // and should extract the item from the control (available via "this").
    // If item is defined, the map function is being invoked as a setter, and
    // should pass the item to the control (e.g., by setting properties on it).
    //
    mapFunction: Control.property(
        function() { this._refresh(); },
        "content"
    ),
    
    _createControlsForItems: function(items) {
        var itemClass = this.itemClass();
        var mapFunction = this._getMapFunction();
        var controls = $.map(items, function(item, index) {
            var $control = itemClass.create();
            mapFunction.call($control, index, item);
            return $control;
        });
        this.content(controls);
        return this;
    },
    
    _getItemsFromControls: function() {
        var mapFunction = this._getMapFunction();
        return this.controls().map(function(index, element) {
            var $control = $(element).control();
            return mapFunction.call($control, index);
        }).get();
    },
    
    /*
     * If the list's mapFunction property is a simple string, create a
     * function that invokes the item control's property getter/setter with
     * that string name. Otherwise, return the mapFunction value as is.  
     */
    _getMapFunction: function() {
        var mapFunction = this.mapFunction();
        return typeof mapFunction === "string"
            ? function(index, item) { return this[mapFunction](item); }
            : mapFunction;
    },

    // Get all the items, then recreate them again (possibly as different controls).        
    _refresh: function() {
        this.items(this.items());
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
	dismissOnEscapeKey: Control.property.bool(null, true),
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
	
    cancel: function() {
        return this
            .trigger("cancel")
            .hideOverlay();
    },
    
    close: function() {
        return this
            .trigger("close")
            .hideOverlay();
    },
    
	hideOverlay: function()
	{
        this
            ._bindKeydownHandler(false)
			.hide()
			.css("z-index", null); // No need to define Z-order any longer.
		if (this.blanket() != null)
		{
			this.blanket().remove();
			this.blanket(null);
		}
        
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
            ._bindKeydownHandler(true)
			.css("z-index", maximumZIndex + 2)
			.show()
			.positionOverlay()
			.trigger("open");
	},
    
    _bindKeydownHandler: function(handleKeydown) {
        var handler;
        if (handleKeydown)
        {
            var self = this;
            handler = function(event) {
                if (self.dismissOnEscapeKey() && event.keyCode === 27 /* Escape */)
                {
                    self.cancel();
                }
            }
            this.data("_keydownHandler", handler);
            $(document).bind("keydown", handler);
        }
        else
        {
            handler = this.data("_keydownHandler");
            if (handler)
            {
                $(document).unbind("keydown", handler);
            }
        }
        return this;
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
     * Start actively tracking changes in a page specified on the URL.
     * For a URL like www.example.com/index.html#page=Foo, load class Foo.
     * If the page then navigates to www.example.com/index.html#page=Bar, this
     * will load class Bar in situ, without forcing the browser to reload the page. 
     */
    trackClassFromUrl: function(defaultPageClass, target) {
        
        var $control = Control(target || "body");
        
        // Watch for changes in the URL after the hash.
        $(window).hashchange(function() {
            var pageClass = Page.urlParameters().page || defaultPageClass;
            $control.transmute(pageClass);
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
    selectTabOnClick: Control.property.bool(null, true),
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
            var buttonIndex = self.buttons().index(this);
            if (buttonIndex >= 0)
            {
                if (self.selectTabOnClick())
                {
                    self.selectedTabIndex(buttonIndex);
                }
                self.trigger("onTabClicked", [ buttonIndex, self.tabs()[buttonIndex] ]);
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
	            close: function() {
	                if (callbackOk)
	                {
	                    callbackOk.call($(this).control());
	                }
	            },
	            cancel: function() {
	                if (callbackCancel)
	                {
	                    callbackCancel.call($(this).control());
	                }
	            }
	        })
			.control(dialogClass, properties)
			.showOverlay();
	}
});

Dialog.prototype.extend({
    
    cancel: function() {
        Dialog.superclass.prototype.cancel.call(this);
        this.remove();
    },
    
    close: function() {
        Dialog.superclass.prototype.close.call(this);
        this.remove();
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

