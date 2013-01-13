module( "Keyboard interaction", {
	setup: function() {
		console.log("Keyboard interaction.setup");
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({ data: localData });
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
	},
	teardown: function() {
		console.log("Keyboard interaction.teardown");
		this.$fixture.find("input").acompleter("destroy");
	}
});

asyncTest( "Ignore special & navigation keys", function() {
	var plugin = this.plugin;	
	plugin.activate = function() { 
		ok( false, "Activate method should not be executed" );
	};
	expect( 2 );
	
	Syn.click( {}, "test-input" ).type( "[left][right][home][end][page-up][page-down][shift][insert][ctrl][alt][caps]" );

	this.waitDelay(function() {
		ok( plugin.results.length === 0, "Results are not loaded" );
		ok( plugin.$results.is(":hidden"), "List is hidden" );
		start();
	});
});

asyncTest( "Up arrow first time executes activate method", function() {
	var plugin = this.plugin;
	plugin.focusPrev = function() { ok( false, "focusPrev should not be executed" ) };
	plugin.activate = function() { ok( true, "activate is executed" ) };
	expect( 1 );
	
	Syn.click( {}, "test-input" ).type("[up]");
	this.waitDelay(function() { start(); });	
});

asyncTest( "Down arrow first time executes activate method", function() {
	var plugin = this.plugin;
	plugin.focusNext = function() { ok( false, "focusNext should not be executed" ) };
	plugin.activate = function() { ok( true, "activate is executed" ) };
	expect( 1 );
	
	Syn.click( {}, "test-input" ).type("[down]");
	this.waitDelay(function() { start(); });	
});

asyncTest( "Navigation and scroll down", function() {
    var plugin = this.plugin;
    plugin.options.listLength = 3;


    var assertNavigation = function( index ) {
        equal( plugin._current.index, index, "current position updated" );
        equal( plugin._current.valueToCompare, localData[index], "current value updated" );
        ok( plugin.getItems().eq(index).hasClass("current"), "highlight updated" );
    };

    // activate list
	Syn.click( {}, "test-input" ).type("[down]");

	this.waitDelay(function() {
        deepEqual( plugin.results, localData, "data is loaded" );
        equal( plugin.getItems().length, 3, "list length is correct" );
        // select second item
        Syn.type( "[down]", "test-input" );
        setTimeout(function() {
            assertNavigation( 1 );

            // select third item
            Syn.type( "[down]", "test-input" );
            setTimeout(function() {
                assertNavigation( 2 );
                // select forth item (activate scroll)
                Syn.type( "[down]", "test-input" );
                setTimeout(function() {
                    start();
                    equal( plugin._current.index, 3, "current position updated" );
                    equal( plugin._current.valueToCompare, localData[3], "current value updated" );
                    ok( plugin.getItems().eq(2).hasClass("current"), "highlight third item" );
                    equal( plugin.getItems().length, 3, "list length = 3" );
                    equal( plugin.getItems().eq(0).text(), localData[1], "list scrolled" );
                    equal( plugin.getItems().eq(2).text(), localData[3], "list scrolled" );
                }, 10);
            }, 10);
        }, 10);
    });	
});


asyncTest( "Navigation and scroll up", function() {
    var plugin = this.plugin;
    plugin.options.listLength = 3;


    var assertCurrent = function( index ) {
        equal( plugin._current.index, index, "current position updated" );
        equal( plugin._current.valueToCompare, localData[index], "current value updated" );
    };

    // activate list
	Syn.click( {}, "test-input" ).type("[down]");

	this.waitDelay(function() {
        deepEqual( plugin.results, localData, "data is loaded" );
        equal( plugin.getItems().length, 3, "list length is correct" );
        // scroll down 
        Syn.type( "[down][down][down]", "test-input" );
        setTimeout(function() {
            assertCurrent( 3 );
            ok( plugin.getItems().eq(2).hasClass("current"), "highlight third item" );

            // move up to top of the list
            Syn.type( "[up][up]", "test-input" );
            setTimeout(function() {
                assertCurrent( 1 );
                ok( plugin.getItems().eq(0).hasClass("current"), "highlighted first item" );

                // scroll up to first result
                Syn.type( "[up]", "test-input" );
                setTimeout(function() {
                    start();
                    assertCurrent( 0 );
                    ok( plugin.getItems().eq(0).hasClass("current"), "highlighted first item" );
                    equal( plugin.getItems().eq(0).text(), localData[0], "list scrolled" );
                    equal( plugin.getItems().eq(2).text(), localData[2], "list scrolled" );
                }, 100);
            }, 100);
        }, 100);
    });	
});


asyncTest( "On blur hide results", function() {
    var plugin = this.plugin;

    Syn.click( {}, "test-input" ).type( "[down]" );

    this.waitDelay(function() {
        deepEqual( plugin.results, localData, "data is loaded" );
        ok( plugin.$results.is(":visible"), "results are shown" );
        start();
    });
});
