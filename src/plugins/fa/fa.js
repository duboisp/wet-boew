/**
 * @title Font Awesome loader
 * @overview Load font awesome library on demand
 * @license wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html
 * @author @duboisp
 */
( function( $, window, wb ) {
"use strict";

var componentName = "wb-faloader",
	selector = ".fa",
	initEvent = "wb-init" + selector,
	$document = wb.doc,
	defaults = {
		url: "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
	},

	/**
	 * @method init
	 * @param {jQuery Event} event Event that triggered the function call
	 */
	init = function( event ) {

		// Start initialization
		// returns DOM object = proceed with init
		// returns undefined = do not proceed with init (e.g., already initialized)
		var elm = wb.init( event, componentName, selector ),
			$elm,
			settings;

		if ( elm ) {

			$elm = $( elm );

			// Get the custom config if exist only use the first element
			settings = $.extend(
				true,
				{},
				defaults,
				window[ componentName ],
				wb.getData( $elm, componentName )
			);

			if ( !document.querySelector( "link[href='" + settings.url + "']" ) ) {

				// Load the required dependencies and prettify the code once finished
				Modernizr.load( {
					load: settings.url
				} );
			}

			// Identify that initialization has completed
			wb.ready( $elm, componentName );
		}
	};

// Bind the init event of the plugin
$document.one( "timerpoke.wb " + initEvent, selector, init );

// Add the timer poke to initialize the plugin
wb.add( selector );

} )( jQuery, window, wb );
