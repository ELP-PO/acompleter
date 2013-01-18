$(document).ready(function() {
	
	var processKladrData = function( loadedData ) {
        return $.map( loadedData, function( result ) {
            return {
                value: result.name,
                data: (function() { delete result.name; return result; })()
            };
        });
	};
	var showKladrResult = function( value, result ) {
		return value + " " + result.data.socr;
	};
	
	
	
	$( "#district, #city, #locality, #street" ).attr( "disabled", "disabled" ).addClass("disabled");

	$( "#state" ).acompleter({
		url: "/kladr/list.json",
		processData: processKladrData,
		showResult: showKladrResult,
		onItemSelect: function( result, plugin ) {
			var code = result.data.code.substr(0, 2);
			$("#district").data("plugin_acompleter").options.url = "/kladr/list.json?code=" + code;
			$("#district").removeAttr("disabled").removeClass("disabled").focus();
		}
	}).focus();

	$( "#district" ).acompleter({
		processData: processKladrData,
		showResult: showKladrResult
	});
	
});