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
    var assertInactive = function() {
		equal( plugin.results.length, 0, "results are not loaded" );
        equal( plugin._active, false, "plugin is not active" );
        equal( plugin.getItems().length, 0, "results are not displayed" );
		ok( plugin.$results.is(":hidden"), "list is hidden" );
    };

    plugin.options.minChars = 3;
    expect( 12 );

	Syn.click( {}, plugin.$el ).type("J");

	this.waitDelay(function() {
        assertInactive();
        Syn.type( "a", plugin.$el ); // typed: Ja
        self.waitDelay(function() {
            assertInactive();
            Syn.type( "v", plugin.$el ); // typed Jav
            self.waitDelay(function() {
                start();
                equal( plugin.results.length, 2, "results are loaded" );
                equal( plugin._active, true, "plugin is not active" );
                equal( plugin.getItems().length, 2, "results are displayed" );
                ok( plugin.$results.is(":visible"), "list is visible" );
            });
        });
	});
});
