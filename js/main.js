$(document).ready(function() {
	

	
$('#demo1').acompleter({
	url: "primates.json",
	animation: true,
	processData: function( loadedData ) {
        return $.map( loadedData, function( result ) {
            return {
                value: result.name,
                data: (function() { delete result.name; return result; })()
            };
        });
    }
}).focus();

/*

$('#local').acompleter({
	_debug: true,
	data: [ "c++", "Java", "Php", "Coldfusion", "Javascript", "Asp", "Ruby", "Python", "C", "Scala", "Groovy", "Haskell", "Perl" ]
});

*/

	
})
