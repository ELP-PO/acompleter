$(document).ready(function() {
	

	
$('#region').acompleter({
	url: "/assets/remoteData.json",
	processData: function( loadedData ) {
        return $.map( loadedData, function( result ) {
            return {
                value: result.name,
                data: (function() { delete result.name; return result; })()
            };
        });
    }
}).focus();


$('#local').acompleter({
	_debug: true,
	data: [ "c++", "Java", "Php", "Coldfusion", "Javascript", "Asp", "Ruby", "Python", "C", "Scala", "Groovy", "Haskell", "Perl" ]
});


	
})
