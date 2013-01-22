$(document).ready(function() {
	
	if ( $("#form").length == 0 ) return;
	
	
	var processData = function( loadedData ) {
        return $.map( loadedData, function( result ) {
            return {
                value: result.name,
                data: (function() { delete result.name; return result; })()
            };
        });
	};
	var showResult = function( value, result ) {
		return value + " " + result.data.socr;
	};
	var displayValue = function( result ) {
		return result.value + " " + result.data.socr;
	};
	var initAcompleter = function( $el ) {
		$el.acompleter({
				processData: processData,
				showResult: showResult,
				displayValue: displayValue
			})
	};
	var updateAcompleter = function( $el, code ) {
		$el.data("plugin_acompleter").options.url = "/kladr/list.json?code=" + code;
		$el.data("plugin_acompleter").options.processData = function( loadedData ) {
			var dummyItem = {
				value: "<Не задан>",
				data: { code: code + "000", socr: "" }
			};
			return [ dummyItem ].concat( processData(loadedData) );
		};
		
		$el.removeAttr("disabled")
			.removeClass("disabled")
			.val("")
			.focus();
	};

	$("#state").acompleter({
		url: "/kladr/list.json",
		processData: processData,
		showResult: showResult,
		displayValue: displayValue,
		onItemSelect: function( result, plugin ) {
			var code = result.data.code.substr(0, 2);
			updateAcompleter( $("#district"), code );
		}
	}).focus();
	
	$("#district, #city, #locality, #street").attr( "disabled", "disabled" ).addClass("disabled").each(function() {
		initAcompleter( $(this) );
	})
	
	$("#district").data("plugin_acompleter").options.onItemSelect = function( result, plugin ) {
		var code = result.data.code.substr( 0, 5 );
		updateAcompleter( $("#city"), code );
	}
	
	$("#city").data("plugin_acompleter").options.onItemSelect = function( result, plugin ) {
		var code = result.data.code.substr( 0, 8 );
		updateAcompleter( $("#locality"), code );
	}

	$("#locality").data("plugin_acompleter").options.onItemSelect = function( result, plugin ) {
		var code = result.data.code.substr( 0, 11 );
		updateAcompleter( $("#street"), code );
	}



	
});