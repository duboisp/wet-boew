/**
 * @title WET-BOEW Data Json [data-json-after], [data-json-append],
 * [data-json-before], [data-json-prepend], [data-json-replace], [data-json-replacewith] and [data-wb-json]
 * @overview Insert content extracted from JSON file.
 * @license wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html
 * @author @duboisp
 */
/*global jsonpointer */
( function( $, window, wb ) {
"use strict";

/*
 * Variable and function definitions.
 * These are global to the plugin - meaning that they will be initialized once per page,
 * not once per instance of plugin on the page. So, this is a good place to define
 * variables that are common to all instances of the plugin on a page.
 */
var componentName = "wb-data-json",
	shortName = "wb-json",
	selectors = [
		"[data-json-after]",
		"[data-json-append]",
		"[data-json-before]",
		"[data-json-prepend]",
		"[data-json-replace]",
		"[data-json-replacewith]",
		"[data-" + shortName + "]"
	],
	allowJsonTypes = [ "after", "append", "before", "prepend", "val" ],
	allowAttrNames = /(href|src|data-*|aria-*|role|pattern|min|max|step|low|high|lang|hreflang|action)/,
	allowPropNames = /(checked|selected|disabled|required|readonly|multiple|hidden)/,
	selectorsLength = selectors.length,
	selector = selectors.join( "," ),
	initEvent = "wb-init." + componentName,
	updateEvent = "wb-update." + componentName,
	contentUpdatedEvent = "wb-contentupdated",
	dataQueue = componentName + "-queue",
	$document = wb.doc,
	s,

	/**
	 * @method init
	 * @param {jQuery Event} event Event that triggered this handler
	 * @param {string} ajaxType The type of JSON operation, either after, append, before or replace
	 */
	init = function( event ) {

		// Start initialization
		// returns DOM object = proceed with init
		// returns undefined = do not proceed with init (e.g., already initialized)
		var elm = wb.init( event, componentName, selector ),
			$elm;

		if ( elm ) {

			var jsonCoreTypes = [
					"before",
					"replace",
					"replacewith",
					"after",
					"append",
					"prepend"
				],
				jsonType, jsondata,
				i, i_len = jsonCoreTypes.length, i_cache,
				lstCall = [],
				url;

			$elm = $( elm );

			for ( i = 0; i !== i_len; i += 1 ) {
				jsonType = jsonCoreTypes[ i ];
				url = elm.getAttribute( "data-json-" + jsonType );
				if ( url !== null ) {
					lstCall.push( {
						type: jsonType,
						url: url
					} );
				}
			}

			// Identify that initialization has completed
			wb.ready( $elm, componentName );

			jsondata = wb.getData( $elm, shortName );

			if ( jsondata && jsondata.url ) {
				lstCall.push( jsondata );
			} else if ( jsondata && $.isArray( jsondata ) ) {
				i_len = jsondata.length;
				for ( i = 0; i !== i_len; i += 1 ) {
					lstCall.push( jsondata[ i ] );
				}
			}

			// Save it to the dataJSON object.
			$elm.data( dataQueue, lstCall );

			i_len = lstCall.length;
			for ( i = 0; i !== i_len; i += 1 ) {
				i_cache = lstCall[ i ];
				loadJSON( elm, i_cache.url, i, i_cache.nocache, i_cache.nocachekey, i_cache.data, i_cache.contenttype, i_cache.method );
			}

		}
	},

	loadJSON = function( elm, url, refId, nocache, nocachekey, data, contentType, method ) {
		var $elm = $( elm ),
			fetchObj = {
				url: url,
				refId: refId,
				nocache: nocache,
				nocachekey: nocachekey,
				data: data,
				contentType: contentType,
				method: method
			};

		$elm.trigger( {
			type: "json-fetch.wb",
			fetch: fetchObj
		} );
	},


	// Manage JSON value After the json data has been fetched. This function can deal with array.
	jsonFetched = function( event ) {

		var elm = event.target,
			$elm = $( elm ),
			lstCall = $elm.data( dataQueue ),
			fetchObj = event.fetch,
			itmSettings = lstCall[ fetchObj.refId ],
			jsonType = itmSettings.type,
			attrname = itmSettings.prop || itmSettings.attr,
			showEmpty = itmSettings.showempty,
			content = fetchObj.response,
			typeOfContent = typeof content,
			jQueryCaching;

		if ( showEmpty || typeOfContent !== "undefined" ) {

			if ( showEmpty && typeOfContent === "undefined" ) {
				content = "";
			}

			//Prevents the force caching of nested resources
			jQueryCaching = jQuery.ajaxSettings.cache;
			jQuery.ajaxSettings.cache = true;

			// "replace" and "replaceWith" doesn't map to a jQuery function
			if ( !jsonType ) {
				jsonType = "template";
				applyTemplate( elm, itmSettings, content );

				// Trigger wet
				if ( itmSettings.trigger ) {
					$elm
						.find( wb.allSelectors )
						.addClass( "wb-init" )
						.filter( ":not(#" + elm.id + " .wb-init .wb-init)" )
						.trigger( "timerpoke.wb" );
				}
			} else if ( jsonType === "replace" ) {
				$elm.html( content );
			} else if ( jsonType === "replacewith" ) {
				$elm.replaceWith( content );
			} else if ( jsonType === "addclass" ) {
				$elm.addClass( content );
			} else if ( jsonType === "removeclass" ) {
				$elm.removeClass( content );
			} else if ( jsonType === "prop" && attrname && allowPropNames.test( attrname ) ) {
				$elm.prop( attrname, content );
			} else if ( jsonType === "attr" && attrname && allowAttrNames.test( attrname ) ) {
				$elm.attr( attrname, content );
			} else if ( typeof $elm[ jsonType ] === "function" && allowJsonTypes.indexOf( jsonType ) !== -1 ) {
				$elm[ jsonType ]( content );
			} else {
				throw componentName + " do not support type: " + jsonType;
			}

			//Resets the initial jQuery caching setting
			jQuery.ajaxSettings.cache = jQueryCaching;

			$elm.trigger( contentUpdatedEvent, { "json-type": jsonType, "content": content } );
		}
	},

	// Apply the template as per the configuration
	applyTemplate = function( elm, settings, content ) {

		var mapping = settings.mapping || [ {} ],
			mapping_len,
			filterTrueness = settings.filter || [],
			filterFaslseness = settings.filternot || [],
			queryAll = settings.queryall,
			i, i_len, i_cache,
			j, j_cache, j_cache_attr,
			basePntr,
			clone, selElements,
			cached_node,
			cached_textContent,
			cached_value,
			selectorToClone = settings.tobeclone,
			elmClass = elm.className,
			elmAppendTo = elm,
			dataTable,
			dataTableAddRow,
			template = settings.source ? document.querySelector( settings.source ) : elm.querySelector( "template" );

		// If combined with wb-tables plugin
		if ( elm.tagName === "TABLE" && elmClass.indexOf( "wb-tables" ) !== -1 ) {

			//  Wait for its initialization before to applyTemplate
			if ( elmClass.indexOf( "wb-tables-inited" ) === -1 ) {
				$( elm ).one( "wb-ready.wb-tables,init.dt", function( ) {
					applyTemplate( elm, settings, content );
				} );
				return;
			}

			// Edge case, when both plugin are ready at the same time, just wait for the next tick
			if ( !$.fn.dataTable.isDataTable( elm ) && elmClass.indexOf( componentName + "-dtwait" ) === -1 ) {
				elm.classList.add( componentName + "-dtwait" );
				setTimeout( function( ) {
					applyTemplate( elm, settings, content );
				}, 50 );
				return;
			}

			dataTable = $( elm ).dataTable( { "retrieve": true } ).api();
			dataTableAddRow = dataTable.row.add;
			selectorToClone = "tr"; // Only table row can be added
		}

		if ( !$.isArray( content ) ) {
			if ( typeof content !== "object" ) {
				content = [ content ];
			} else {
				content = $.map( content, function( val, index ) {
					if ( typeof val === "object" && !$.isArray( val ) ) {
						if ( !val[ "@id" ] ) {
							val[ "@id" ] = index;
						}
					} else {
						val = {
							"@id": index,
							"@value": val
						};
					}
					return [ val ];
				} );
			}
		}
		i_len = content.length;

		if ( !$.isArray( mapping ) ) {
			mapping = [ mapping ];
		}
		mapping_len = mapping.length;

		if ( !template ) {
			return;
		}

		// Needed when executing sub-template that wasn't polyfill, like in IE11
		if ( !template.content ) {
			wb.tmplPolyfill( template );
		}

		if ( settings.appendto ) {
			elmAppendTo = $( settings.appendto ).get( 0 );
		}

		/*
		for ( i = 0; i < i_len; i += 1 ) {
			i_cache = content[ i ];

			if ( filterPassJSON( i_cache, filterTrueness, filterFaslseness ) ) {

				basePntr = "/" + i;

				clone = processMapping( elm, i_cache, settings );

				if ( dataTableAddRow ) {

					// If wb-tables, use its API to add rows
					dataTableAddRow( $( clone ) );
				} else {
					elmAppendTo.appendChild( clone );
				}
			}
		}*/
		dataIterator( elm, content, settings );

		// Refresh the dataTable display
		if ( dataTableAddRow ) {
			dataTable.draw();
		}
	},


	dataIterator = function( elm, content, mappingConfig, useClone ) {

		var i, i_len, i_cache,
			elmAppendTo = elm,
			clone,
			dataTable, dataTableAddRow,
			templateRef;

		if ( mappingConfig.appendto ) {
			elmAppendTo = $( mappingConfig.appendto ).get( 0 );
		}


		// Connection with data table plugin
		if ( elm.tagName === "TABLE" && elm.className.indexOf( "wb-tables" ) !== -1 ) {
			dataTable = $( elm ).dataTable( { "retrieve": true } ).api();
			dataTableAddRow = dataTable.row.add;
			mappingConfig.tobeclone = "tr";
		}


		// if content is object, transform into array @id and @value
		if ( !$.isArray( content ) ) {
			if ( typeof content !== "object" ) {
				content = [ content ];
			} else {
				content = $.map( content, function( val, index ) {
					if ( typeof val === "object" && !$.isArray( val ) ) {
						if ( !val[ "@id" ] ) {
							val[ "@id" ] = index;
						}
					} else {
						val = {
							"@id": index,
							"@value": val
						};
					}
					return [ val ];
				} );
			}
		}
		i_len = content.length;


		var cloneArray = [],
			j, j_len;

		// console.log( "Iterating" );
		// console.log( content );

		for ( i = 0; i < i_len; i += 1 ) {
			i_cache = content[ i ];

			//
			// Get the template (if applicable)
			//

			if ( !clone && useClone ) {

				// ( !clone && useClone ) => this is a Grouping template
				/*console.log( "Create template in dataIterator" );
				console.log( elm );
				console.log( content );
				console.log( mappingConfig );
				console.log( useClone );
				console.log( "__" ) ;
				*/

				clone = useClone;
				/*
				templateRef = useClone.querySelector( mappingConfig.template );

				if ( !mappingConfig.tobeclone ) {
					clone = templateRef.content.cloneNode( true );
				} else {
					clone = templateRef.content.querySelector( mappingConfig.tobeclone ).cloneNode( true );
				}

				console.log( templateRef );
				*/
			}

			if ( !useClone ) {
				clone = getTemplateClone( elm, mappingConfig, templateRef );
			}


/*
			if ( !clone || clone.nodeType === 11 ) {
				console.log( "Empty clone...");
				console.log( useClone );
				console.log( clone );
				console.log( elm );
				console.log( mappingConfig );
			}*/

			// Not needed anymore, it is check before to initiate the mapping
			// processConditional( elm, clone, i_cache, mappingConfig );



			// process the conditional
			/*if ( !mappingConfig.source ) {
				console.log( "Condition 1");
				cloneArray = processConditional( elm, clone, i_cache, mappingConfig );
			} else if ( mappingConfig.source && mappingConfig.tobeclone ) {
				console.log( "Condition 2");
				var node_toAppend = document.querySelector( mappingConfig.source ).content.querySelector( mappingConfig.tobeclone ).cloneNode( true );

				cloneArray = processConditional( node_toAppend, clone, i_cache, mappingConfig );

			} else if ( mappingConfig.source ) {
				console.log( "Condition 3");
				var node_toAppend = document.querySelector( mappingConfig.source ).cloneNode( true )

				cloneArray = processConditional( node_toAppend, clone, i_cache, mappingConfig );
			}

			if ( !cloneArray ) {
				cloneArray = [];
			}*/





			// process the mapping, return value is the new clone object if applicable
			var tmpClone;
			tmpClone = processMapping( elm, clone, i_cache, mappingConfig );

			// Remove the template flag, to ensure we do reuse it for the subsequent iteration
			if ( tmpClone ) {
				delete mappingConfig.template;
				clone = tmpClone;
			}

			// Add the clone object
			//for( j = 0, j_len = cloneArray.length; j !== j_len; j++ ) {
			//	clone = cloneArray[ j ];
				if ( dataTableAddRow ) {
					dataTableAddRow( $( clone ) ); // If wb-tables, use its API to add rows
				} else {
					if ( !useClone ) {
						elmAppendTo.appendChild( clone );
					}
				}
			//}
		}

		/*
		if ( useClone ) {

			console.log( "Save template in dataIterator" );

			console.log( useClone )
			console.log( clone )
			console.log( clone.parentNode )
			console.log( templateRef )

			if ( templateRef.parentNode ) {

				//template.parentNode.insertBefore( clone, template );
				templateRef.parentNode.insertBefore( clone, templateRef );
				//outerClone.appendChild( clone );
			} else {
				useClone.appendChild( clone );
			}
		}*/

		// Refresh the dataTable display (if applicable)
		if ( dataTableAddRow ) {
			dataTable.draw();
		}

	},
/*
	processConditional = function( elm, clone, content, mappingConfig, behavioural ) {

		var conditions = mappingConfig.conditions,
			i, i_cache,
			i_len,
			cloneArray = [];

		if ( !conditions ) {
			return;
		}

		if ( !behavioural ) {
			behavioural = {};
		}

		i_len = conditions.length;

		for ( i = 0; i < i_len || i === 0; i += 1 ) {
			i_cache = conditions[ i ];


			if ( i_cache[ "@type"] === "rdf:Alt" ) {

				processConditional( elm, clone, content, i_cache, { mode: "alt" } );
				continue;
			}

			// Get the value to be tested
			var value = getValue( content, i_cache.value );


			// Get the function to use
			var returnEval = functionForTest[ i_cache.test ].call( content, value, i_cache.expect );

			// TODO: Run the operand


			// If not true, go next
			if ( !returnEval ) {
				continue
			}

			console.log( "test" );
			console.log( i_cache );
			console.log( elm );
			console.log( content );
			console.log( value );
			console.log( returnEval );

			// Run conditions check
			processConditional( elm, clone, content, i_cache );


			// Run mapping if satisfied
			processMapping( elm, clone, value, i_cache );

			GlobalIsArrayTrue = false;

			if ( behavioural.mode === "alt" ) {
				return;
			}

		}

		return cloneArray;


	},*/

	typeMappingIterator = function() {

		// bag

		// for loop here and evaluate each of them, once success, trigger the process mapping.

	},

	canProcessMapping = function( content, mappingConfig ) {

		var conditions = mappingConfig.conditions,
			i, i_cache,
			i_len,
			cloneArray = [];

		if ( !mappingConfig.test ) {
			return;
		}


		// Get the value to be tested
		var value = getValue( content, mappingConfig.assess || mappingConfig.value );


		// Get the function to use
		var returnEval = functionForTest[ mappingConfig.test ].call( content, value, mappingConfig.expect );

		// TODO: Run the operand


		// If not true, go next
		if ( !returnEval ) {
			return false;
		}

		// Run mapping if satisfied
		return true;
	},

	functionForTypedMapping = {
		"rdf:Alt": function( elm, clone, content, mappingConfig ) {

			var mapping = mappingConfig.mapping,
				i, i_cache,
				i_len = mapping.length,
				canProcess,
				value = content;

			for ( i = 0; i < i_len || i === 0; i += 1 ) {
				i_cache = mapping[ i ];

				if ( canProcessMapping( content, i_cache ) ) {

					i_cache = $.extend( true, {}, i_cache ); // Clone the object

					// Remove the test, because it was checked
					delete i_cache.test;

					// Navigate the content if specified
					if ( i_cache.value ) {
						value = getValue( content, i_cache.value );
					}


					// Process the mapping
					processMapping( elm, clone, value, i_cache );

					// End
					return;
				}
			}
		}
	},

	functionForTest = {

		"fn:isArray": function( value ) {
			return $.isArray( value );
		},

		"fn:isLiteral": function( value ) {

			// Only if we are in JSON ld mode
			// Check if the value are set under the JSON-LD parameter @value
			if ( value && value[ "@value" ] ) {
				value = value[ "@value" ];
			}

			if ( value && typeof value !== "object" ) {
				return true;
			}

			return false;
		},

		"fn:isType": function( value, expect ) {

			value = value[ "/@type" ] || typeof value;

			if ( $.isArray( value ) && value.indexOf( expect ) !== -1 ) {
				return true;
			} else if ( value === expect ) {
				return true;
			}

			return false;
		},

		"fn:guestType": function( value, expect ) {

			var guestType;

			if ( !value ) {
				guestType = "undefined"
			} else if ( value[ "@type" ] ) {
				guestType = value[ "@type" ];
			} else if ( value[ "@value" ] ) {

				// Only if we are in JSON ld mode
				// Check if the value are set under the JSON-LD parameter @value
				value = value[ "@value" ];
			}

			if ( !guestType ) {
				if ( typeof value === "string" && value.match( /^([a-z][a-z0-9+\-.]*):/i ) ) {
					guestType = [ "xsd:anyURI", "rdfs:Literal" ];
				} else if ( typeof value === "string" ) {
					guestType = [ "xsd:string", "rdfs:Literal" ];
				} else if ( typeof value === "boolean" ) {
					guestType = [ "xsd:boolean", "rdfs:Literal" ];
				} else if ( typeof value === "number" ) {
					guestType = [ "xsd:double", "rdfs:Literal" ];
				} else if ( typeof value === "undefined" ) {
					guestType = "undefined";
				} else if ( typeof value === "null" ) {
					guestType = "null";
				} else if ( $.isArray( value ) ) {
					guestType = "rdfs:Container";
				} else {

					// Log an error and skip
					console.error( "Unable to guest the @type" );
					console.error( value );
					return false;
				}
			}

			if ( $.isArray( guestType ) && guestType.indexOf( expect ) !== -1 ) {
				return true;
			} else if ( guestType === expect ) {
				return true;
			}

			return false;
		}

	},

	functionForOperand = {
		"eq": function( value, expect ) {

		},
		"neq": function( value, expect ) {

		},
		"in": function( value, expect ) {

		},
		"inst": function( value, expect ) {

		}
	},

	processMapping = function( elm, clone, content, mappingConfig ){

		var j, j_cache,
			cached_node, cached_value,
			queryAll = mappingConfig.queryall,
			selElements,
			mapping = mappingConfig.mapping,
			mapping_len,
			upstreamClone, template;


		// Is this mapping a special mapping type?
		if ( mappingConfig[ "@type" ] ) {
			functionForTypedMapping[ mappingConfig[ "@type" ] ].call( content, elm, clone, content, mappingConfig );
			return;
		}

		// Can we proceed?
		if ( mappingConfig.test && !canProcessMapping( content, mappingConfig ) ) {
			return;
		}

		// Check if there is some mapping configuration
		if ( !mapping && !queryAll ) {
			return;
		}

		// Clone mappingConfig to ensure it don't interfere with subsequent data iteration
		mappingConfig = $.extend( true, {}, mappingConfig );

		// If there is a "template" property, get the inner template
		if ( mappingConfig.template ) { //&& !mappingConfig.ingnoreTemplate ) {
			template = clone.querySelector( mappingConfig.template );

			upstreamClone = clone; // Keep reference of the top clone

			//if ( !mappingConfig.tobeclone ) {
				clone = template.content.cloneNode( true );
			//} else {
			//	clone = template.content.querySelector( mappingConfig.tobeclone ).cloneNode( true );
			//}

			// Ensure we don't recreated it if during a subsequent iteration
			delete mappingConfig.template;
		}


		// Is content an array?
		if ( $.isArray( content ) ) {

			/*if( mappingConfig.template ) {
				mappingConfig.ingnoreTemplate = true;
			}*/

			//dataIterator( clone, content, mappingConfig, clone );
			dataIterator( clone, content, mappingConfig, clone );

			if ( template ) {
				if ( template.parentNode ) {


					//template.parentNode.insertBefore( clone, template );
					if ( !mappingConfig.append ) {
						template.parentNode.insertBefore( clone, template );
					} else {
						template.parentNode.appendChild( clone );
					}
					//upstreamClone.appendChild( clone );
				} else {
					upstreamClone.appendChild( clone );
				}

				return elm;

			}
			return;
		}

		if ( !mapping ) {
			mapping = [ {} ];
		}

		if ( !$.isArray( mapping ) ) {
			mapping = [ mapping ];
		}
		mapping_len = mapping.length;




		// console.log( "Content " );
		// console.log( content );
		//if ( $.isArray( content ) ) {

		/*
			// Deep dive into the content if a mapping exist
			if ( mappingConfig.mapping || mappingConfig.queryall ) {
				dataIterator( clone, content, mappingConfig );

				if ( outerClone && template ) {
					if ( template.parentNode ) {
						template.parentNode.insertBefore( clone, template );
					} else {
						outerClone.appendChild( clone );
					}
				}

				return;
			}
		*/
		//}



		/*if ( !selectorToClone ) {
			clone = template.content.cloneNode( true );
		} else {
			clone = template.content.querySelector( selectorToClone ).cloneNode( true );
		}*/


		// Ensure the mapping is an array of Mapping Object
		for ( j = 0; j < mapping_len || j === 0; j += 1 ) {
			if ( typeof mapping[ j ] === "string" ) {
				mapping[ j ] = {
					value: mapping[ j ]
				};
			}
		}

		if ( queryAll ) {
			selElements = clone.querySelectorAll( queryAll );

			// Replicate this setting the in the mapping
			for ( j = 0; j < selElements.length || j === 0; j += 1 ) {
				if ( ! mapping[ j ].selector && queryAll.indexOf( "nth-child" ) === -1 ) {
					mapping[ j ].selector = queryAll + ":nth-child(" + ( j + 1 ) + ")";
				} else if ( ! mapping[ j ].selector ) {
					mapping[ j ].selector = queryAll;
				}
			}
		}


		//
		// Process the mapping
		//

		if ( !$.isArray( content ) ){

		for ( j = 0; j < mapping_len || j === 0; j += 1 ) {
			j_cache = mapping[ j ];

			// Get the node used to insert content
			//if ( selElements ) {
			//	cached_node = selElements[ j ];
			//} else


			var innerTemplate, outerClone;

			// If there is a "template" property, get the inner template
			/*if ( j_cache.template && !j_cache.ingnoreTemplate ) {
				innerTemplate = clone.querySelector( j_cache.template );

				outerClone = clone; // Keep reference of the outer clone

				if ( !innerTemplate ) {
					console.log( "noInner template" );
					console.log( innerTemplate );
					console.log( clone );
					console.log( j_cache );
					console.log( clone.querySelector( "ul > [data-source-code]" ) );

					console.log( "template not found, check your template selector: " + j_cache.template );
					console.warn( j_cache );
					continue;
				}

				//if ( !mappingConfig.tobeclone ) {
					clone = innerTemplate.content.cloneNode( true );
				//} else {
				//	clone = template.content.querySelector( mappingConfig.tobeclone ).cloneNode( true );
				//}
			}*/


			if ( j_cache.selector ) {
				cached_node = clone.querySelector( j_cache.selector );
			} else {
				cached_node = clone;
			}



			cached_value = getValue( content, j_cache );



			/*if ( cached_value && cached_value[ "@id" ] && cached_value[ "@id" ] === "_:sc_1.4.3" ){
				// for debug
				console.log( cached_value );
			}*/
/*
			if ( template || !cached_node ) {
				console.log( "value" );
				console.log( template );
				console.log( cached_node );
				console.log( cached_value );
				console.log( j_cache );
				console.log( content );

			}*/


			// Go to the next mapping if the value of JSON node don't exist to ensure we keep the default text set in the template, but move ahead if empty or null
			if ( typeof cached_value === "undefined" ) {
				continue;
			}



			// Deep dive into the content if a mapping exist
			if ( $.isArray( cached_value ) && ( j_cache.mapping || j_cache.queryall ) ) {

				/*console.log( "calling dataIterator isArray" );
				console.log( cached_node );
				console.log( cached_value );
				console.log( j_cache );
				console.log( outerClone );
				console.log( innerTemplate );
				console.log( clone );
				*/

				dataIterator( cached_node, cached_value, j_cache );

			} else if ( j_cache.mapping || j_cache.queryall ) {

				/*console.log( "Deep diving, value is literal" );
				console.log( cached_node );
				console.log( cached_value );
				console.log( j_cache );
				console.log( outerClone );
				console.log( upstreamClone );
				console.log( innerTemplate );
				console.log( clone );
				*/

				//processMapping( upstreamClone, cached_node, cached_value, j_cache );
				processMapping( template, cached_node, cached_value, j_cache );
			} else {

				mapValue( cached_node, cached_value, j_cache );
			}

			/*
			if ( outerClone && innerTemplate ) {
				if ( innerTemplate.parentNode ) {

					console.log( "template AJOUTER Inner++" );

					//template.parentNode.insertBefore( clone, template );
					innerTemplate.parentNode.insertBefore( clone, innerTemplate );
					//outerClone.appendChild( clone );
				} else {
					outerClone.appendChild( clone );
				}

				clone = outerClone;
				console.error (clone );
			}*/

		}

		}

		//if ( upstreamClone && template ) {
		if ( template ) {
			if ( template.parentNode ) {

				//console.log( "template AJOUTER" );

				//template.parentNode.insertBefore( clone, template );
				if ( !mappingConfig.append ) {
					template.parentNode.insertBefore( clone, template );
				} else {
					template.parentNode.appendChild( clone );
				}
				//upstreamClone.appendChild( clone );
			} else {
				upstreamClone.appendChild( clone );
			}

			return elm;

		}




		// Return the newly created clone
		//return clone;
	},


	getTemplateClone = function( elm, mappingConfig, template ){

		var clone;

		if ( mappingConfig.source ) {
			template = document.querySelector( mappingConfig.source )
		} else if ( mappingConfig.template ){
			template = elm.querySelector( mappingConfig.template )
		} else {
			template = elm.querySelector( "template" );
		}


		if ( !mappingConfig.tobeclone ) {
			clone = template.content.cloneNode( true );
		} else {
			clone = template.content.querySelector( mappingConfig.tobeclone ).cloneNode( true );
		}

		return clone;
	},

	getValue = function ( source, pointer ) {

		var value;
		// var endWithAtValue = value.match( /\/@value$/ ); // See fn:guestType value extrator


		// Get the value if source is string or pointer is pointing to root
		if ( typeof source === "string" || pointer === "/" || pointer === "/@value" || pointer.value === "/" || pointer.value === "/@value" ) {
			value = source;
		} else if ( typeof pointer === "string" ) {
			value = jsonpointer.get( source, pointer );
		} else if ( pointer.value ) {
			value = jsonpointer.get( source, pointer.value );
		} else {
			value = source;
		}

		// for JSON-LD @value support
		if ( typeof value === "object" && value[ "@value" ] ) {
			value = value[ "@value" ];
		}

		return value;
	},

	mapValue = function( element, value, mappingConfig ) {

		var attributeName, placeholderText;

		attributeName = mappingConfig.attr;
		if ( attributeName ) {
			if ( !element.hasAttribute( attributeName ) ) {
				element.setAttribute( attributeName, "" );
			}
			element = element.getAttributeNode( attributeName );
		}

		// Placeholder text replacement if any
		if ( mappingConfig.placeholder ) {
			placeholderText = element.textContent || "";
			value = placeholderText.replace( mappingConfig.placeholder, value );
		}

		// Set the value to the node
		if ( mappingConfig.isHTML ) {
			element.innerHTML = value;
		} else if ( $.isArray( value ) || value && !( value instanceof String ) && typeof value === "object" ) {
/*
			console.log( "Applying sub template" );
			console.log( mappingConfig );
			console.log( value );
			dataIterator( element, value, mappingConfig );
			// applyTemplate( element, mappingConfig, value );*/
		} else {
			element.textContent = value;
		}
	},


	// Filtering a JSON
	// Return true if trueness && falseness
	// Return false if !( trueness && falseness )
	// trueness and falseness is an array of { "path": "", "value": "" } object
	filterPassJSON = function( obj, trueness, falseness ) {
		var i, i_cache,
			trueness_len = trueness.length,
			falseness_len = falseness.length,
			compareResult = false,
			isEqual;

		if ( trueness_len || falseness_len ) {

			for ( i = 0; i < trueness_len; i += 1 ) {
				i_cache = trueness[ i ];
				isEqual = _equalsJSON( jsonpointer.get( obj, i_cache.path ), i_cache.value );

				if ( i_cache.optional ) {
					compareResult = compareResult || isEqual;
				} else if ( !isEqual ) {
					return false;
				} else {
					compareResult = true;
				}
			}
			if ( trueness_len && !compareResult ) {
				return false;
			}

			for ( i = 0; i < falseness_len; i += 1 ) {
				i_cache = falseness[ i ];
				isEqual = _equalsJSON( jsonpointer.get( obj, i_cache.path ), i_cache.value );

				if ( isEqual && !i_cache.optional || isEqual && i_cache.optional ) {
					return false;
				}
			}

		}
		return true;
	},

	//
	_equalsJSON = function( a, b ) {
		switch ( typeof a ) {
		case "undefined":
			return false;
		case "boolean":
		case "string":
		case "number":
			return a === b;
		case "object":
			if ( a === null ) {
				return b === null;
			}
			var i, l;
			if ( $.isArray( a ) ) {
				if (  $.isArray( b ) || a.length !== b.length ) {
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
			for ( i = 0; i < bLength; i++ ) {
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
	},

	// Manage JSON value After the json data has been fetched
	jsonUpdate = function( event ) {
		var elm = event.target,
			$elm = $( elm ),
			lstCall = $elm.data( dataQueue ),
			refId = lstCall.length,
			wbJsonConfig = event[ "wb-json" ];

		if ( !( wbJsonConfig.url && ( wbJsonConfig.type || wbJsonConfig.source ) ) ) {
			throw "Data JSON update not configured properly";
		}

		lstCall.push( wbJsonConfig );
		$elm.data( dataQueue, lstCall );

		loadJSON( elm, wbJsonConfig.url, refId );
	};

$document.on( "json-failed.wb", selector, function( event ) {
	console.info( event.currentTarget );
	throw "Bad JSON Fetched from url in " + componentName;
} );

// Load template polyfill
Modernizr.load( {
	test: ( "content" in document.createElement( "template" ) ),
	nope: "site!deps/template" + wb.getMode() + ".js"
} );

$document.on( "timerpoke.wb " + initEvent + " " + updateEvent + " json-fetched.wb", selector, function( event ) {

	if ( event.currentTarget === event.target ) {
		switch ( event.type ) {

		case "timerpoke":
		case "wb-init":
			init( event );
			break;
		case "wb-update":
			jsonUpdate( event );
			break;
		default:
			jsonFetched( event );
			break;
		}
	}

	return true;
} );

// Add the timerpoke to initialize the plugin
for ( s = 0; s !== selectorsLength; s += 1 ) {
	wb.add( selectors[ s ] );
}

} )( jQuery, window, wb );
