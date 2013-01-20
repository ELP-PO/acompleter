var resultsClassSelector = "." + $.Acompleter._defaults.resultsClass,
    resultsIdSelector = "#" + $.Acompleter._defaults.resultsId;

// Test proper initialization which appears at the start of the page without user interaction
module( "Setup", {
	setup: function() {
		console.log("Setup.setup");
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input");
	},
	teardown: function() {
		console.log("Setup.teardown");
		this.$fixture.find("input").acompleter("destroy");
	}
});

test( "Plugin is created propertly", function() {
	strictEqual( this.$el.data("plugin_acompleter"), undefined, "plugin is not initialized" );
	strictEqual( $(this.resultsClassSelector).length, 0, "results element is absent (check by class)" );
	
	this.$el.acompleter();
	
	var plugin = this.$el.data("plugin_acompleter");
	ok( plugin, "plugin instance is attached to element's data" );
	ok( plugin instanceof $.Acompleter, "plugin is instance of $.Acompleter" );
	strictEqual( plugin.$elem.get(0), this.$el.get(0), "plugin element is attached propertly" );
	strictEqual( plugin.$results.get(0), $(this.resultsIdSelector + plugin.uid).get(0), "plugin results list is created" );
	strictEqual( $(this.resultsClassSelector).length, 1, "plugin results list is only one" );
});

test( "Plugin is destroyed propertly", function() {
	expect( 7 );

	domEqual( "#test-input", function() {
		$( "#test-input" ).acompleter().acompleter( "destroy" );
	}, "One instance, clear element" );
	equal( $( resultsClassSelector ).length, 0, "One instance, results removed" );
	
	$("#qunit-fixture").append("<input>");
	$inputs = $("#qunit-fixture input");
	equal( $inputs.length, 2, "Two instances" );
	domEqual( $inputs, function() {
		$inputs.acompleter().acompleter( "destroy" );
	}, "Two instances, clear element" );
	equal( $( resultsClassSelector ).length, 0, "Two instances, results removed" );
	
});

test( "Many plugins have individual results element", function() {
	$( "#qunit-fixture" ).append( "<input>" ).append( "<input>" );
	strictEqual( $(this.resultsClassSelector).length, 0, "results element is absent (check by class)" );
	$( "#qunit-fixture input" ).acompleter();

	strictEqual( $(this.resultsClassSelector).length, 3, "every plugin has own results element" );
});


test( "Plugin is chained propertly", function() {
	this.$fixture.append( "<input>" );
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


