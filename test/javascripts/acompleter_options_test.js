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
