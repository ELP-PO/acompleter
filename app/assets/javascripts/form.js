$(document).ready(function() {
	
	var processKladrData = function( loadedData ) {
        return $.map( loadedData, function( result ) {
            return {
                value: result.name,
                data: (function() { delete result.name; return result; })()
            };
        });
	};
	
	$( "#district, #city, #locality, #street" ).attr( "disabled", "disabled" ).addClass("disabled");

	$( "#state" ).acompleter({
		url: "/kladr/list.json",
		processData: processKladrData,
		showResult: function( value, result ) {
			return value + " " + result.data.socr;
		}
	});

	$( "#distinct" ).acompleter({
		url: ""
	})
	
});