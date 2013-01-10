// Test proper initialization which appears at the start of the page without user interaction
module( "Setup", {
	setup: function() {
		console.log("Setup.setup");
		this.$el = $( "#test-input" );
		this.resultsClassSelector = "." + $.Acompleter._defaults.resultsClass;
		this.resultsIdSelector = "#" + $.Acompleter._defaults.resultsId;
	},
	teardown: function() {
		console.log("Setup.teardown");
		$(this.resultsClassSelector).remove();
		$(this.resultsIdSelector).remove();
	}
});

test( "Plugin is created propertly", function() {
	strictEqual( this.$el.data("plugin_acompleter"), undefined, "plugin is not initialized" );
	strictEqual( $(this.resultsClassSelector).length, 0, "results element is absent (check by class)" );
	strictEqual( $(this.resultsIdSelector).length, 0, "results element is absent (check by id)" );
	
	this.$el.acompleter();
	
	var plugin = this.$el.data("plugin_acompleter");
	ok( plugin, "plugin instance is attached to element's data" );
	ok( plugin instanceof $.Acompleter, "plugin is instance of $.Acompleter" );
	strictEqual( plugin.$elem.get(0), this.$el.get(0), "plugin element is attached propertly" );
	strictEqual( plugin.$results.get(0), $(this.resultsIdSelector).get(0), "plugin results list is created" );
	strictEqual( $(this.resultsClassSelector).length, 1, "plugin results list is only one" );
});

test( "Many plugins share one results element", function() {
	$( "#qunit-fixture" ).append( "<input>" ).append( "<input>" );
	strictEqual( $(this.resultsClassSelector).length, 0, "results element is absent (check by class)" );
	
	$( "#qunit-fixture input" ).acompleter();
	
	strictEqual( $(this.resultsClassSelector).length, 1, "results element is only one" );
});


test( "Plugin is chained propertly", function() {
	$( "#qunit-fixture" ).append( "<input>" );
	var $elements = $( "#qunit-fixture input" );
	deepEqual( $elements.acompleter(), $elements, "plugin is chained" );
});

test( "Options is loaded propertly", function() {
	var defaults = $.Acompleter._defaults;
	var options = {
		bla_bla_bla: "bla-bla-bla",
		data: [ "local", "data" ],
		listLength: 0,
    	minChars: 100,
    	matchInside: false
	};
	
	deepEqual(
		this.$el.acompleter(options).data("plugin_acompleter").options,
		$.extend( {}, defaults, options ),
		"plugin options is defaults + passed options"
	);
});

module( "Keyboard interaction", {
	setup: function() {
		console.log("Keyboard interaction.setup");
		this.$el = $( "#test-input" ).acompleter();
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
		this.resultsClassSelector = "." + $.Acompleter._defaults.resultsClass;
		this.resultsIdSelector = "#" + $.Acompleter._defaults.resultsId;
	},
	teardown: function() {
		console.log("Keyboard interaction.teardown");
		$(this.resultsClassSelector).remove();
		$(this.resultsIdSelector).remove();
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


module( "Local data", {
	setup: function() {
		console.log("Local data.setup");
		this.localData = [ "Acompleter", "Belsky", "Handmade", "Javascript", "QUnit", "JQuery", "May", "All", "Beings", "Be", "Happy" ];
		this.$el = $( "#test-input" ).acompleter({
			data: this.localData,
			minChars: 0
		});
		this.plugin = this.$el.data('plugin_acompleter');
		this.resultsClassSelector = "." + $.Acompleter._defaults.resultsClass;
		this.resultsIdSelector = "#" + $.Acompleter._defaults.resultsId;
	},
	teardown: function() {
		console.log("Local data.teardown");
		$(this.resultsClassSelector).remove();
		$(this.resultsIdSelector).remove();
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


