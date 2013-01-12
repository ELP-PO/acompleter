/*
module( "Local data", {
	setup: function() {
		console.log("Local data.setup");
		this.localData = [ "Acompleter", "Belsky", "Handmade", "Javascript", "QUnit", "JQuery", "May", "All", "Beings", "Be", "Happy" ];
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({
			data: this.localData,
			minChars: 0
		});
		this.plugin = this.$el.data('plugin_acompleter');
	},
	teardown: function() {
		console.log("Local data.teardown");
		this.$fixture.find("input").acompleter("destroy");
	}
});


asyncTest( "Loading of local data", function() {
	var plugin = this.plugin;
	expect( 1 );

	Syn.click( {}, "test-input" ).type("A\b");

	setTimeout(function() {
		deepEqual( plugin.results, plugin.options.data, "Local data saved as results" );
		start();
	}, plugin.options.delay + 100 );
});

*/
