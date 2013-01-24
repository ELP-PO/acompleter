module( "Events", {
	setup: function() {
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({ data: localData });
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
        this.assertCurrent = function( index ) {
            equal( this.plugin._current.index, index, "current position updated" );
            equal( this.plugin._current.valueToCompare, localData[index], "current value updated" );
        };
        this.assertNavigation = function( index ) {
            this.assertCurrent( index );
            ok( this.plugin.getItems().eq(index).hasClass("current"), "highlight updated" );
        };
	},
	teardown: function() {
		this.$fixture.find("input").acompleter("destroy");
	}
});

asyncTest( "Ignore special & navigation keys", function() {
	var plugin = this.plugin;	
	plugin.activate = function() { 
		ok( false, "Activate method should not be executed" );
	};
	expect( 0 );
	
	Syn.click( {}, this.$el ).type( "[left][right][home][end][page-up][page-down][shift][insert][ctrl][alt][caps]" );

	this.waitDelay(function() { start(); });
});

asyncTest( "Up arrow first time executes activate method", function() {
	var plugin = this.plugin;
	plugin.focusPrev = function() { ok( false, "focusPrev should not be executed" ) };
	plugin.activate = function() { ok( true, "activate is executed" ) };
	expect( 1 );
	
	Syn.click( {}, this.$el ).type("[up]");
	this.waitDelay(function() { start(); });	
});

asyncTest( "Down arrow first time executes activate method", function() {
	var plugin = this.plugin;
	plugin.focusNext = function() { ok( false, "focusNext should not be executed" ) };
	plugin.activate = function() { ok( true, "activate is executed" ) };
	expect( 1 );
	
	Syn.click( {}, this.$el ).type("[down]");
	this.waitDelay(function() { start(); });	
});

asyncTest( "Navigation and scroll down", function() {
    var self = this;
    this.plugin.options.listLength = 3;

    // activate list
	Syn.click( {}, this.$el ).type("[down]");

	this.waitDelay(function() {
        equal( self.plugin.results.length, localData.length, "data is loaded" );
        equal( self.plugin.getItems().length, 3, "list length is correct" );

        // select second item
        Syn.type( "[down]", self.$el, function() {
                self.assertNavigation( 1 );
            })
            // select third item
            .then( "_type", "[down]", function() {
                self.assertNavigation( 2 );
            })
            // select forth item (activate scroll)
            .then( "_type", "[down]", function() {
                var items = self.plugin.getItems();
                start();
                self.assertCurrent( 3 );
                ok( items.eq(2).hasClass("current"), "highlight third item" );
                equal( items.eq(0).text(), localData[1], "list scrolled" );
                equal( items.eq(2).text(), localData[3], "list scrolled" );
                equal( items.length, 3, "list length = 3" );
            });
    });
});


asyncTest( "Navigation and scroll up", function() {
    var self = this;
    this.plugin.options.listLength = 3;

    // activate list
	Syn.click( {}, this.$el ).type("[down]");

	this.waitDelay(function() {
        equal( self.plugin.results.length, localData.length, "data is loaded" );
        equal( self.plugin.getItems().length, 3, "list length is correct" );

        // scroll down 
        Syn.type( "[down][down][down]", self.$el, function() {
                self.assertCurrent( 3 );
                ok( self.plugin.getItems().eq(2).hasClass("current"), "highlight third item" );
            })
            // move up to top of the list
            .then( "_type", "[up][up]", function() {
                self.assertCurrent( 1 );
                ok( self.plugin.getItems().eq(0).hasClass("current"), "highlighted first item" );
            })
            // scroll up to first result
            .then( "_type", "[up]", function() {
                start();
                self.assertCurrent( 0 );
                ok( self.plugin.getItems().eq(0).hasClass("current"), "highlighted first item" );
                equal( self.plugin.getItems().eq(0).text(), localData[0], "list scrolled" );
                equal( self.plugin.getItems().eq(2).text(), localData[2], "list scrolled" );
            });
    });
});


asyncTest( "Hide results when blur", function() {
    var plugin = this.plugin;

    Syn.click( {}, this.$el ).type( "[down]" );

    this.waitDelay(function() {
        equal( plugin._active, true, "plugin is activated" );

        plugin.$el.blur();

        setTimeout(function() {
            start();
            equal( plugin._active, false, "plugin is deactivated" );
        }, 10);

    });
});


asyncTest( "Hide results when escape", function() {
    var plugin = this.plugin;

    Syn.click( {}, this.$el ).type( "[down]" );

    this.waitDelay(function() {
        equal( plugin._active, true, "plugin is activated" );

        Syn.type( "[escape]", plugin.$el, function() {
            start();
            equal( plugin._active, false, "plugin is deactivated" );
        });
    });
});


asyncTest( "Select current on enter", function() {
    var plugin = this.plugin;

    // activate list
    Syn.click( {}, plugin.$el ).type("[down]");

    this.waitDelay(function() {
        // navigate to fifth item
        Syn.type( "[down][down][down][down]", plugin.$el, function() {
                equal( plugin._current.valueToCompare, "Javascript", "javascript selected") ;
            })
            // select current item
            .then( "_type", "\r", function() {
                start();
                equal( plugin.$el.val(), "Javascript", "correct value selected" );
                equal( plugin._active, false, "plugin is deactivated" );
            });
    });
});


asyncTest( "Select item by click", function() {
    var plugin = this.plugin;

    // activate list
    Syn.click( {}, plugin.$el ).type("[down]");
    
    this.waitDelay(function() {
        // click to the fifth item
        Syn.click( {}, plugin.getItems().eq(4), function() {
            start();
            equal( plugin.$el.val(), "Javascript", "correct value selected" );
            equal( plugin._active, false, "plugin is deactivated" );
        });
    });
});


asyncTest( "Focus item by mouseover", function() {
    var self = this;

    // activate list
    Syn.click( {}, self.$el ).type("[down]");

    this.waitDelay(function() {
        self.plugin.getItems().eq(4).trigger("mouseover");
        setTimeout(function() {
            start();
            self.assertNavigation(4);
        }, 10);
    });
});


asyncTest( "Activate plugin by double click", function() {
    var plugin = this.plugin;

    Syn.dblclick( {}, plugin.$el );

    this.waitDelay(function() {
        start();
        equal( plugin.results.length, localData.length, "data is loaded" );
        equal( plugin._active, true, "plugin is activated" );
    });
});
