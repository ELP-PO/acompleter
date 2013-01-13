module( "Local data", {
	setup: function() {
		console.log("Local data.setup");
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({
			data: localData,
			minChars: 0
		});
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
	},
	teardown: function() {
		console.log("Local data.teardown");
		this.$fixture.find("input").acompleter("destroy");
	}
});


asyncTest( "Local data is loaded", function() {
	var plugin = this.plugin;
	expect( 1 );

	Syn.click( {}, this.$el ).type("A\b");

    this.waitDelay(function() {
		deepEqual( plugin.results, plugin.options.data, "local data fully loaded" );
		start();
    });
});


asyncTest( "Local data is filtered propertly", function() {
	var plugin = this.plugin;
	expect( 2 );

	Syn.click( {}, this.$el ).type("Java");

	this.waitDelay(function() {
		equal( plugin.results.length, 2, "found two results" );
		equal( plugin.getItems().length, 2, "displayed two results" );
		start();
	});
});
