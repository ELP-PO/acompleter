// Test proper initialization which appears at the start of the page without user interaction
module( "Setup", {
	setup: function() {
		this.$el = $( "#test-input" );
		this.resultsClassSelector = "." + $.Acompleter._defaults.resultsClass;
		this.resultsIdSelector = "#" + $.Acompleter._defaults.resultsId;
	},
	teardown: function() {
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
	$elements = $( "#qunit-fixture input" );
	deepEqual( $elements.acompleter(), $elements, "plugin is chained" );
});

// Human interaction tests
module( "Acompleter", {
	setup: function() {
		this.$el = $( "#test-input" ).acompleter();
		this.plugin = this.$el.data('plugin_acompleter');
		this.resultsClass = $.Acompleter._defaults.resultsClass;
		this.resultsId = $.Acompleter._defaults.resultsId;
		this.localData = [ "Acompleter", "Belsky", "Handmade", "Javascript", "QUnit", "JQuery", "May", "All", "Beings", "Be", "Happy" ];
	},
	teardown: function() {
		$(this.resultsClassSelector).remove();
		$(this.resultsIdSelector).remove();
	}
});


asyncTest( "Loading of local data", function() {
	var plugin = this.plugin;
	plugin.options.data = this.localData;
	plugin.options.minChars = 0;
	expect( 1 );

	Syn.click( {}, "test-input" ).type("A\b");

	setTimeout(function() {
		deepEqual( plugin.results, plugin.options.data, "Local data saved as results" );
		start();
	}, plugin.options.delay + 100 );
});









