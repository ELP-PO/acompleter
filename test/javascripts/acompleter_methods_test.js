module( "Methods", {
    setup: function() {
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter();
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
    },
    teardown: function() {
		this.$fixture.find("input").acompleter("destroy");
    }
});


asyncTest( "Highlight query inside query", function() {
    var plugin = this.plugin;
	plugin.options.data = localData;

	Syn.click( {}, this.$el ).type( "asc" );

    this.waitDelay(function() {
        start();
        equal( plugin.getCurrentItem().html(), "Jav<span>asc</span>ript", "query highlighted" );
    });
});
