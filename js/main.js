$(document).ready(function() {
	

	
$('#demo1 input').acompleter({
	url: "data.json"
});

$('#demo2 input').acompleter({
	url: "primates.json",
	animation: true,
	processData: function( loadedData ) {
        return $.map( loadedData, function( result ) {
            return {
                value: result.name,
                data: result.population
            };
        });
    },
    buildListItem: function(value, result) {
        return value + '<span class="qty">' + result.data + "</span>";
    }

});

$('#demo3 input').acompleter({
	url: "data.json",
    buildListItem: function(value, result) {
        return value + '<span class="qty">' + result.data + "</span>";
    },
    sortResults: true,
    sortFunction: function(a, b, filter, opts) {
        var parse = function(x) { return parseInt(x.data.replace(/\s/g, ""), 10); };
        return parse(b) - parse(a);
    }
});




/*

$('#local').acompleter({
	_debug: true,
	data: [ "c++", "Java", "Php", "Coldfusion", "Javascript", "Asp", "Ruby", "Python", "C", "Scala", "Groovy", "Haskell", "Perl" ]
});

*/

	
});
