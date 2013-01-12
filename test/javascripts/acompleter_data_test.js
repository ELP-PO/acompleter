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

	Syn.click( {}, "test-input" ).type("A\b");

    this.waitDelay(function() {
		deepEqual( plugin.results, plugin.options.data, "Local data fully loaded" );
		start();
    });
});


asyncTest( "Local data is filtered propertly", function() {
	var plugin = this.plugin;
	expect( 2 );

	Syn.click( {}, "test-input" ).type("Java");

	this.waitDelay(function() {
		equal( plugin.results.length, 2, "Finded two results" );
		equal( plugin.$results.find("ul>li").length, 2, "Displayed two results" );
		start();
	});
});
