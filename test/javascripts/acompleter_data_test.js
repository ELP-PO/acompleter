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
            useCache: false,
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

asyncTest( "Remote data stored in cache and reused from cache", function() {
    var self = this,
        plugin = self.plugin;
    plugin.options.useCache = true;
    plugin.activate();
    self.waitDelay(function() {
        deepEqual( plugin._cache, plugin.results, "all results stored in the cache" );
        plugin.deactivate(true);
        sinon.spy( $, "ajax" );
        Syn.click( {}, plugin.$el ).type("Ады");
        self.waitDelay(function() {
            start();
            equal( $.ajax.callCount, 0, "ajax has not called" );
            deepEqual( plugin.results, [{
                    "data": { "code": "0100000000000", "gninmb": "0100", "index": "385000", "ocatd": "79000000000", "socr": "Респ", "status": "0", "uno": "" },
                    "value": "Адыгея"
                }],
                "results loaded propertly"
            );
        });
    });
});




