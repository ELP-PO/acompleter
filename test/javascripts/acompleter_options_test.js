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
	var plugin = this.plugin;
        self = this;
    plugin.options.minChars = 3;
    expect( 14 );

	Syn.click( {}, "test-input" ).type("J");

	this.waitDelay(function() {
		equal( plugin.results.length, 0, "Results are not loaded" );
        equal( plugin._active, false, "Plugin is not active" );
        equal( plugin.$results.find(">ul>li").length, 0, "Results are not displayed" );
		ok( plugin.$results.is(":hidden"), "List is hidden" );
        Syn.click( {}, "test-input" ).type("a");

        self.waitDelay(function() {
            equal( plugin.$elem.val(), "Ja", "kb ok" );
            equal( plugin.results.length, 0, "Results are not loaded" );
            equal( plugin._active, false, "Plugin is not active" );
            equal( plugin.$results.find(">ul>li").length, 0, "Results are not displayed" );
            ok( plugin.$results.is(":hidden"), "List is hidden" );

            Syn.click( {}, "test-input" ).type("v");
            self.waitDelay(function() {
                equal( plugin.$elem.val(), "Jav", "kb ok" );
                equal( plugin.results.length, 2, "Results are loaded" );
                equal( plugin._active, true, "Plugin is not active" );
                equal( plugin.$results.find(">ul>li").length, 2, "Results are displayed" );
                ok( plugin.$results.is(":visible"), "List is visible" );
                start();
            });
        });
        

	});


});
