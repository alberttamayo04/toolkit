/**
 * Toolkit JavaScript
 */

'use strict';

// apply bootstrap datepicker
// ----
$('.datepicker').datepicker({
	autoclose: true,
	container: '.date',
	orientation: 'bottom left'
});

$('.main-question input[type="checkbox"]').on('change', function(e){
	console.log(e);
	if($(this).is(':checked')) {
		$('.child-questions').show();
	} else {
		$('.child-questions').hide();
	}
});
