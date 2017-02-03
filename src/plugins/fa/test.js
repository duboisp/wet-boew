/*
 * Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
 * @title Font Awesome loader Unit Tests
 * @overview Test the font awesome plugin behaviour
 * @license wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html
 */
/* global jQuery, describe, it, expect, before, after */
/* jshint unused:vars */
( function( $, wb ) {

/*
 * Create a suite of related test cases using `describe`. Test suites can also be
 * nested in other test suites if you want to use the same setup `before()` and
 * teardown `after()` for more than one test suite (as is the case below.)
*/

describe( "Font Awesome Loader test suite", function() {

  /*
   * Test the initialization and default behaviour of the plugin
   */
	var $elm,
		$document = wb.doc,
		$body = $document.find( "body" ),
		$icon;

	before( function( done ) {

		this.timeout( 20000 );

		$document.on( "wb-ready.wb-faloader", ".fa", function() {
			done();
		} );

		// Trigger plugin init
		$elm = $( "<p> Free Code Camp icon</p>" )
			.appendTo( $body );

		$icon = $( "<span class='fa fa-free-code-camp fa-3x'></span>" )
			.prependTo( $elm )
			.trigger( "wb-init.fa" );
	} );

	after( function() {
		$elm.remove();
	} );

	/*
	* Test the initialization events of the plugin
	*/
	describe( "init event", function() {
		it( "should have added the wb-faloader-inited CSS class", function() {
			expect( $elm.hasClass( "wb-faloader-inited" ) ).to.equal( true );
		} );
	} );

} );

}( jQuery, wb ) );
