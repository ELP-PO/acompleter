$(document).ready(function() {
	

	
$('#region').acompleter({
    getValue: function(result) { return result.name; },
    getComparableValue: function(result) { return result.name; }
}).focus();


$('#local').acompleter({
	data: [ "c++", "Java", "Php", "Coldfusion", "Javascript", "Asp", "Ruby", "Python", "C", "Scala", "Groovy", "Haskell", "Perl" ]
});


	
})
