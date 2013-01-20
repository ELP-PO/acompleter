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
	strictEqual( $(resultsClassSelector).length, 0, "results element is absent (check by class)" );
	
	this.$el.acompleter();
	
	var plugin = this.$el.data("plugin_acompleter");
	ok( plugin, "plugin instance is attached to element's data" );
	ok( plugin instanceof $.Acompleter, "plugin is instance of $.Acompleter" );
	strictEqual( plugin.$el.get(0), this.$el.get(0), "plugin element is attached propertly" );
	strictEqual( plugin.$results.get(0), $(resultsIdSelector + plugin.uid).get(0), "plugin results list is created" );
	strictEqual( $(resultsClassSelector).length, 1, "plugin results list is only one" );
});

test( "Plugin is destroyed propertly", function() {
	domEqual( "#test-input", function() {
		$( "#test-input" ).acompleter().acompleter( "destroy" );
	}, "One instance, clear element" );
	equal( $( resultsClassSelector ).length, 0, "One instance, results removed" );
	
	$("#qunit-fixture").append("<input>");
	var $inputs = $("#qunit-fixture input");
	equal( $inputs.length, 2, "Two instances" );
	domEqual( $inputs, function() {
		$inputs.acompleter().acompleter( "destroy" );
	}, "Two instances, clear element" );
	equal( $( resultsClassSelector ).length, 0, "Two instances, results removed" );
});

test( "Many plugins have individual results element", function() {
	this.$fixture.append( "<input>" ).append( "<input>" );
	strictEqual( $(resultsClassSelector).length, 0, "results element is absent (check by class)" );
	
	this.$fixture.find("input").acompleter();
	
	strictEqual( $(resultsClassSelector).length, 3, "results element is only one" );
});


test( "Plugin is chained propertly", function() {
	this.$fixture.append( "<input>" );
	var $elements = this.$fixture.find("input" );
	deepEqual( $elements.acompleter(), $elements, "plugin is chained" );
});

test( "Options are loaded propertly", function() {
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

test( "Plugin throws errors", function() {
	throws(
		function() {
			this.$el.acompleter("_unknown_method_")
		},
		/Method _unknown_method_ does not exist on jQuery.acompleter/,
		"raised error then unknown method called"
	);

    this.$fixture.append("<div></div>");
	throws(
		function() {
			this.$fixture.find("div").acompleter()
		},
		/Invalid parameter for jquery.acompleter, jQuery object with one element with INPUT tag expected/,
		"raised error then non-inptus"
	);
});

test( "Plugin change autocomplete attribute and restore it after destroy", function() {
    this.$el.attr( "autocomplete", "on" );
    this.$el.acompleter();
    equal( this.$el.attr("autocomplete"), "off", "autocomplete attribute is turned off" );
    this.$el.acompleter("destroy");
    equal( this.$el.attr("autocomplete"), "on", "autocomplete attribute is restored" );
});
