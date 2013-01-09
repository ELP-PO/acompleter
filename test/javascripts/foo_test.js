test('Foo is always says the truth', function() {
	foo = { truth: true };
	equal( foo.truth, true, 'foo.truth is not true' );
});

test('jQuery is defined', function() {
	ok( window['jQuery'] !== undefined, 'global variable jquery is undefined' );
});

test('jQuery.Acompleter is defined', function() {
	ok( window.jQuery.Acompleter !== undefined, 'global variable jquery is undefined' );
});

test('acompleter plugin is created', function() {
	var $fixture = $( "#qunit-fixture" );

	$fixture.append( "<input type='text'>" );
	$( "input", $fixture ).acompleter();
	
	ok( $( "input", $fixture ).data("plugin_acompleter") instanceof $.Acompleter, "plugin initialized successfully!" );
});