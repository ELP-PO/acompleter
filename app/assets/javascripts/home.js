console.log('home loaded');
$(document).ready(function() {
	
	
$('#region').acompleter({
    getValue: function(result) { return result.name; },
    getComparableValue: function(result) { return result.name; }
}).focus();

	
})
