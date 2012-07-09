/*!
 * Form enhancement project - Up To v1.0a1 / Amélioration des formulaire - Jusqu'à v1.0a6
 * Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
 * Terms and conditions of use: http://tbs-sct.ircan.gc.ca/projects/gcwwwtemplates/wiki/Terms
 * Conditions régissant l'utilisation : http://tbs-sct.ircan.gc.ca/projects/gcwwwtemplates/wiki/Conditions
 */
 
 // 
 // Ajout d'un Selector dans jQuery ":focusable"
 //
 $.extend($.expr[':'], {
    focusable: function(element) {
    var nodeName = element.nodeName.toLowerCase(),
    tabIndex = $.attr(element, 'tabindex');
    return (/input|select|textarea|button|object/.test(nodeName)
    ? !element.disabled
    : 'a' == nodeName || 'area' == nodeName
    ? element.href || !isNaN(tabIndex)
    : !isNaN(tabIndex))
    // the element and all of its ancestors must be visible
    // the browser may report that the area is hidden
    && !$(element)['area' == nodeName ? 'parents' : 'closest'](':hidden').length;
    }
});

 
var formupto = {
	
	// Load the parameters used in the plugin declaration. Parameters can be access using this.parms.parameterName
	params :  Utils.loadParamsFromScriptID("formupto"),
	
	//Method that is executed when the page loads
	init : function(){
		
		
		var paramsFix = eval(decodeURIComponent(this.params.chart));
		
		$(paramsFix).each(function(index, value){
			formupto.run(value);
		});
		if($(paramsFix).length == 0){
			formupto.run({});
		}
	},
	
	run : function(options){
		
		
			
		var o = $.extend({
			
			"default-namespace": "wb-upto",
			
			"groupdef-autocreate": true, // Define the group id for subsequent add
			"groupdef-typeof": "string",
			
			partern: {
				"default-namespace": "wb-upto",
				
				start: 1,
				"start-typeof": "number",
				
				end: 1,
				"end-typeof": "number"
			},
			
			inputFor: {
				"default-namespace": "wb-upto",
				"for-autocreate": true,
				"for-typeof": "string"
			},
			
			group: {
				"default-namespace": "wb-upto",
				
				"group-autocreate": true,
				"group-typeof": "string",
				
				"itm-autocreate": true,
				"itm-typeof": "number"
			
			
			}
		
		},options);
		
		
		function setClassOptions(sourceOptions, strClass, namespace){
				
				
					// Test: optSource
					if(typeof(sourceOptions) != "object"){
						console.log("Empty source");
						return {};
					}
					
					// Get a working copy for the sourceOptions
					sourceOptions = jQuery.extend(true, {}, sourceOptions);
					
					/*
					// Check if some option need to be removed
					function unsetOption(opt, currLevel, maxLevel){
						if(currLevel > maxLevel || !$.isArray(opt)){
							return;
						}
						var arrToRemove = [];
						for(key in opt){
							// if the key are ending "-remove", get the key to remove
							if(key.lenght > 7 && key.substr(key.lenght - 7) == "-remove"){
								arrToRemove.push(key.substr(0, key.lenght - 7));
							} else {
								// get it deeper if applicable
								if(typeof(opt[key])) == "object"){
									currLevel ++;
									if(currLevel < maxLevel){
										unsetOption(opt[key], currLevel, maxLevel);
									}
								}
							}
						}
						for(i=0;i<arrToRemove.lenght;i++){
							delete opt[arrToRemove[i]];
						}
					}
					
					// Check for an unsetOptionsLevel, if defined to the unset
					if(sourceOptions['default-unsetoptionlevel'] && typeof(sourceOptions['default-unsetoptionlevel']) == "number"){
						unsetOption(sourceOptions, 1, sourceOptions['default-unsetoptionlevel']);
					}*/
					

					// Test: strClass
					if(typeof(strClass) != "string" || strClass.lenght == 0){
						console.log("no string class");
						return sourceOptions;
					}

					// Test: namespace
					if (typeof(namespace) != "string" || namespace.lenght == 0) {
						
						// Try to get the default namespace
						if(sourceOptions['default-namespace'] && typeof(sourceOptions['default-namespace']) == "string"){
							namespace = sourceOptions['default-namespace'];
						} else {
							// This a not a valid namespace
							console.log("no namespace");
							return sourceOptions;
						}
					}
					
					// Get the namespace separator if defined (optional)
					var separatorNS = "";
					if(sourceOptions['default-namespace-separator'] && typeof(sourceOptions['default-namespace-separator']) == "string"){
						separatorNS = sourceOptions['default-namespace-separator'];
					} else {
						separatorNS = "-"; // Use the default
					}
					
					// Get the option separator if defined (optional)
					var separator = "";
					if(sourceOptions['default-separator'] && typeof(sourceOptions['default-separator']) == "string"){
						separator = sourceOptions['default-separator'];
					} else {
						separator = " "; // Use the default
					}
					
					// Check if the the Auto Json option creation are authorized from class
					var autoCreate = false;
					if(sourceOptions['default-autocreate']){
						 autoCreate = true;
					}
					

					
					var arrNamespace = namespace.split(separatorNS);
					

					var arrClass = strClass.split(separator); // Get each defined class
					$.each(arrClass, function(){
						
						// Get only the item larger than the namespace and remove the namespace
						if(namespace == (this.length > namespace.length+separatorNS.length ? this.slice(0, namespace.length): "")){
							// This is a valid parameter, start the convertion to a JSON object
							
							
							// Get all defined parameter
							var arrParameter = this.split(separatorNS).slice(arrNamespace.length);
							
							// That variable is use for synchronization
							var currObj = sourceOptions;
							
							// Set the default property name (this can be overwrited later)
							var propName = arrNamespace[arrNamespace.length - 1];
							
							
							for(i=0; i<arrParameter.length; i++){
								
								var valIsNext = (i+2 == arrParameter.length ? true: false);
								var isVal = (i+1 == arrParameter.length ? true: false);
								

								// console.log('propName:' + propName + ' value:' + arrParameter[i] + ' valIsNext:' + valIsNext + ' isVal:' + isVal);
								
								// Check if that is the default value and make a reset to the parameter name if applicable
								if(isVal && arrParameter.length == 1 && sourceOptions['default-option']){
									propName = sourceOptions['default-option'];
								} else if(!isVal) {
									propName = arrParameter[i];
								}
								
								
								
								
								// Get the type of the current option (if available)
								// (Note: an invalid value are defined by "undefined" value)
								
								// Check if the type are defined
								if(currObj[propName + '-typeof']){
									
									// Repair the value if needed
									var arrValue = [];
									for(j=(i+1); j<arrParameter.length; j++){
										arrValue.push(arrParameter[j]);
									}
									arrParameter[i] = arrValue.join(separatorNS);
									valIsNext = false;
									isVal = true;								
								
									switch(currObj[propName + '-typeof']){
										case "boolean":
											if(arrParameter[i] == "true" || arrParameter[i] == "1" || arrParameter[i] == "vrai" || arrParameter[i] == "yes" || arrParameter[i] == "oui"){
												arrParameter[i] = true;
											} else if(arrParameter[i] == "false" || arrParameter[i] == "0" || arrParameter[i] == "faux" || arrParameter[i] == "no" || arrParameter[i] == "non"){
												arrParameter[i] = false;
											} else {
												arrParameter[i] = undefined;
											}
											break;
										case "number":
											// console.log(arrParameter[i]);
											
											if(!isNaN(parseInt(arrParameter[i]))){
												arrParameter[i] = parseInt(arrParameter[i]);
											} else {
												arrParameter[i] = undefined;
											}
											break;
										case "string":
											break;
										case "undefined":
										case "function":
										case "locked":
											arrParameter[i] = undefined;
											break;
										default:
											// that include the case "object"
											break;
									}
								}
								

								
								
								// Get the type of overwritting, default are replacing the value
								var arrayOverwrite = false;
								if(currObj[propName + '-overwrite-array-mode']){
									arrayOverwrite = true;
								}
								
								// Check if this unique option can be autocreated
								var autoCreateMe = false;
								if(currObj[propName + '-autocreate']){
									autoCreateMe = true;
								}
								
								// console.log('After propName:' + propName + ' value:' + arrParameter[i] + ' valIsNext:' + valIsNext + ' isVal:' + isVal);
								
								
								if(valIsNext && arrParameter[i] !== undefined){
									// Keep the Property Name
									propName = arrParameter[i];
								} else if(isVal && arrParameter[i] !== undefined){
																	
									if(currObj[propName] && arrayOverwrite){
										// Already one object defined and array overwriting authorized
										if($.isArray(currObj[propName])){
											currObj[propName].push(arrParameter[i]);
										} else {
											var val = currObj[propName];
											currObj[propName] = [];
											currObj[propName].push(val);
											currObj[propName].push(arrParameter[i]);
										}
									} else if(currObj[propName] || autoCreate || autoCreateMe) {
										// Set the value by extending the options
										
										var jsonString = '';
										if(typeof(arrParameter[i]) == "boolean" || typeof(arrParameter[i]) == "number"){
											jsonString = '{\"' + propName + '\": ' + arrParameter[i] + '}';
										} else {
											jsonString = '{\"' + propName + '\": \"' + arrParameter[i] + '\"}';
										}
										currObj = jQuery.extend(true, currObj, jQuery.parseJSON(jsonString));
									}
									
									i = arrParameter.length; // Make sur we don't iterate again
								} else {
									// Create a sub object
									if(arrParameter[i] !== undefined && currObj[arrParameter[i]]){
										// The object or property already exist, just get the reference of it
										currObj = currObj[arrParameter[i]];
										propName = arrParameter[i];
									} else if((autoCreate || autoCreateMe) && arrParameter[i] !== undefined) {
										var jsonString = '{\"' + arrParameter[i] + '\": {}}';
										currObj = jQuery.extend(true, currObj, jQuery.parseJSON(jsonString));
										currObj = currObj[arrParameter[i]];
									} else {
										// This configuration are rejected
										i = arrParameter.length; // We don't iterate again
									}
								}
								
							}
								
								
							
						}
					});
					
					return sourceOptions;
				
				};
		
		
		//
		// Get All set of upto is required
		//
		$('.wet-boew-upto').each(function(){
		
			var wdtTemplate = this; // Assuming the widget are set on the patern container
		
		
			
			// Make sur it's hidden to the userAgent
			$(this).hide();
			$(this).attr('aria-hidden', true);
			
			// Get the css option
			var options = setClassOptions(o, ($(wdtTemplate).attr('class') != undefined ? $(wdtTemplate).attr('class') : ""));
			
			
			if(!options.groupdef){
				alert('A group definition must be defined');
				return; // A group definition must be defined
			}
			
			// Get the Patern
			var partern = $('[class^="' + o['default-namespace'] + '-pattern"]', wdtTemplate).eq(0); // Only the fist if subsequent exist
			
			var parternOptions = setClassOptions(o.partern, ($(partern).attr('class') != undefined ? $(partern).attr('class') : ""));
			
			
			//
			// Get the input list for the patern
			//
			var inputPaternLst = $('[class^="wb-upto-for"]', partern);
			
			var inputNameLst = [];
			
			$(inputPaternLst).each(function(){
				
				var inputOpts = setClassOptions(o.inputFor, $(this).attr('class'));
				
				inputNameLst.push(inputOpts['for']);
				
			});

			//
			// Get all potential groups
			//
			var groups = $('[class^="' + o['default-namespace'] + '-group-' + options.groupdef + '"]');
			
			// 
			// Valid the group with the partern (All the name into the partern must be defined into the input group)
			//
			
			
			function IsFilledGroup(currGroup, itmNumber){
				var result = false;
				for(i=0; i<inputNameLst.length; i++){
					
					var inputNameSearching = $(':input[name="' + inputNameLst[i] + itmNumber +'"]', currGroup);
					
					if(inputNameSearching.length == 0){
						console.log('Input not exist (name):' + inputNameLst[i] + groupOptions.itm);
						return undefined;
					}
					
					if($(inputNameSearching).val() != null && $(inputNameSearching).val() != ""){
						result = result || true;
					} else {
						result = result || false;
					}
				};
				return result;
			}
			
			var emptyGroup = [];
			var filledGroup = [];
			var groupTokenId = [];
			
			
			
			$(groups).each(function(){
				
				var currGroup = this;
				var groupAreInvalid = false;
				var isEmptyGroup = true;
				
				var groupOptions = setClassOptions(o.group, $(currGroup).attr('class'));
				
				// console.log($(currGroup).attr('class'));
				// console.log(groupOptions);
				
				// Check if he have a valid itm number
				if(!groupOptions.itm){
					groupAreInvalid = true;
					console.log('itm Not exist');
				}
				if(groupOptions.itm === undefined){
					groupAreInvalid = true;
					console.log('itm undefined');
				}
				if(parternOptions.start < groupOptions.itm && groupOptions.itm > parternOptions.end){
					groupAreInvalid = true;
					console.log('itm not in required range');
				}
				if($.inArray(groupOptions.itm, groupTokenId) != -1){
					groupAreInvalid = true;
					console.log('itm Already exist');
					console.log(groupOptions.itm);
					console.log(groupTokenId);
				}
				/*
				if(groupOptions.itm){
					if(parternOptions.start >= groupOptions.itm && groupOptions.itm <= parternOptions.end){
						if(!$.inArray(groupOptions.itm)){
							// Add the group to the token list
						}
						
					}
				
				}*/
				
				var isFilled = IsFilledGroup(currGroup, groupOptions.itm);
				
				if(isFilled == undefined){
					groupAreInvalid = true
				} else if (isFilled === true ){
					isEmptyGroup = false;
				}
				/*
				for(i=0; i<inputNameLst.length; i++){
					
					// :input
					// var inputNameSearching = $(currGroup).filter('[name="' + inputNameLst[i] + groupOptions.itm +'"]');
					// var inputIdSearching = $(currGroup).filter('[id="' + inputNameLst[i] + groupOptions.itm +'"]');

					// TODO:
					// Question: Force only the name attribute or keep the id as well ????
					
					var inputNameSearching = $(':input[name="' + inputNameLst[i] + groupOptions.itm +'"]', currGroup);
					// var inputIdSearching = $(':input[id="' + inputNameLst[i] + groupOptions.itm +'"]', currGroup);
					
					if(inputNameSearching.length == 0){ // && inputIdSearching.length == 0){
						groupAreInvalid = true;
						console.log('Input not exist (name):' + inputNameLst[i] + groupOptions.itm);
						break;
					}
					
					if($(inputNameSearching).val() != null && $(inputNameSearching).val() != ""){
						isEmptyGroup = false;
					}
					
				};*/
				
				if(!groupAreInvalid){
					groupTokenId.push(groupOptions.itm);
					
					if(isEmptyGroup){
						emptyGroup.push(currGroup);
					} else {
						filledGroup.push(currGroup);
					}
					// console.log('Groupid ' + groupOptions.itm + ' are valid');
				} else {
					console.log('Groupid ' + groupOptions.itm + ' are invalid');
				}
				
				
			});
			
			// console.log('Empty Group');
			// console.log(emptyGroup);
			// console.log('Filled Group');
			// console.log(filledGroup);
			
			// Hide every itm
			// $(emptyGroup).hide();
			// $(filledGroup).hide();
			
			var groupOnEdit = []; // List of group currently on Edit
			var groupOnWait = []; // List of group currently hidden but ready to be added to the interface
			var groupOnFill = []; // List of group currently Filled and ready to be Modified or Deleted
			
			var groupLst = [];
			
		
			var groupEleLst = [];
			
			//
			// Build the OnWait list
			//
			for(x in emptyGroup){
				var groupEle = emptyGroup[x];
				// Get the options
				var groupOpts = setClassOptions(o.group, $(groupEle).attr('class'));
				
				var obj = {
					options: groupOpts,
					ele: groupEle,
					id: groupOpts.itm,
					status: "empty" // Available "empty", "filled", "presented", "onedit"
				};
				
				groupOnWait.push(obj);
				groupLst.push(obj);
				groupEleLst.push(obj);
			}

			//
			// Build the OnFill list
			//
			for(x in filledGroup){
				var groupEle = filledGroup[x];
				// Get the options
				var groupOpts = setClassOptions(o.group, $(groupEle).attr('class'));
				
				var obj = {
					options: groupOpts,
					ele: groupEle,
					id: groupOpts.itm,
					status: "filled"
				};
				
				groupOnFill.push(obj);
				groupLst.push(obj);
				groupEleLst.push(obj);
			}
			
			
			var LastGroupElement = groupLst[groupLst.length-1];
			
			
			
			function updateGroupList(){

		
				var nbOfOnEdit = 0;
				var nbOfEmpty = 0;
				
				for(x in groupLst){
					var currGroup = groupLst[x];
					
					
					
					// Check any Empty currently Show
					// => Hide Them
					if(currGroup.status == "empty" && $(currGroup.ele).is(':visible')){
						$(currGroup.ele).hide();
					}
					
					// console.log(currGroup);
					
					if(currGroup.status == "empty"){
						nbOfEmpty ++;
					}
					
					// Transform any "filled" pending
					if(currGroup.status == "filled"){
						CreatePaternContext(currGroup); // Process the group inside the patern
					}
					
					if(currGroup.status == "onedit"){
						nbOfOnEdit ++;
					}
				}
				
				
				/*
				 *
				 * TODO, use an Option CSS to define this following behaviour
				 *
				 *
				// Add minimum one onedit Group
				if(nbOfOnEdit < 1){
					AddEmptyGroup();
				}
				*/
				
				// Re-evaluation the Add button if required
				addBtnActivation(nbOfEmpty);
				
				
			}
			
			// Add Button Link
			var btnAdd = $("<a />")
						.attr('href', 'javascript:;')
						.attr('role', 'button')
						.click(function(){
							var groupAdded = AddEmptyGroup(); // Add an empty group
							$(':focusable', groupAdded.ele).eq(0).focus(); // Set the focus to the first focusable elementFromPoint
						})
						.keydown(function(event){
							// if "Space key"
							if(event.keyCode == 32){
								var groupAdded = AddEmptyGroup(); // Add an empty group
								$(':focusable', groupAdded.ele).eq(0).focus(); // Set the focus to the first focusable elementFromPoint
							}
						});
			
			// $().prepend(btnAdd);
			
			$("[class^=" + o["default-namespace"] + "-addbtn]", $(wdtTemplate).parent()).eq(0).wrapInner(btnAdd).removeClass('cn-invisible').show().parent().removeClass('cn-invisible');
			
			
			//
			// Setup the Apply Button
			//
			for(x in groupLst){
				setUpApplyButton(groupLst[x]);
			}
			
			function setUpApplyButton(me){
				// var me = groupLst[x]; // this is for to be able to handle the apply event
				
				// Apply Button Link
				var btnApply = $("<a />")
							.attr('href', 'javascript:;')
							.attr('role', 'button')
							.click(function(){
								
								// Reevaluate the status of this current group
								if(IsFilledGroup(me.ele, me.id)){
									me.status = "filled";
								} else {
									me.status = "empty";
								}
								
								// Set focus to the next element 
								var focusableItms = $(':focusable');
								focusableItms.eq(focusableItms.index(this)+ 1 ).focus();
								
								// Update All of them
								updateGroupList();
							})
							.keydown(function(event){
								// if "Space key"
								if(event.keyCode == 32){
									// Reevaluate the status of this current group
									if(IsFilledGroup(me.ele, me.id)){
										me.status = "filled";
									} else {
										me.status = "empty";
									}
									
									// Set focus to the next element 
									var focusableItms = $(':focusable');
									focusableItms.eq(focusableItms.index(this)+ 1 ).focus();
									
									// Update All of them
									updateGroupList();
								}
							});
				
				// Enable the Apply button
				$("[class^=" + o["default-namespace"] + "-applybtn]", me.ele).eq(0).wrapInner(btnApply).removeClass('cn-invisible').show().parent().removeClass('cn-invisible');
			}
			
			// This function would add an empty group if requested
			function AddEmptyGroup(){
				var remainingEmptyGroup = 0;
				var groupAdded = [];
				
				for(x in groupLst){
					var currGroup = groupLst[x];
					if(currGroup.status == "empty"){
						remainingEmptyGroup ++;
						if(remainingEmptyGroup == 1){
							
							// Move the group At the end, just before the "Add Button Link"
							if(currGroup.id != LastGroupElement.id){
								$(LastGroupElement.ele).after(currGroup.ele);
								LastGroupElement = currGroup;
							}
							
							
							// Make this one to be added
							$(currGroup.ele).show();
							
							
							currGroup.status = "onedit";
							groupAdded = currGroup;
						}
					}
				}
				
				if(remainingEmptyGroup > 0){
					remainingEmptyGroup --;
				}
				addBtnActivation(remainingEmptyGroup);
				
				return groupAdded;
			}
			
			function addBtnActivation(nbEmptyGroup){
			
				// Check if the one added is the last one
				if(nbEmptyGroup == 0){
					// Hide the link btn
					$("[class^=" + o["default-namespace"] + "-addbtn]", $(wdtTemplate).parent()).eq(0).hide();
					
					// Show the limit reach message
					$("[class^=" + o["default-namespace"] + "-limitreach]", $(wdtTemplate).parent()).eq(0).show().removeClass('cn-invisible');
				} else {
					// Make sur the limit reach message are hidden and the add btn are show
					$("[class^=" + o["default-namespace"] + "-addbtn]", $(wdtTemplate).parent()).eq(0).show();
					
					$("[class^=" + o["default-namespace"] + "-limitreach]", $(wdtTemplate).parent()).eq(0).hide();
				}

			}
			
			
			function CreatePaternContext(currGroup){
			
			
			
				currGroup.status = "presented"; // Change the status
				$(currGroup.ele).hide(); // Hide the Edit zone
			
				// var groupOpts = setClassOptions(o.group, $(currGroup.ele).attr('class'));
				
				// Get a copy of the patern
				var parternCopy = $(partern).clone();
				
				currGroup.partern = parternCopy;
				
				// Remove any class set to the patern
				$(parternCopy).attr('class', '');
				$(parternCopy).addClass(o["default-namespace"]); // Add the namespace as default class
				
				
				// Fill the input zone by the input value
				$('[class^="wb-upto-for"]', parternCopy).each(function(){
					
					var inputOpts = setClassOptions(o.inputFor, $(this).attr('class'));
					// Get the associate input
					var inputNameSearching = $(':input[name="' + inputOpts['for'] + currGroup.id +'"]', currGroup.ele);
					
					$(this).text($(inputNameSearching).val());
				});
				
				// Add the partern before to the partern container element
				//$(wdtTemplate).before($(parternCopy));
				$(currGroup.ele).before($(parternCopy));
				
				//
				// Setup the "Modify" and "Delete" button into the patern
				//
				var btnModify = $("<a />")
								.attr('href', 'javascript:;')
								.attr('role', 'button')
								.click(function(){
									btnModifyClick(currGroup, parternCopy);
								})
								.keydown(function(event){
									// if "Space key"
									if(event.keyCode == 32){
										btnModifyClick(currGroup, parternCopy);
									}
								}),
					btnDelete = $("<a />")
								.attr('href', 'javascript:;')
								.attr('role', 'button')
								.click(function(){
									currGroup.status = "empty";

									// Set focus to the next element 
									var focusableItms = $(':focusable');
									focusableItms.eq(focusableItms.index(this)+ 1 ).focus();
									
									
									// Remove the Patern Object
									$(parternCopy).remove();
									
									// Set the input to empty
									$(':input', currGroup.ele).val('');
									
									// Re-evaluate the group itm
									updateGroupList();
									
								})
								.keydown(function(event){
									// if "Space key"
									if(event.keyCode == 32){
										currGroup.status = "empty";

										// Set focus to the next element 
										var focusableItms = $(':focusable');
										focusableItms.eq(focusableItms.index(this)+ 1 ).focus();
									
										// Remove the Patern Object
										$(parternCopy).remove();
										
										// Set the input to empty
										$(':input', currGroup.ele).val('');
										
										// Re-evaluate the group itm
										updateGroupList();
									}
									
								});
				
				// Wrap the content with the link button
				$("[class^=" + o["default-namespace"] + "-modify]", parternCopy).eq(0).wrapInner(btnModify);
				$("[class^=" + o["default-namespace"] + "-delete]", parternCopy).eq(0).wrapInner(btnDelete);
				
				
				//
				// Apply Partern Styling
				//
				$(parternCopy).hover(
					function(){
						
						$(this).addClass('onHover');
						// $(this).css('color', 'ligthblue');
					}, 
					function(){
						$(this).removeClass('onHover');
						// $(this).css('color', 'black');
					}
				);
				
				
				return parternCopy;
				
			}
			
			function btnModifyClick(currGroup, parternCopy){
				
				currGroup.status = "onedit";
				
				// replace the partern by the div with the input
				$(currGroup.ele).before($(parternCopy)).show();
				$(parternCopy).remove();
				
				// Set the focus to the first element
				$(':input', currGroup.ele).eq(0).focus();
				
				
				
				
				var me = currGroup; // this is for to be able to handle the apply event
				
				/*
				// Apply Button Link
				var btnApply = $("<a />")
							.attr('href', 'javascript:;')
							.attr('role', 'button')
							.click(function(){
								
								// Reevaluate the status of this current group
								if(IsFilledGroup(me.ele, me.id)){
									me.status = "filled";
								} else {
									me.status = "empty";
								}
								
								// Set focus to the next element 
								var focusableItms = $(':focusable');
								focusableItms.eq(focusableItms.index(this)+ 1 ).focus();
								
								// Update All of them
								updateGroupList();
							})
							.keydown(function(event){
								// if "Space key"
								if(event.keyCode == 32){
									// Reevaluate the status of this current group
									if(IsFilledGroup(me.ele, me.id)){
										me.status = "filled";
									} else {
										me.status = "empty";
									}
									
									// Set focus to the next element 
									var focusableItms = $(':focusable');
									focusableItms.eq(focusableItms.index(this)+ 1 ).focus();
									
									// Update All of them
									updateGroupList();
								}
							});
				
				// Enable the Apply button
				$("[class^=" + o["default-namespace"] + "-applybtn]", currGroup.ele).eq(0).wrapInner(btnApply).removeClass('cn-invisible').show().parent().removeClass('cn-invisible');
				*/
				
				/*
				 *
				 * TODO: Add a custom CSS Option Class to allow this type of interaction
				 * 		For now I will put this on suspend
				 *
				 ****
				
				
				// Bind all object for focus trigger, and if focus are out make an autoapply
				// this function can be problematic if the focusin event are used somewhere eles in the DOM
				$(':input').focusin(function(){
					// Check if the element have got focus are inside the modify zone
					if($(':focus', currGroup.ele).length == 0){
						// The focus are outside the context, change the content
						$(':input').unbind('focusin');
						
					
						// Reevaluate the status of this current group
						if(IsFilledGroup(currGroup.ele, currGroup.id)){
							currGroup.status = "filled";
							// CreatePaternContext(currGroup.ele);
							// $(currGroup.ele).hide();
						} else {
							currGroup.status = "empty";
						}
						
						// Update All of them
						updateGroupList();
						
					}
				});
				*/
			}
			
			updateGroupList();
			
			
		});		
		
	
		
	}
}

//Loads a library that the plugin depends on from the lib folder
// PE.load('raphael-min.js');
// PE.load('charts.jQuery.js');

// Init Call at Runtime
$("document").ready(function(){formupto.init();});

