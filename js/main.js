$(document).ready(function() {
	

	
$('#demo1 input').acompleter({
	url: "data.json"
});

$('#demo2 input').acompleter({
	url: "primates.json",
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
    sortFunction: function(a, b) {
        var parse = function(x) { return parseInt(x.data.replace(/\s/g, ""), 10); };
        return parse(b) - parse(a);
    }
});
	
});
