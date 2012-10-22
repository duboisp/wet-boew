/*!
* Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
* wet-boew.github.com/wet-boew/License-eng.txt / wet-boew.github.com/wet-boew/Licence-fra.txt
*/
/*
* Responsive Design for Table. An smart size adaptation for HTML Table on small screen and mobile device.
*/
(function ($) {
	"use strict";
	var _pe = window.pe || {
		fn: {}
	};
	/* local reference */
	_pe.fn.rdtable = {
		type: 'plugin',
		depends: ['parserTable'],
		_exec: function (elem) {
			var tblparser;
			if (!elem.is('table')) {
				return;
			}

			// Check if the table size overflow on the viewport (per his width)
			
			// Parse the table
			if (!$(elem).data().tblparser) {
				_pe.fn.parsertable.parse($(elem));
			}
			tblparser = $(elem).data().tblparser; // Create an alias

			// Is the table have summaries column ?

			// Is the table have multi column data level ?

			// Implement the mechanism to expand/collapse the cells, default = expanded state

			// Calculate the reducing size by collapsing the highest column data level

			// Auto-collapse the cells to get the best fit

			// Attach an event listener to the pe.resize event

			// Do the same for the rowgroup

			// Find the reasonable number of row before to collapse large table. Keep it as is for 16 rows and less ?			

		} // end of exec
	};
	window.pe = _pe;
	return _pe;
}(jQuery));
