module( "Local data", {
	setup: function() {
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
		this.$fixture.find("input").acompleter("destroy");
	}
});


asyncTest( "Local data is loaded", function() {
	var plugin = this.plugin;
	expect( 1 );

	Syn.click( {}, this.$el ).type("A\b");

    this.waitDelay(function() {
		equal( plugin.results.length, plugin.options.data.length, "local data fully loaded" );
		start();
    });
});


asyncTest( "Local data is filtered propertly", function() {
	var plugin = this.plugin;
	expect( 2 );

	Syn.click( {}, this.$el ).type("Java");

	this.waitDelay(function() {
		equal( plugin.results.length, 2, "found two results" );
		equal( plugin.getItems().length, 2, "displayed two results" );
		start();
	});
});


module( "Remote data", {
	setup: function() {
		this.$fixture = $("#qunit-fixture");
		this.$el = this.$fixture.find("#test-input").acompleter({
            url: remoteUrl,
            processData: function( loadedData ) {
                return $.map( loadedData, function( result ) {
                    return {
                        value: result.name,
                        data: (function() { delete result.name; return result; })()
                    };
                });
            },
			minChars: 0
		});
		this.plugin = this.$el.data('plugin_acompleter');
		this.waitDelay = function( callback ) {
			setTimeout( callback, this.plugin.options.delay + 100 );
		};
	},
	teardown: function() {
		this.$fixture.find("input").acompleter("destroy");
	}
});

asyncTest( "Remote data loaded and ready to parse", function() {
    var self = this;
    var nativeProcessData = self.plugin.options.processData;
    self.plugin.options.processData = function( loadedData ) {
        start();
        equal( loadedData.length, remoteData.length, "remote data fetched" );
        return nativeProcessData.call( self, loadedData );
    };
    expect( 1 );
    self.plugin.activate();
});
