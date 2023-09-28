/*
 * Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
 * @title findPotentialPII Unit Tests
 * @overview Test the findPotentialPII helper function behaviour
 * @license wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html
 * @author @polmih @duboisp
 */
( function( $, wb ) {

/*
 * Create a suite of related test cases using `describe`. Test suites can also be
 * nested in other test suites if you want to use the same setup `before()` and
 * teardown `after()` for more than one test suite (as is the case below.)
 */
describe( "findPotentialPII test suite", function() {
	var sandbox = sinon.createSandbox();

	before( function() {
	} );

	after( function() {
		sandbox.restore();
	} );

	/*
	 * Test PII patterns match
	 */
	describe( "PII patterns match", function() {

		before( function() {
		} );

		after( function() {
		} );

		it( "should match 8 or more digits", function() {
			expect( wb.findPotentialPII( "master:5428735149026050, phone:514-514-5144, SIN:123 123-123, driving license:P12345678912345, bank account: 003-1234567", true ) ).to.equal( "master:, phone:, SIN:, driving license:P, bank account: " );
		} );

		it( "should match canadian nr passport", function() {
			expect( wb.findPotentialPII( "passport Nr:AB123456, passport Nr:AB 123456, passport Nr:AB-123456", true ) ).to.equal( "passport Nr:, passport Nr:, passport Nr:" );
		} );

		it( "should match email pattern", function() {
			expect( wb.findPotentialPII( "email:1@example.com", true ) ).to.equal( "email:" );
		} );

		it( "should match email pattern", function() {
			expect( wb.findPotentialPII( "email:1%40example.com", true ) ).to.equal( "email:" );
		} );
		it( "should match email pattern", function() {
			expect( wb.findPotentialPII( "email:1%2540example.com", true ) ).to.equal( "email:" );
		} );

		it( "should match postal code pattern", function() {
			expect( wb.findPotentialPII( "postal code:K2C3N2, postal code:K2C 3N2, postal code:K2C-3N2", true ) ).to.equal( "postal code:, postal code:, postal code:" );
		} );

		it( "should match username = value", function() {
			expect( wb.findPotentialPII( "username:John, username=John, user:John, user=John", true ) ).to.equal( "   " );
		} );

		it( "should match password = value", function() {
			expect( wb.findPotentialPII( "password:P123456, password=P123456, pass:P123456, pass=P123456", true ) ).to.equal( "   " );
		} );

		it( "should return true", function() {
			expect( wb.findPotentialPII( "phone:514-514-5144, email:1@example.com" ) ).to.equal( true );
		} );

		it( "should return false", function() {
			expect( wb.findPotentialPII( "date:2022-02-02, case number:1234" ) ).to.equal( false );
		} );

		it( "should match the all the default patterns and the custom case passed as parameter", function() {
			expect( wb.findPotentialPII( "email:1@example.com, phone:514-514-5144, postal code:K2C-3N2, my-custom-rule: case number:123456", { myCustomRule: /\b(?:case[\s-]?number[\s\-\\.:]?(?:\d{5,10}))/ig }, { useFullBlock: 1 } ) ).to.equal( "email:█████████████, phone:████████████, postal code:███████, my-custom-rule: ██████████████████" );
		} );

		it( "should match only the custom case passed as parameter", function() {
			expect( wb.findPotentialPII( "email:1@example.com, phone:514-514-5144, postal code:K2C-3N2, my-custom-rule: case number:123456", { myCustomRule: /\b(?:case[\s-]?number[\s\-\\.:]?(?:\d{5,10}))/ig }, { isCustomExclusive: 1, useFullBlock: 1 } ) ).to.equal( "email:1@example.com, phone:514-514-5144, postal code:K2C-3N2, my-custom-rule: ██████████████████" );
		} );

		it( "should replace removed content with this string: [REDACTED/CAVIARDÉ]", function() {
			expect( wb.findPotentialPII( "email:1@example.com, phone:514-514-5144, postal code:K2C-3N2", true, { replaceWith: "[REDACTED/CAVIARDÉ]" } ) ).to.equal( "email:[REDACTED/CAVIARDÉ], phone:[REDACTED/CAVIARDÉ], postal code:[REDACTED/CAVIARDÉ]" );
		} );

		it( "should replace the scrubbed characters with the █ symbol", function() {
			expect( wb.findPotentialPII( "email:1@example.com, phone:514-514-5144, postal code:K2C-3N2", true, { useFullBlock: 1 } ) ).to.equal( "email:█████████████, phone:████████████, postal code:███████" );
		} );

		it( "should find and replace content matching a specific pattern e.g 'email' and 'postalCode' that is present in the list of the default patterns", function() {
			expect( wb.findPotentialPII( "email:1@example.com, phone:514-514-5144, postal code:K2C-3N2, case number:123456", { email: 1, postalCode: 1 }, { useFullBlock: 1 } ) ).to.equal( "email:█████████████, phone:514-514-5144, postal code:███████, case number:123456" );
		} );


	} );

} );

describe( "wb-config test suite", function() {
	var sandbox = sinon.createSandbox(),
		$document = wb.doc,

		// Utilities function to compare JSON document
		_equalsJSON = function( a, b ) {
			switch ( typeof a ) {
			case "undefined":
				return false;
			case "boolean":
			case "string":
			case "number":
				return Number.isNaN( a ) && Number.isNaN( b ) || a === b;
			case "object":
				if ( a === null ) {
					return b === null;
				}
				var i, l;
				if ( $.isArray( a ) ) {
					if (  !$.isArray( b ) || a.length !== b.length ) {
						return false;
					}
					for ( i = 0, l = a.length; i < l; i++ ) {
						if ( !_equalsJSON( a[ i ], b[ i ] ) ) {
							return false;
						}
					}
					return true;
				}
				var bKeys = _objectKeys( b ),
					bLength = bKeys.length;
				if ( _objectKeys( a ).length !== bLength ) {
					return false;
				}
				for ( i in a ) {
					if ( !_equalsJSON( a[ i ], b[ i ] ) ) {
						return false;
					}
				}
				return true;
			default:
				return false;
			}
		},
		_objectKeys = function( obj ) {
			var keys;
			if ( $.isArray( obj ) ) {
				keys = new Array( obj.length );
				for ( var k = 0; k < keys.length; k++ ) {
					keys[ k ] = "" + k;
				}
				return keys;
			}
			if ( Object.keys ) {
				return Object.keys( obj );
			}
			keys = [];
			for ( var i in obj ) {
				if ( Object.prototype.hasOwnProperty.call( obj, i ) ) {
					keys.push( i );
				}
			}
			return keys;
		};

	before( function() {
	} );

	after( function() {
		sandbox.restore();
	} );

	/*
	 * Test <wb-config> behaviour
	 */
	describe( "Single config with one config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" streamline number=123 num=abc data-alibaba=\"foo bar\" value=\"yep\"></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "wb-config should equal as expected - Simple one config", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ],  expectNb: [ "number", "num" ] } ),
				{
					streamline: true,
					number: 123,
					num: Number.NaN,
					value: "yep"
				} ) ).to.be( true );
		} );

	} );

	describe( "Single config with JSON value", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" wb-value='{ \"streamline\": \"yep\", \"true\": true }'></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "wb-config should equal as expected - JSON value", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ],  expectNb: [ "number", "num" ] } ),
				{
					streamline: "yep",
					true: true
				} ) ).to.be( true );
		} );

	} );

	describe( "Single config with Bad JSON value", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" wb-value='{ \"streamline\": \"yep\", \"true true }'></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "wb-config should fail as expected - Bad JSON value", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ],  expectNb: [ "number", "num" ] } ),
				{
					streamline: "yep",
					true: true
				} ) ).to.be( false );
		} );

	} );

	describe( "Single config with Bad JSON value but valid scoped element config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test' data-testme='{ \"hello\": \"world\" }'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-testme\" wb-value='{ \"streamline\": \"yep\", \"true true }'></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "wb-config should fail as expected - Bad JSON value but valid JSON in scoped elm", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "testme", { expectBool: [ "streamline" ],  expectNb: [ "number", "num" ] } ),
				{
					hello: "world"
				} ) ).to.be( true );
		} );

	} );

	describe( "Single config - Data attribute config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" data-alibaba=\"foo bar\"></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - Data attribute config", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ],  expectNb: [ "number", "num" ] } ),
				{
					"data-alibaba": "foo bar"
				} ) ).to.be( false );
		} );

	} );

	describe( "config boolean value test", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"test\" bool-true bool-false=\"false\" bool-string-true=\"true\" bool-0=0></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "wb-config should equal as expected - Boolean value test", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "test", { expectBool: [ "bool-true", "bool-false", "bool-string-true", "bool-0" ] } ),
				{
					"bool-true": true,
					"bool-false": false,
					"bool-string-true": true,
					"bool-0": false
				} ) ).to.be( true );
		} );

	} );

	describe( "config decimal number value test", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"test\"><wb-config wb-prop=\"hello\">123.4567</wb-config></wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "wb-config should equal as expected - Boolean value test", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "test", { expectNb: [ "hello" ] } ),
				{
					"hello": 123.4567
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop containing array and inner config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" streamline>" +
					"<wb-config wb-prop=\"mapping\">" +
						"<wb-config selector=\"dt\" value=\"/name\"></wb-config>" +
						"<wb-config selector=\"dd\" value=\"/prop\"></wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - array value", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ] } ),
				{
					streamline: true,
					mapping: [
						{ selector: "dt", value: "/name" },
						{ selector: "dd", value: "/prop" }
					]
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop containing array and inner config + get value as text content", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" streamline>" +
					"<wb-config wb-prop=\"mapping\">" +
						"<wb-config selector=\"dt\" value=\"/name\"></wb-config>" +
						"<wb-config selector=\"dd\">" +
							"<wb-config wb-prop=\"value\" wb-text>/prop</wb-config> <!-- Value set as text content -->" +
						"</wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - array value + get value as text content", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ] } ),
				{
					streamline: true,
					mapping: [
						{ selector: "dt", value: "/name" },
						{ selector: "dd", value: "/prop" }
					]
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop containing array and inner config + get value as text content + tolerant to html comment", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" streamline>" +
					"<wb-config wb-prop=\"mapping\">" +
						"<wb-config selector=\"dt\" value=\"/name\"></wb-config>" +
						"<wb-config selector=\"dd\">" +
							"<wb-config wb-prop=\"value\" wb-text><!-- Value set as text content -->/prop</wb-config>" +
						"</wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - array value + get value as text content + tolerant to html comment", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ] } ),
				{
					streamline: true,
					mapping: [
						{ selector: "dt", value: "/name" },
						{ selector: "dd", value: "/prop" }
					]
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop containing array with unnamed inner config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" streamline>" +
					"<wb-config wb-config=\"mapping\">" +
						"<wb-config selector=\"dt\" value=\"/name\"></wb-config>" +
						"<wb-config selector=\"dd\">" +
							"<wb-config wb-prop=\"value\" wb-text><!-- Value set as text content -->/prop</wb-config>" +
						"</wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - containing array with unnamed inner config", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ] } ),
				{
					streamline: true
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop containing null", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"data-json\" streamline>" +
					"<wb-config wb-prop=\"mapping\" wb-value=\"null\"></wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - null value", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "data-json", { expectBool: [ "streamline" ] } ),
				{
					streamline: true,
					mapping: null
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop merging object data config + wb-config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test' data-test-plugin='{ \"streamline\": false, \"hello\": \"world\" }'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"test-plugin\" streamline>" +
					"<wb-config wb-prop=\"mapping\">" +
						"<wb-config selector=\"dt\" value=\"/name\"></wb-config>" +
						"<wb-config selector=\"dd\">" +
							"<wb-config wb-prop=\"value\" wb-text>/prop</wb-config> <!-- Value set as text content -->" +
						"</wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - merging object data config + wb-config", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "test-plugin", { expectBool: [ "streamline" ] } ),
				{
					streamline: true,
					mapping: [
						{ selector: "dt", value: "/name" },
						{ selector: "dd", value: "/prop" }
					],
					hello: "world"
				} ) ).to.be( true );
		} );

	} );

	describe( "Config with prop merging array data config + wb-config", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test' data-wb-json='[ { \"hello\": \"world\" } ]'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<wb-config wb-plugin=\"wb-json\">" +
					"<wb-config url=\"demo/data-en.json#/product\" type=\"replace\"></wb-config>" +
					"<wb-config url=\"demo/data-en.json#/status\">" +
						"<wb-config wb-prop=\"type\">addclass</wb-config>" +
						"<wb-config wb-prop=\"number\">123.456</wb-config>" +
						"<wb-config wb-prop=\"tpnumber\" wb-type=\"number\">123.456</wb-config>" +
						"<wb-config wb-prop=\"tpbool\" wb-type=\"bool\">true</wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "should wb-config equal as expected - merging array data config + wb-config", function() {
			expect( _equalsJSON(
				wb.getData( $elm, "wb-json", { expectNb: [ "number" ] } ),
				[
					{
						hello: "world"
					},
					{
						url: "demo/data-en.json#/product",
						type: "replace"
					},
					{
						url: "demo/data-en.json#/status",
						type: "addclass",
						number: 123.456,
						tpnumber: 123.456,
						tpbool: true
					}
				] ) ).to.be( true );
		} );

	} );

	describe( "Config defined outside the elm scope", function() {
		var $elm;

		before( function() {
			$elm = $( "<div id='test'></div>" ).appendTo( $document.find( "body" ) );

			$elm.append(
				"<p data-wb-json data-wb-json-config=\"config-data-json\">This is a paragraph.</p>" +
				"<wb-config id=\"config-data-json\" wb-plugin=\"wb-json\">" +
					"<wb-config url=\"demo/data-en.json#/product\" type=\"replace\"></wb-config>" +
					"<wb-config url=\"demo/data-en.json#/status\">" +
						"<wb-config wb-prop=\"type\">addclass</wb-config>" +
					"</wb-config>" +
				"</wb-config>" );
		} );

		after( function() {
			$elm.remove();
		} );

		it( "Config defined outside the elm scope", function() {
			expect( _equalsJSON(
				wb.getData( $elm.find( "p" ), "wb-json" ),
				[
					{
						url: "demo/data-en.json#/product",
						type: "replace"
					},
					{
						url: "demo/data-en.json#/status",
						type: "addclass"
					}
				] ) ).to.be( true );
		} );

	} );

// Remote setting test.



	// Trim spaces
	// Add option to keep pre-formated


} );

}( jQuery, wb ) );
