/**
 * @title WET-BOEW JSON Manager
 * @overview Manage JSON dataset, execute JSON patch operation.
 * @license wet-boew.github.io/wet-boew/License-en.html / wet-boew.github.io/wet-boew/Licence-fr.html
 * @author @duboisp
 */
/*global jsonpointer, jsonpatch */
( function( $, window, wb ) {
"use strict";

/*
 * Variable and function definitions.
 * These are global to the plugin - meaning that they will be initialized once per page,
 * not once per instance of plugin on the page. So, this is a good place to define
 * variables that are common to all instances of the plugin on a page.
 */
var componentName = "wb-jsonmanager",
	selector = "[data-" + componentName + "]",
	initEvent = "wb-init." + componentName,
	postponeEvent = "postpone." + componentName,
	patchesEvent = "patches." + componentName,
	saveEvent = "save." + componentName,
	jsonFailedClass = "jsonfail",
	reloadFlag = "data-" + componentName + "-reload",
	dsNameRegistered = [],
	datasetCache = {},
	datasetCacheSettings = {},
	dsDelayed = {},
	dsPostponePatches = {},
	dsFetching = {},
	dsFetchIsArray = {},
	dsFetchMerged = {},
	$document = wb.doc,
	defaults = {
		ops: [
			{
				name: "patches",
				fn: function( obj, key, tree ) {
					var path = this.path,
						patches = this.patches,
						newTree = jsonpointer.get( tree, path );

					patches.forEach( ( patchConf ) => {
						patchConf.mainTree = tree;
						patchConf.pathParent = path;
						jsonpatch.apply( newTree, [ patchConf ] );
					} );
				}
			},{
				name: "if",
				fn: function( obj, key, tree ) {
					var test = this.test,
						patches = this.patches,
						valExpected = this.value,
						val = obj[ key ];

					if ( !test || !valExpected || !patches || !Array.isArray( patches ) ) {
						console.error( "Patches: Incomplete 'if' configuration" );
						return;
					}

					if ( ( test === "typeof" && typeof val === valExpected ) ||
						( test === "isArray" && Array.isArray( val ) === valExpected ) ) {

						jsonpatch.apply( tree, patches );

					}
				}
			},
			{
				name: "wb-count",
				fn: function( obj, key, tree ) {
					var countme = obj[ key ],
						len = 0, i_len, i,
						filter = this.filter || [ ],
						filternot = this.filternot || [ ];

					if ( !Array.isArray( filter ) ) {
						filter = [ filter ];
					}
					if ( !Array.isArray( filternot ) ) {
						filternot = [ filternot ];
					}

					if ( ( filter.length || filternot.length ) && Array.isArray( countme ) ) {

						// Iterate in obj[key] / item and check if is true for the given path is any.
						i_len = countme.length;

						for ( i = 0; i !== i_len; i = i + 1 ) {
							if ( filterPassJSON( countme[ i ], filter, filternot ) ) {
								len = len + 1;
							}
						}
					} else if ( Array.isArray( countme ) ) {
						len = countme.length;
					}
					applyPatch( tree, "add", this.set, len );
				}
			},
			{
				name: "wb-first",
				fn: function( obj, key, tree ) {
					var currObj = obj[ key ];
					if ( !Array.isArray( currObj ) || currObj.length === 0 ) {
						return;
					}

					applyPatch( tree, "add", this.set, currObj[ 0 ] );
				}
			},
			{
				name: "wb-last",
				fn: function( obj, key, tree ) {
					var currObj = obj[ key ];
					if ( !Array.isArray( currObj ) || currObj.length === 0 ) {
						return;
					}

					applyPatch( tree, "add", this.set, currObj[ currObj.length - 1 ] );
				}
			},
			{
				name: "wb-nbtolocal",
				fn: function( obj, key, tree ) {
					var val = obj[ key ],
						loc = this.locale || window.wb.lang,
						suffix = this.suffix || "",
						prefix = this.prefix || "";

					if ( typeof val === "string" ) {
						val = parseFloat( val );
						if ( isNaN( val ) ) {
							return;
						}
					}

					applyPatch( tree, "replace", this.path, prefix + val.toLocaleString( loc ) + suffix );
				}
			},
			{
				name: "wb-decodeUTF8Base64",
				fn: function( obj, key, tree ) {
					var val = obj[ key ];

					if ( !this.set ) {
						applyPatch( tree, "replace", this.path, wb.decodeUTF8Base64( val ) );
					} else {
						applyPatch( tree, "add", this.set, wb.decodeUTF8Base64( val ) );
					}
				}
			},
			{
				name: "wb-escapeHTML",
				fn: function( obj, key, tree ) {
					var val = obj[ key ];

					if ( !this.set ) {
						applyPatch( tree, "replace", this.path, wb.escapeHTML( val ) );
					} else {
						applyPatch( tree, "add", this.set, wb.escapeHTML( val ) );
					}
				}
			},
			{
				name: "wb-toDateISO",
				fn: function( obj, key, tree ) {
					if ( !this.set ) {
						applyPatch( tree, "replace", this.path, wb.date.toDateISO( obj[ key ] ) );
					} else {
						applyPatch( tree, "add", this.set, wb.date.toDateISO( obj[ key ] ) );
					}
				}
			},
			{
				name: "wb-toDateTimeISO",
				fn: function( obj, key, tree ) {
					if ( !this.set ) {
						applyPatch( tree, "replace", this.path, wb.date.toDateISO( obj[ key ], true ) );
					} else {
						applyPatch( tree, "add", this.set, wb.date.toDateISO( obj[ key ], true ) );
					}
				}
			},
			{
				name: "wb-swap",
				fn: function( obj, key, tree ) {
					var val = obj[ key ],
						ref = this.ref,
						mainTree = this.mainTree || tree,
						path = this.path,
						newVal,
						refObject, refIsArray, valWasArray,
						i, i_len, i_item,
						j, j_len, j_item;

					/*if ( path === "/dct:title" ) {
						console.log( "Its the one...." );
						console.log( this );
					}

					// Override the value by the value pointed by the selector under "value" prop
					if ( this.value ) {

						console.log( "wb-swap has a value" );
						console.log( this.value );
						console.log( obj );
						console.log( key );
						console.log( val );

						val = jsonpointer.get( mainTree, this.value )

						console.log( val );
					}*/
					if ( this.put ) {
						console.log( "PUTTTT" );
						console.log( this );
						path = this.put;
					}

					if ( val ) {

						refObject = jsonpointer.get( mainTree, ref );
						refIsArray = Array.isArray( refObject );
						valWasArray = Array.isArray( val );

						if ( !valWasArray ) {
							val =  [ val ];
						}

						i_len = val.length;

						for ( i = 0; i !== i_len; i++ ) {
							i_item = val[ i ];
							newVal = undefined; // Reinit
							if ( !refIsArray ) {

								/*
									This change was about to support in replacing/specifying the earl:subject, but whatever for now.
								*/
								i_item = i_item.replaceAll( "~", "~0" ).replaceAll( "/", "~1" ); // Escape slashed and tilde in val when the key is an IRI for JSON pointer compatibility
								if ( refObject && refObject[ "@id" ] && refObject[ "@id" ] === i_item ) {
									newVal = refObject;
								} else if ( refObject && refObject[ "@id" ] ) {

									// There is no match, leave it as is
								} else {
									newVal = mainTree ? jsonpointer.get( mainTree, ref + "/" + i_item ) : jsonpointer.get( tree, ref + "/" + i_item );
								}
							} else {

								// Iterate until we found a corresponding value in the property "@id"
								j_len = refObject.length;
								for ( j = 0; j !== j_len; j++ ) {
									j_item = refObject[ j ];
									if ( j_item[ "@id" ] && j_item[ "@id" ] === i_item ) {
										newVal = j_item;
										break;
									}
								}
								if ( !newVal ) {
									console.error( "wb-swap: Unable to find a corresponding value for: " + val + " in reference " + ref );
									break;
								}
							}
							if ( newVal && !valWasArray ) {
								applyPatch( tree, "replace", path, newVal );
							} else if ( newVal ) {
								applyPatch( tree, "replace", path + "/" + i, newVal );
							}
						}
					}
				}
			},
			{
				name: "wb-add-from",
				fn: function( obj, key, tree ) {

					var fromObj = jsonpointer.get( tree, this.value );

					console.log( "wb-add-from (NOT ARRAY PATH)- Set value to: " + this.path );
					console.log( fromObj );

					applyPatch( tree, "add", this.path, fromObj );
				}
			},
		],
		opsArray: [
			{
				name: "wb-toDateISO",
				fn: function( arr )  {
					var setval = this.set,
						pathval = this.path,
						i, i_len = arr.length;
					for ( i = 0; i !== i_len; i += 1 ) {
						if ( setval ) {
							jsonpatch.apply( arr, [
								{ op: "wb-toDateISO", set: "/" + i + setval, path: "/" + i + pathval }
							] );
						} else {
							jsonpatch.apply( arr, [
								{ op: "wb-toDateISO", path: "/" + i + pathval }
							] );
						}
					}
				}
			},
			{
				name: "wb-toDateTimeISO",
				fn: function( arr ) {
					var setval = this.set,
						pathval = this.path,
						i, i_len = arr.length;
					for ( i = 0; i !== i_len; i += 1 ) {
						if ( setval ) {
							jsonpatch.apply( arr, [
								{ op: "wb-toDateTimeISO", set: "/" + i + setval, path: "/" + i + pathval }
							] );
						} else {
							jsonpatch.apply( arr, [
								{ op: "wb-toDateTimeISO", path: "/" + i + pathval }
							] );
						}
					}
				}
			},
			{
				name: "wb-swap",
				fn: function( arr ) {
					arr.forEach( ( item, i ) => {
						jsonpatch.apply( arr, [
							{ op: "wb-swap", path: "/" + i + this.path, ref: this.ref, mainTree: this.mainTree, put: ( this.put ? "/" + i + this.put : false ) }
						] );
					} );
				}
			},
			{
				name: "patches",
				fn: function( arr ) {
					arr.forEach( ( item, i ) => {
						jsonpatch.apply( this.mainTree || arr, [
							{ op: "patches", path: ( this.pathParent || "" ) + "/" + i + this.path, patches: this.patches }
						] );
					} );
				}
			},
			{
				// Add the referenced item at the path location. Here the path is an array.
				name: "wb-add-from",
				fn: function( arr, idx, tree ) {
					var val = jsonpointer.get( tree, this.value ),
						i, i_len;

					// Make the value in a array, which help to normailize the processing
					if ( !Array.isArray( val ) ) {
						val = [ val ];
					}


					// Concat both array by cloning each value
					i_len = val.length;
					for ( i = 0; i !== i_len; i = i + 1 ) {

						// Add a cloned version of the value
						applyPatch( tree, "add", this.path, $.extend( true, {}, val[ i ] ) );
					}
				}
			},
		],
		opsRoot: [],
		settings: { },
		docMapKeys: { "referer": document.referrer, "locationHref": location.href }
	},

	// Add debug information after the JSON manager element
	debugPrintOut = function( $elm, name, json, patches ) {
		$elm.after( "<p lang=\"en\"><strong>" + $elm.get( 0 ).id + " - JSON Manager Debug</strong> (" +  name + ")</p><ul lang=\"en\"><li>JSON: <pre><code>" + JSON.stringify( json, null, 2 ) + "</code></pre></li><li>Patches: <pre><code>" + JSON.stringify( patches, null, 2 ) + "</code></pre>" );
		console.info( "Debug: " + $elm.get( 0 ).id );
		console.log( json );
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
			jsSettings = window[ componentName ] || { },
			ops, opsArray, opsRoot,
			i, i_len, i_cache,
			url, urlActual, dsName, urlSplit, fetchedRef,
			fetchOpts = { };

		if ( elm ) {
			$elm = $( elm );

			// Load handlebars
			Modernizr.load( {

				// For loading multiple dependencies
				load: [
					"site!deps/json-patch" + wb.getMode() + ".js",
					"site!deps/jsonpointer" + wb.getMode() + ".js"
				],
				testReady: function() {
					return window.jsonpatch && window.jsonpointer;
				},
				complete: function() {
					var elmData = wb.getData( $elm, componentName );

					if ( !defaults.registered ) {
						ops = defaults.ops.concat( jsSettings.ops || [ ] );
						opsArray = defaults.opsArray.concat( jsSettings.opsArray || [ ] );
						opsRoot = defaults.opsRoot.concat( jsSettings.opsRoot || [ ] );

						if ( ops.length ) {
							for ( i = 0, i_len = ops.length; i !== i_len; i++ ) {
								i_cache = ops[ i ];
								jsonpatch.registerOps( i_cache.name, i_cache.fn );
							}
						}
						if ( opsArray.length ) {
							for ( i = 0, i_len = opsArray.length; i !== i_len; i++ ) {
								i_cache = opsArray[ i ];
								jsonpatch.registerOpsArray( i_cache.name, i_cache.fn );
							}
						}
						if ( opsRoot.length ) {
							for ( i = 0, i_len = opsRoot.length; i !== i_len; i++ ) {
								i_cache = opsRoot[ i ];
								jsonpatch.registerOpsRoot( i_cache.name, i_cache.fn );
							}
						}
						defaults.settings = $.extend( {}, defaults.settings, jsSettings.settings || {} );
						defaults.registered = true;
					}

					dsName = elmData.name;
					if ( !dsName || dsName in dsNameRegistered ) {
						throw "Dataset name must be unique";
					}
					dsNameRegistered.push( dsName );

					url = elmData.url;
					dsFetching[ dsName ] = {};

					if ( url ) {

						url = typeof url === "string" ? [ url ] : url;
						i_len = url.length;

						for ( i = 0; i !== i_len; i++ ) {

							urlActual = url[ i ];

							// Fetch default configuration
							fetchOpts = {
								callerId: elm.id,  // This change is a bug fix that prevented to chain multiple JSON manager
								nocache: elmData.nocache,
								nocachekey: elmData.nocachekey,
								data: elmData.data,
								contentType: elmData.contenttype,
								method: elmData.method
							};

							// When the "url" is an extended configuration
							if ( urlActual.url ) {
								fetchOpts.savingPath = urlActual.path || "";
								fetchOpts.url = urlActual.url;
							} else {
								fetchOpts.url = urlActual;
							}

							// Figure out the fetching reference for this dataset, one reference by URLs. (Note: CharCode 91 === "["
							urlSplit = fetchOpts.url.split( "#" );
							fetchedRef = urlSplit[ 0 ];
							if ( !fetchedRef &&  urlSplit[ 1 ].charCodeAt( 0 ) === 91 ) {

								// Extract and use the dataset name as the reference
								fetchedRef = "#[" + urlSplit[ 1 ].split( "/" )[ 0 ] + "]"; // This change is a bug fix that prevented to chain multiple JSON manager
							}
							dsFetching[ dsName ][ fetchedRef ] = false;

							// Fetch the JSON
							$elm.trigger( {
								type: "json-fetch.wb",
								fetch: fetchOpts
							} );

							// If the URL is a dataset, make it ready
							if ( fetchOpts.url.charCodeAt( 0 ) === 35 && fetchOpts.url.charCodeAt( 1 ) === 91 ) {
								wb.ready( $elm, componentName );
							}
						}
					} else if ( !url && elmData.extractor ) {
						dsFetching[ dsName ][ dsName ] = false;
						$elm.trigger( {
							type: "json-fetched.wb",
							fetch: {
								response: {}
							}
						} );
						wb.ready( $elm, componentName );

					} else if ( !url && elmData.load ) {

						// Local saving name to ease interconnection for multipage form or for interconnectivity between them
						var nameForSaving = elmData.savename || dsName;

						switch ( elmData.load ) {

						case "cache":
							caches.open( componentName ).then( function( cacheStorage ) {
								cacheStorage.match( "#" + nameForSaving + "" ).then( function( retRes ) {
									retRes.text().then( function( txt ) {
										$elm.trigger( {
											type: "json-fetched.wb",
											fetch: {
												response: JSON.parse( txt )
											}
										} );
									}).fail( function() {
										$elm.trigger( {
											type: "json-failed.wb",
											fetch: {
												url: "#storage",
												xhr: {},
												status: "500",
												error: "Data was not found in cache as expected"
											}
										} );
									} );
								} );
							} );
							break;

						case "local":
							loadFromStorage( localStorage, $elm, dsName, nameForSaving );
							break;

						case "session":
						default:
							loadFromStorage( sessionStorage, $elm, dsName, nameForSaving );
							break;
						}

						wb.ready( $elm, componentName );
					} else {
						dsFetching[ dsName ][ dsName ] = false;
						$elm.trigger( {
							type: "json-fetch.wb"
						} );
						wb.ready( $elm, componentName );
					}

				}
			} );
		}
	},
	loadFromStorage = function( storage, $elm, dsName, nameForSaving ) {
		var storageLoad;

		dsFetching[ dsName ][ dsName ] = false;

		storageLoad = storage.getItem( "ds-" + nameForSaving );

		console.log( storageLoad );

		// Check if the storage item do exist
		if ( !storageLoad || storageLoad === null ) {

			// Throw a fetch error
			$elm.trigger( {
				type: "json-failed.wb",
				fetch: {
					url: "#storage",
					xhr: {},
					status: "500",
					error: "Data was not found in storage as expected"
				}
			} );
			console.error( "Data was not found in storage as expected: " + "ds-" + nameForSaving );
			return;
		}

		// Try parsing the value from the storage
		try {
			storageLoad = JSON.parse( storageLoad );
		} catch ( ex ) {

			// Throw a fetch error
			$elm.trigger( {
				type: "json-failed.wb",
				fetch: {
					url: "#storage",
					xhr: {},
					status: "500",
					error: "JSON parsing error. The data seems corrupted in the store."
				}
			} );
			return;
		}

		// All good, let trigger a normal fetch
		$elm.trigger( {
			type: "json-fetched.wb",
			fetch: {
				response: storageLoad
			}
		} );
	},
	extractData = function( elmObj ) {

		var isGroup = false,
			selectedTag,
			targetTag,
			lastIndex = [],
			j_tag = "",
			group = {},
			arrMap = [],
			node_children = [],
			j_node = 0,
			arrRepeatPath = [],
			combineToObj = function( cur_obj ) {
				if ( cur_obj.selector === j_tag ) {
					if ( !lastIndex.includes( j_tag ) ) {
						group[ cur_obj.path ] = cur_obj.attr && node_children[ j_node ].getAttributeNode( cur_obj.attr ) ?
							node_children[ j_node ].getAttributeNode( cur_obj.attr ).textContent :
							node_children[ j_node ].textContent;
						lastIndex.push( j_tag );
					}
				}
			},
			manageObjDir = function( selector, selectedValue, json_return ) {
				var arrPath = selector.path.split( "/" ).filter( Boolean );

				// Check if selectedValue is an empty value returned by querySelectorAll
				if ( selectedValue && selectedValue instanceof NodeList && selectedValue.length === 0 ) {
					selectedValue = null;
				}

				if ( arrPath.length > 1 ) {
					var pointer = "";
					pointer = arrPath.pop();

					if ( arrPath[ 0 ] && arrPath[ 0 ] !== "" ) {

						if ( !json_return[ arrPath[ 0 ] ] && !arrRepeatPath.includes( arrPath[ 0 ] ) ) {
							arrRepeatPath.push( arrPath[ 0 ] );
							json_return[ arrPath[ 0 ] ] = {};
						}
						if ( selector.selectAll && !json_return[ arrPath[ 0 ] ] [ pointer ]  ) {
							json_return[ arrPath[ 0 ] ] [ pointer ] = [];
						}
						if ( selector.selectAll ) {
							json_return[ arrPath[ 0 ] ] [ pointer ].push( selectedValue );
						} else {
							json_return[ arrPath[ 0 ] ] [ pointer ] = selectedValue;
						}

					} else {

						if ( selector.selectAll ) {
							json_return[ arrPath[ 0 ] ].push( selectedValue );
						} else {
							json_return[ pointer ] = selectedValue;
						}
					}
				} else {

					if ( selector.selectAll ) {
						if ( !json_return[ selectedTag.path ] ) {
							json_return[ selectedTag.path ] = [];
						}
						json_return[ selectedTag.path ].push( selectedValue );
					} else {
						json_return[ selectedTag.path ] = selectedValue;
					}
				}
			},
			jsonSource = {};


		for ( var tag = 0; tag <= elmObj.length - 1; tag++ ) {

			selectedTag = elmObj[ tag ];

			if ( !selectedTag.interface ) {

				targetTag = document.querySelectorAll( selectedTag.selector || "" );
				isGroup = selectedTag.extractor && selectedTag.extractor.length >= 1 ? true : false;

				if ( selectedTag.selectAll ) {

					for ( var i_node = 0; i_node <= targetTag.length - 1; i_node++ ) {

						var selectedTagValue = selectedTag.attr && targetTag [ i_node ].getAttributeNode( selectedTag.attr ) ?
							targetTag [ i_node ].getAttributeNode( selectedTag.attr ).textContent :
							targetTag [ i_node ].textContent;

						manageObjDir( selectedTag, selectedTagValue, jsonSource );
					}
				}

				// extract from combined selectors and group the values e.g dt with dd
				if ( isGroup ) {

					jsonSource[ selectedTag.path ] = [];

					node_children = targetTag[ 0 ].children;

					var extractorLength = Object.keys( selectedTag.extractor ).length;

					for ( j_node = 0; j_node <= node_children.length - 1; j_node++ ) {

						j_tag = node_children[ j_node ].tagName.toLowerCase();

						selectedTag.extractor.find( combineToObj );
						if ( Object.keys( group ).length === extractorLength ) {
							arrMap.push( group );
							group = {};
							lastIndex = [];
						}
					}
					$.extend( jsonSource[ selectedTag.path ], arrMap );
				}

				if ( targetTag.length ) {
					targetTag = selectedTag.attr && targetTag [ 0 ].getAttributeNode( selectedTag.attr ) ?
						targetTag [ 0 ].getAttributeNode( selectedTag.attr ).textContent :
						targetTag [ 0 ].textContent;
				}

			} else {

				targetTag = defaults.docMapKeys[ selectedTag.interface ];

				manageObjDir( selectedTag, targetTag, jsonSource );
			}

			if ( !selectedTag.selectAll  ) {
				if ( isGroup === false ) {
					manageObjDir( selectedTag, targetTag, jsonSource );
				}
			}
		}

		return jsonSource;
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

	// Utility function to compare two JSON value
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
			if ( Array.isArray( a ) ) {
				if (  Array.isArray( b ) || a.length !== b.length ) {
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
		if ( Array.isArray( obj ) ) {
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

	// Utility function to apply a JSON patch
	applyPatch = function( tree, op, path, value ) {
		jsonpatch.apply( tree, [
			{ op: op, path: path, value: value }
		] );
	},

	// Create series of patches for filtering
	getPatchesToFilter = function( JSONsource, filterPath, filterTrueness, filterFaslseness ) {
		var filterObj,
			i, i_len;

		if ( !Array.isArray( filterTrueness ) ) {
			filterTrueness = [ filterTrueness ];
		}
		if ( !Array.isArray( filterFaslseness ) ) {
			filterFaslseness = [ filterFaslseness ];
		}

		filterObj = jsonpointer.get( JSONsource, filterPath );
		if ( Array.isArray( filterObj ) ) {
			i_len = filterObj.length - 1;
			for ( i = i_len; i !== -1; i -= 1 ) {
				if ( !filterPassJSON( filterObj[ i ], filterTrueness, filterFaslseness ) ) {
					jsonpatch.apply( JSONsource, [ { op: "remove", path: filterPath + "/" + i } ] );
				}
			}
		}
		return JSONsource;
	};

$document.on( "json-failed.wb", selector, function( event ) {
	var elm = event.target,
		$elm,
		fetchOpts = event.fetch,
		urlSplit = fetchOpts.url.split( "#" ),
		settings, urlSplit, fetchedRef,
		dsName,
		backlog, i, i_len, i_cache;

	if ( elm === event.currentTarget ) {
		$elm = $( elm );
		$elm.addClass( jsonFailedClass );

		settings = wb.getData( $elm, componentName );
		dsName = settings.name;

		// Let invalidate the graph represented by the alias
		if ( !dsFetching[ dsName ] ) {
			dsFetching[ dsName ] = {};
		}
		fetchedRef = urlSplit[ 0 ];
		if ( !fetchedRef &&  urlSplit[ 1 ].charCodeAt( 0 ) === 91 ) {

			// Extract and use the dataset name as the reference
			fetchedRef = "#" + urlSplit[ 1 ];

		}
		dsFetching[ dsName ][ fetchedRef ] = false;

		dsName = "[" + dsName + "]"; // Dataset unique name

		// Notify the binded data-json of the failure and return the current compiled data
		if ( dsDelayed[ dsName ] ) {
			backlog = dsDelayed[ dsName ];
			i_len = backlog.length;
			for ( i = 0; i !== i_len; i += 1 ) {
				i_cache = backlog[ i ];
				$( "#" + i_cache.callerId ).trigger( {
					type: "json-failed.wb",
					fetch: {
						url: fetchedRef,
						response: dsFetchMerged[ dsName ] || {},
						status: fetchOpts.status,
						error: fetchOpts.error,
						refId: i_cache.refId,
						xhr: fetchOpts.xhr,
						fetchOpts: fetchOpts
					}
				}, this );
			}
		}



		// Identify that initialization has completed
		wb.ready( $elm, componentName );
	}
} );

$document.on( "json-fetched.wb", selector, function( event ) {
	var elm = event.target,
		$elm = $( elm ),
		settings,
		fetchedOpts = event.fetch.fetchedOpts,
		wasUrl = event.fetch.url,
		urlWasFound = false,
		isReloading = elm.hasAttribute( reloadFlag ),
		dsName,
		JSONresponse = event.fetch.response,
		isArrayResponse,
		resultSet,
		i, i_len, i_cache, backlog, selector,
		objIterator, savingPathSplit,
		patches, filterTrueness, filterFaslseness, filterPath, extractor;

	if ( elm === event.currentTarget ) {
		settings = wb.getData( $elm, componentName );

		// Is the fetched JSON need to be wrap in another plain object
		if ( fetchedOpts && fetchedOpts.savingPath ) {
			savingPathSplit = fetchedOpts.savingPath.split( "/" );

			for ( i = savingPathSplit.length - 1; i > 0; i-- ) {
				if ( !savingPathSplit[ i ] ) {
					continue;
				}
				objIterator = {};
				objIterator[ savingPathSplit[ i ] ] = JSONresponse;
				JSONresponse = objIterator;
			}
		}

		// Determine if the response is an array
		isArrayResponse = Array.isArray( JSONresponse );

		// Ensure the response is an independant clone
		if ( isArrayResponse ) {
			JSONresponse = $.extend( true, [], JSONresponse );
		} else {
			JSONresponse = $.extend( true, {}, JSONresponse );
		}

		dsName = settings.name;
		wasUrl = wasUrl || dsName;

		// Ensure that we do have fetched and merged all urls everything before to move ahead
		dsFetchIsArray[ dsName ] = dsFetchIsArray[ dsName ] ? dsFetchIsArray[ dsName ] : isArrayResponse;

		if ( dsFetchIsArray[ dsName ] !== isArrayResponse ) {
			throw "Can't merge, incompatible JSON type (array vs object)";
		}

		// Ensure the URL was intended to be fetched
		for (i in dsFetching[ dsName ] ) {
			if ( i === wasUrl ) {
				urlWasFound = true;
				break;
			}
		}
		if ( !urlWasFound ) {
			return;
		}

		// Merge the response
		dsFetching[ dsName ][ wasUrl ] = JSONresponse;
		if ( !dsFetchMerged[ dsName ] ) {
			dsFetchMerged[ dsName ] = JSONresponse;
		} else if ( dsFetchMerged[ dsName ] && isArrayResponse ) {
			dsFetchMerged[ dsName ] = dsFetchMerged[ dsName ].concat( JSONresponse );
		} else {
			dsFetchMerged[ dsName ] = $.extend( dsFetchMerged[ dsName ], JSONresponse );
		}

		// Ensure that all URL has been loaded before to proceed.
		for (i in dsFetching[ dsName ] ) {
			if ( !dsFetching[ dsName ][ i ] ) {
				return;
			}
		}

		JSONresponse = dsFetchMerged[ dsName ];

		extractor = settings.extractor;
		if ( extractor ) {
			if ( !Array.isArray( extractor ) ) {
				extractor = [ extractor ];
			}
			JSONresponse = $.extend( JSONresponse, extractData( extractor ) );

		}

		dsName = "[" + dsName + "]";
		patches = settings.patches || [];
		filterPath = settings.fpath;
		filterTrueness = settings.filter || [];
		filterFaslseness = settings.filternot || [];

		if ( !Array.isArray( patches ) ) {
			patches = [ patches ];
		}

		// Apply a filtering
		if ( filterPath ) {
			JSONresponse = getPatchesToFilter( JSONresponse, filterPath, filterTrueness, filterFaslseness );
		}

		// Apply the wraproot
		if ( settings.wraproot  ) {
			i_cache = { };
			i_cache[ settings.wraproot ] = JSONresponse;
			JSONresponse = i_cache;
		}

		// Apply the patches
		if ( patches.length ) {
			//try {
				jsonpatch.apply( JSONresponse, patches );
			/*} catch ( ex ) {
				console.error( "Error when applying patches" );
				console.error( elm );
				console.info( "Patches:" );
				console.info( patches );
				console.info( "Dataset:" );
				console.info( JSONresponse );
				return;
			}*/
		}

		if ( settings.debug ) {
			debugPrintOut( $elm, "initEvent", JSONresponse, patches );
		}

		try {
			datasetCache[ dsName ] = JSONresponse;
		} catch ( error ) {
			return;
		}
		datasetCacheSettings[ dsName ] = settings;

		if ( isReloading ) {
			elm.removeAttribute( reloadFlag );
			i_cache = dsPostponePatches[ dsName ];
			if ( i_cache ) {
				$elm.trigger( i_cache );
			}
		}

		if ( !settings.wait && dsDelayed[ dsName ] ) {
			backlog = dsDelayed[ dsName ];
			i_len = backlog.length;
			for ( i = 0; i !== i_len; i += 1 ) {
				i_cache = backlog[ i ];
				selector = i_cache.selector;
				if ( selector.length ) {
					try {
						resultSet = jsonpointer.get( JSONresponse, selector );
					} catch  ( e ) {
						throw dsName + " - JSON selector not found: " + selector;
					}
				} else {
					resultSet = JSONresponse;
				}

				$( "#" + i_cache.callerId ).trigger( {
					type: "json-fetched.wb",
					fetch: {
						url: "#[" + dsName + "]",
						response: resultSet,
						status: "200",
						refId: i_cache.refId,
						xhr: null
					}
				}, this );
			}
		}

		// Identify that initialization has completed
		wb.ready( $elm, componentName );
	}
} );

// Apply patches to a preloaded JSON data
$document.on( patchesEvent, selector, function( event ) {
	var elm = event.target,
		$elm = $( elm ),
		patches = event.patches,
		filterPath = event.fpath,
		filterTrueness = event.filter || [],
		filterFaslseness = event.filternot || [],
		isCumulative = !!event.cumulative,
		passiveUpdate = !!event.passive,
		settings,
		dsName,
		dsJSON, resultSet,
		delayedLst,
		i, i_len, i_cache, pntrSelector;

	if ( elm === event.currentTarget && Array.isArray( patches ) ) {

		settings = wb.getData( $elm, componentName );

		if ( !settings ) {
			return true;
		}
		dsName = "[" + settings.name + "]";

		// Check if the patches need to be hold until the next json-fetch event
		if ( elm.hasAttribute( reloadFlag ) ) {
			dsPostponePatches[ dsName ] = event;
			return true;
		}

		if ( !dsDelayed[ dsName ] ) {
			throw "Applying patched on undefined dataset name: " + dsName;
		}

		dsJSON = datasetCache[ dsName ];
		if ( !isCumulative ) {
			dsJSON = $.extend( true, ( Array.isArray( dsJSON ) ? [] : {} ), dsJSON );
		}

		// Apply a filtering
		if ( filterPath ) {
			dsJSON = getPatchesToFilter( dsJSON, filterPath, filterTrueness, filterFaslseness );
		}

		jsonpatch.apply( dsJSON, patches );

		if ( settings.debug ) {
			debugPrintOut( $elm, "patchesEvent" + ( passiveUpdate ? " -passive" : "" ), dsJSON, patches );
		}

		if ( passiveUpdate ) {
			return;
		}

		delayedLst = dsDelayed[ dsName ];
		i_len = delayedLst.length;
		for ( i = 0; i !== i_len; i += 1 ) {
			i_cache = delayedLst[ i ];
			pntrSelector = i_cache.selector;
			if ( pntrSelector.length ) {
				try {
					resultSet = jsonpointer.get( dsJSON, pntrSelector );
				} catch  ( e ) {
					throw dsName + " - JSON selector not found: " + pntrSelector;
				}
			} else {
				resultSet = dsJSON;
			}
			$( "#" + i_cache.callerId ).trigger( {
				type: "json-fetched.wb",
				fetch: {
					url: "#[" + dsName + "]",
					response: resultSet,
					status: "200",
					refId: i_cache.refId,
					xhr: null
				}
			}, this );
		}
	}
} );

// I need to Save, Load, Export and Import
// To save a JSON dataset in a local storage
$document.on( saveEvent, function( event ) {

	console.log( event );

	var elm = event.target,
		$elm = $( elm ),
		data = event.metadata,
		dsName,
		mode = data.mode,
		fileName,
		settings,
		nameForSaving;

	settings = wb.getData( $elm, componentName );

	if ( !settings ) {
		return true;
	}

	dsName = "[" + settings.name + "]";

	if ( !settings.name || !datasetCache[ dsName ] ) {
		throw "A valid dataset name must be specified";
	}

	// Local saving name to ease interconnection for multipage form or for interconnectivity between them
	if ( settings.savename ) {
		nameForSaving = settings.savename;
	} else {
		nameForSaving = data.fname || dsName.slice( 1, -1);
	}


	switch ( mode ) {

	case "download":
		fileName = nameForSaving + ".json",
		wb.download( new Blob( [ JSON.stringify( datasetCache[ dsName ], null, 2 ) ], { type: "application/json;charset=utf-8" } ), fileName );
		break;

	case "cache":
		caches.open( componentName ).then( function( cacheStorage ) {
			var res = new Response( new Blob( [ JSON.stringify( datasetCache[ dsName ] ) ], { type: "application/json;charset=utf-8" } ), {
			  status: 200,
			  headers: { 'Content-Type': "application/json;charset=utf-8" }
			} );
			cacheStorage.put( "#" + nameForSaving, res );
		} );

	case "local":

		localStorage.setItem( "ds-" + nameForSaving, JSON.stringify( datasetCache[ dsName ] ) );
		console.log( "Saved in local" );
		break;

	case "session":
	default:
		sessionStorage.setItem( "ds-" + nameForSaving, JSON.stringify( datasetCache[ dsName ] ) );
		console.log( "Saved in session" );
		break;
	}

} );

// Used by the JSON-fetch plugin for when trying fetching a resource that is mapped a dataset name
$document.on( postponeEvent, function( event ) {
	var jsonPostpone = event.postpone,
		dsName = jsonPostpone.dsname,
		callerId = jsonPostpone.callerId,
		refId = jsonPostpone.refId,
		selector = jsonPostpone.selector,
		resultSet;

	if ( !dsDelayed[ dsName ] ) {
		dsDelayed[ dsName ] = [ ];
	}

	// Add to the delayed updates list
	dsDelayed[ dsName ].push( {
		"callerId": callerId,
		"refId": refId,
		"selector": selector
	} );

	// Send the data if the dataset is ready?
	if ( datasetCache[ dsName ] && !datasetCacheSettings[ dsName ].wait ) {

		resultSet = datasetCache[ dsName ];
		if ( selector.length ) {
			try {
				resultSet = jsonpointer.get( resultSet, selector );
			} catch  ( e ) {
				throw dsName + " - JSON selector not found: " + selector;
			}
		}
		$( "#" + callerId ).trigger( {
			type: "json-fetched.wb",
			fetch: {
				url: "#[" + dsName + "]",
				response: resultSet,
				status: "200",
				refId: refId,
				xhr: null
			}
		}, this );
	}

} );

/*
 * Integration with wb-fieldflow
 *
 */
function pushData( $elm, prop, data, reset ) {
	var dtCache = $elm.data( prop );
	if ( !dtCache || reset ) {
		dtCache = [];
	}
	dtCache.push( data );
	return $elm.data( prop, dtCache );
}

// Fieldflow "op" action
$document.on( "op.action.wb-fieldflow", ".wb-fieldflow", function( event, data ) {

	if ( !data.op ) {
		return;
	}

	// Postpone the event for form submission
	data.preventSubmit = true;
	pushData( $( data.provEvt ), "wb-fieldflow-submit", data );
} );

// Fieldflow "op" submit
$document.on( "op.submit.wb-fieldflow", ".wb-fieldflow", function( event, data ) {

	// Get the hbs Plugin
	var op = data.op,
		source = data.source,
		ops;

	if ( !op ) {
		return true;
	}

	if ( !Array.isArray( op ) ) {
		ops = [];
		ops.push( op );
	} else {
		ops = op;
	}

	$( source ).trigger( {
		type: "patches.wb-jsonmanager",
		patches: ops
	} );
} );

// Bind the init event of the plugin
$document.on( "timerpoke.wb " + initEvent, selector, init );


// Add the timer poke to initialize the plugin
wb.add( selector );

} )( jQuery, window, wb );
