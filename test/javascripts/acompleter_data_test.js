(function( $ ) {

var localData = [ "c++", "Java", "Php", "Coldfusion", "Javascript", "Asp", "Ruby", "Python", "C", "Scala", "Groovy", "Haskell", "Perl" ];
    

module( "Local data", {
	setup: function() {
		console.log("Local data.setup");
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({
			data: localData,
			minChars: 0
		});
		this.plugin = this.$el.data('plugin_acompleter');
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

	setTimeout(function() {
		deepEqual( plugin.results, plugin.options.data, "Local data fully loaded" );
		start();
	}, plugin.options.delay + 100 );
});


}( jQuery ));
