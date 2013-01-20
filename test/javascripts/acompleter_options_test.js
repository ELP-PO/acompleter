module( "Options", {
	setup: function() {
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({
			data: localData
		});
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
	},
	teardown: function() {
		this.$fixture.find("input").acompleter("destroy");
	}
});


asyncTest( "minChars", function() {
	var plugin = this.plugin,
        self = this;
    plugin.options.minChars = 3;
    expect( 5 );

	Syn.click( {}, plugin.$el ).type("Ja");

    self.waitDelay(function() {
        equal( plugin._active, false, "plugin is not active" );
        Syn.type( "v", plugin.$el ); // typed Jav
        self.waitDelay(function() {
            start();
            equal( plugin._active, true, "plugin is active" );
            equal( plugin.results.length, 2, "results are loaded" );
            equal( plugin.getItems().length, 2, "results are displayed" );
            ok( plugin.$results.is(":visible"), "list is visible" );
        });
    });
});

asyncTest( "onItemSelect", function() {
	var plugin = this.plugin;

    plugin.options.onItemSelect = function( result, plugin_ ) {
        start();
        deepEqual( result, { value: "Javascript", data: {} }, "correct result provided" );
        equal( plugin_, plugin, "plugin instance provided" );
    };
    expect( 2 );

    // activate list
    Syn.click( {}, plugin.$el ).type("[down]");

    this.waitDelay(function() {
        // navigate to fifth item and select it
        Syn.type( "[down][down][down][down]\r", plugin.$el );
    });
});

asyncTest( "displayValue", function() {
	var plugin = this.plugin;

    plugin.options.displayValue = function( result ) {
        return "==" + result.value + "==";
    };

    // activate list
    Syn.click( {}, plugin.$el ).type("[down]");

    this.waitDelay(function() {
        // navigate to fifth item (Javascript) and select it
        Syn.type( "[down][down][down][down]\r", plugin.$el, function() {
            start();
            equal( plugin.$el.val(), "==Javascript==", "display value is valid" );
        });
    });
});
