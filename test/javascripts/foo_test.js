module( "Setup", {
	setup: function() {
		this.$el = $( "#test-input" );
	}
});

test( "acompleter plugin is created", function() {
	strictEqual( this.$el.data("plugin_acompleter"), undefined );

	this.$el.acompleter();
	
	ok( this.$el.data("plugin_acompleter") instanceof $.Acompleter, "plugin initialized successfully!" );
});

test( "acompleter plugin is chained", function() {
	deepEqual( this.$el.acompleter(), this.$el, "plugin is chained" );
});

test( "acompleter plugin is chained when multiple inputs", function() {
	$( "#qunit-fixture" ).append( "<input>" );
	$elements = $( "#qunit-fixture input" );
	deepEqual( $elements.acompleter(), $elements, "plugin is chained multiple" );
});


module("Acompleter", {
	setup: function() {
		this.$el = $( "#test-input" ).acompleter();
	}
});

test( "Load local data", function() {
	this.$el.data('plugin_acompleter').options.data = [ "Acompleter", "Belsky", "Bububu", "Danver", "Dino", "Nino", "Zoo" ];
	// events stuff
	
});