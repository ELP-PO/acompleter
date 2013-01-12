module( "Keyboard interaction", {
	setup: function() {
		console.log("Keyboard interaction.setup");
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter();
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


/* TODO:
bla bla 
bla bla
*/
