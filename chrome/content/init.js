"use strict";
if(!galaxytoolbar) var galaxytoolbar={};
if(!galaxytoolbar.GTPlugin_init) galaxytoolbar.GTPlugin_init={};

window.addEventListener("load", function(){ galaxytoolbar.GTPlugin_init.init(); }, false);

galaxytoolbar.GTPlugin_init = {
	tracing_listener_active : new Array(),
	init: function() {
		galaxytoolbar.GTPlugin_general.Prefs = galaxytoolbar.GTPlugin_general.getPrefs();
		galaxytoolbar.GTPlugin_storage.initStorage();
		
		// check if an update is needed and run update
		galaxytoolbar.GTPlugin_general.update_check();
		
		// don't slow down Firefox at startup
		setTimeout(function() {galaxytoolbar.GTPlugin_storage.delete_old_espionage_entries();},500);

		try {
			window.addEventListener('DOMContentLoaded', function(e) { galaxytoolbar.GTPlugin_init.onPageDomLoadCont(e.originalTarget); }, true);
		} catch(e) {
			// alert("DOMContentLoad-error: "+e);
		}
	},

	onPageDomLoadCont: function(doc) {
		if (doc == null || doc.URL == null) return;
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var element;
		var general = galaxytoolbar.GTPlugin_general;
		try {
			var host = doc.location.host;
		} catch(e) {
			// Firefox 3.6 throws an exception instead of returning empty string for empty tabs
			return;
		}
		// get debugsettings
		general.Prefs = general.getPrefs();
		if (general.Prefs.prefHasUserValue("gtplugin.settings.debug")) {
			general.debug_mode = general.Prefs.getBoolPref("gtplugin.settings.debug");
		} else {
			general.debug_mode = false;
		}
		// do something with the loaded page.
		// doc.URL is the URL (see below for a link)
		try {
			// only execute on OGame pages
			if (host.indexOf(".ogame.") > -1) {
				//only execute ingame
				if (doc.URL.search("/game/index.php") > -1) {
					
					if (!galaxytoolbar.GTPlugin_storage.tool_exists_for_ogame_url(doc.URL)) 
						return;
					
					general.oGameVersionCheck(doc,general.getLocString("toolbar_name"),"https://addons.mozilla.org/en-US/addon/galaxytoolbar/versions");
					if ((doc.URL.search("page=statistics") > -1) ||
					 (doc.URL.search("page=highscore") > -1) ||
					 (doc.URL.search("page=messages") > -1) ||
					 (doc.URL.search("page=shipyard") > -1) ||
					 (doc.URL.search("page=resources") > -1) ||
					 (doc.URL.search("page=station") > -1) ||
					 (doc.URL.search("page=defense") > -1) ||
					 (doc.URL.search("page=research") > -1) ||
					 (doc.URL.search("page=overview") > -1) ||
					 (doc.URL.search("page=empire") > -1) ||
					 (doc.URL.search("page=alliance") > -1) ||
					 (doc.URL.search("page=galaxy") > -1)) {
						
						this.update_summer_wintertime(doc);
					}
					
					if (doc.getElementById("eventboxContent") != null) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"fmovement")) {
							element = doc.getElementById('eventboxContent');
							if (MutationObserver) {
								var observer2 = new MutationObserver(
									function(mutations){ 
										mutations.forEach(function(mutation) {
											var nodes = mutation.addedNodes;
											for (var i = 0; i < nodes.length; i++) {
												if (nodes[i].nodeType == 1) {
													if (nodes[i].hasAttribute("id"))
														if (nodes[i].getAttribute("id") == "eventListWrap") {
															galaxytoolbar.GTPlugin_init.add_send_fleet_movements_button(doc);
															galaxytoolbar.GTPlugin_fleet_movement.save_fleet_contents(doc);
															if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
																galaxytoolbar.GTPlugin_fleet_movement.send_fleet_movements_ogeneral_only("",doc,false);
															}
															return;
														}
												}
											}
										});
									});
								observer2.observe(element, { childList: true });
							} else {
								element.addEventListener("DOMNodeInserted", function(e){
									if (e.target.innerHTML == undefined) return;
									if (e.target.innerHTML.trim() == "") return;
									if (e.target.innerHTML.indexOf('id="eventHeader"') == -1) return;
									galaxytoolbar.GTPlugin_init.add_send_fleet_movements_button(doc);
									galaxytoolbar.GTPlugin_fleet_movement.save_fleet_contents(doc);
									if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
										galaxytoolbar.GTPlugin_fleet_movement.send_fleet_movements_ogeneral_only(e,doc,true);
									}
								}, false );
							}
							if (doc.getElementById("eventHeader") != null) {
								galaxytoolbar.GTPlugin_init.add_send_fleet_movements_button(doc);
								galaxytoolbar.GTPlugin_fleet_movement.save_fleet_contents(doc);
								if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
									galaxytoolbar.GTPlugin_fleet_movement.send_fleet_movements_ogeneral_only("",doc,false);
								}
							}
						}
					}
										
					// new with V6: inject script code into the page that can then interact with our extension via window.postMessage()
					var script = doc.createElement("script");
					script.type = "text/javascript";
					script.innerHTML  = '(function(open) { ' +
					'	XMLHttpRequest.prototype.open = function(method, url, async, user, pass) { ' +
					'		this.addEventListener("readystatechange", function() { ' +
					'			if (this.readyState == 4) { ' +
					'				if (this.status == 200) { ' +
					'					window.postMessage({'+
					'						direction: "from-ogame-page",'+
					'						url: this.responseURL,'+
					'						responseText: this.responseText'+
					'					}, "*");'+
					'				} ' +
					'			} ' +
					'		}, false); ' +
					'		open.call(this, method, url, async, user, pass); ' +
					'	}; ' +
					'})(XMLHttpRequest.prototype.open);';
					doc.head.appendChild(script);
					
					// now that we registered the message sender, register the receiver
					var OgameDomain = doc.domain; 
					window.addEventListener("message", function(event) {
					  if (event.origin.indexOf("://" + OgameDomain) > -1 && // only accept messages from the OGame Window
						  event.data.direction &&
						  event.data.direction == "from-ogame-page") {
							  
							if( Components.utils.isDeadWrapper(doc)) { 
								// This check has been introduced in Firefox because sometimes DOC is a "dead object" and this should usually not happen as we stay in the context of 
								// the page for the whole time. But to avoid any errors, we skip the message if we cannot return any results to the user as the doc is broken.
								return; 
							}

							// http://s680-en.ogame.gameforge.com/game/index.php?page=messages&messageId=120141&tabid=21&ajax=1
							var message_id = event.data.url.match(/messageId=(\d+)/);
							if (!message_id && event.data.url.indexOf("page=messages") > -1) {
								// sometimes OGame is sending POST requests - grab it from response message then
								message_id = event.data.responseText.match(/data-msg-id="(\d+)"/);
							}
							
							if (message_id && message_id.length) {
								message_id = message_id[1]; // take over the id
								// OGame requested to display a message
								// check for combat report
								var combat_start = event.data.responseText.indexOf("ogame.messages.combatreport.loadData(");
								if (doc && combat_start >  -1) {
									galaxytoolbar.GTPlugin_messages.submit_v6_combat_report(doc, message_id, event.data.responseText);
								}
								// check for espionage report
								var espionage_start = event.data.url.indexOf("tabid=20&");
								if (espionage_start === -1 && event.data.url.indexOf("tab=20&") === -1) {
									espionage_start = event.data.responseText.indexOf("<input value='sr-"); // API key starts with sr- for standard reports; there is no other good content inside the HTML
								}
								if (doc && espionage_start >  -1) {
									var dom_content = document.implementation.createHTMLDocument("ParseOGameResponse"); // Firefox cannot directly assign the responseText to innerHTML of a DIV like Chrome
									dom_content.documentElement.innerHTML = event.data.responseText;
									
									galaxytoolbar.GTPlugin_messages.submit_v6_reports_data(doc, dom_content, message_id);
								}
								// check for foreign espionage actions
								if (event.data.url.indexOf("tab=20&") > -1) {
									var dom_content = document.implementation.createHTMLDocument("ParseOGameResponse"); // Firefox cannot directly assign the responseText to innerHTML of a DIV like Chrome
									dom_content.documentElement.innerHTML = event.data.responseText;
									galaxytoolbar.GTPlugin_messages.parse_espionage_activities_V6(doc, dom_content);
								}
							}
							
							if (event.data.url.indexOf("page=ajaxChat") > -1) {
								// response is a JSON object
								var oResponse = JSON.parse(event.data.responseText);
								// the JSON response contains the complete messages and an HTML fragment with al messages etc. to display
								// the JSON message content is WRONG as it always shows the same playername :-(
								// so we have to use the HTML fragment
								var dom_content = document.implementation.createHTMLDocument("ParseOGameResponse"); // Firefox cannot directly assign the responseText to innerHTML of a DIV like Chrome
								if (oResponse.data) {
									// single player chatbox
									dom_content.documentElement.innerHTML = oResponse.data; 
									galaxytoolbar.GTPlugin_messages.submit_single_player_chatbox(doc, dom_content);
								} else if (oResponse.content) {
									// since ogame 6.1.6 the online chatbox with all users is also a XHR request
									dom_content.documentElement.innerHTML = oResponse.content; 
									galaxytoolbar.GTPlugin_messages.submit_player_messages_and_activities(doc, dom_content);
								}
							}
					  }
					}, true, true);

					/* Chat works now only via ajax requests....
					// chatbar active? -> fetch messages and activities
					// TODO: how to catch messages that get added when the page was already loaded?
					if (doc.getElementById("chatBar")) {
						// no longer called since Ogame 6.1.6
						galaxytoolbar.GTPlugin_messages.submit_player_messages_and_activities(doc);
					}	
					*/					

					//window.content.wrappedJSObject.$
					if (doc.URL.search("page=galaxy") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"galaxy")) {
							
							element = doc.getElementById('galaxyContent');
							if (MutationObserver) {
								var observer = new MutationObserver(function(m){ galaxytoolbar.GTPlugin_galaxyview.submit_galaxydata_mutation_handler(m,doc); });
								observer.observe(element, { childList: true });
							} else {
								element.addEventListener("DOMNodeInserted", 
									function(e){ 
										try {
											//added the check here, just to avoid multiple, unnecessary updates of the Messagedoc
											var id = e.relatedNode.getAttribute("id");
											if (id != "galaxyContent") {
												return;
											}
											galaxytoolbar.GTPlugin_galaxyview.submit_galaxydata_event_handler(e,doc); 
										} catch (e) {
											return;
										} 
									}, 
									false);
							}
						}
						
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"phalanx")) {
							// perform only, if we have no listener active
							if (this.tracing_listener_active[host] == 0 || this.tracing_listener_active[host] == undefined) {
								var httpRequestObserver = {
									observe: function(subject, topic, data) {
										if (topic == "http-on-examine-response") {
											subject.QueryInterface(Components.interfaces.nsIHttpChannel);
											// only parse successful requests to the phalanx page of the currently watched page
											if (subject.responseStatus == 200
												&& subject.URI.spec.indexOf("page=phalanx") > -1 
												&& subject.URI.host.indexOf(host) > -1) {
												var newListener = new GalaxytoolbarPhalanxTracingListener();
												subject.QueryInterface(Ci.nsITraceableChannel);
												newListener.originalListener = subject.setNewListener(newListener);
											}
										}
									},
									
									QueryInterface : function (aIID) {
										if (aIID.equals(Ci.nsIObserver) ||
											aIID.equals(Ci.nsISupports)) {
												return this;
										}
									
										throw Components.results.NS_NOINTERFACE;
									}
								};
								
								
								var observerService = Components.classes["@mozilla.org/observer-service;1"]
														.getService(Components.interfaces.nsIObserverService);
								observerService.addObserver(httpRequestObserver, "http-on-examine-response", false);
								
								this.tracing_listener_active[host] = 1;
								
								var remove_obs = function(e) {
									try {
										// remove only in case we are on the page and the just closed page is the last one
										if (e.target.location.host == host && e.target.URL.indexOf("page=galaxy") 
												&& galaxytoolbar.GTPlugin_init.tracing_listener_active[host] <= 1) {
											
											try {
												observerService.removeObserver(httpRequestObserver, "http-on-examine-response");
											} catch (e) {
												//https://bugzilla.mozilla.org/show_bug.cgi?id=310955
											}
											galaxytoolbar.GTPlugin_init.tracing_listener_active[host]--;
											// clean up after itself
											window.removeEventListener("pagehide",remove_obs,true);
										} else if (e.target.location.host == host && e.target.URL.indexOf("page=galaxy")) {
											// otherwise reduce the number of open galaxy pages for this host
											galaxytoolbar.GTPlugin_init.tracing_listener_active[host]--;
										}
									} catch(e) {}
								};
								//clean-up after the galaxy page was left
								window.addEventListener("pagehide",remove_obs,true);
							} else {
								// another galaxy page was opened
								this.tracing_listener_active[host]++;
							}
							
							// this will fire after the response has been received,
							// so after we have parsed the incoming arrival times in the script section (which becomes invisible for us, even if we'd listen to DOMNodeInserted)
							element = doc.body;
							if (MutationObserver) {
								var observer = new MutationObserver(
										function(m) {
											galaxytoolbar.GTPlugin_fleet_movement.phalanx_reports_mutation_handler(m,doc);
										});
								observer.observe(element, { childList: true });
							} else {
								element.addEventListener("DOMNodeInserted",
									function(e) {
										galaxytoolbar.GTPlugin_fleet_movement.phalanx_reports_event_handler(e,doc);
									}, false );
							}
						}
						
						return;
					}
					
					//enable this Code as soon as we want to deliver this feature
					/*if (doc.URL.search("page=traderOverview") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"auctioneer")) {
							galaxytoolbar.GTPlugin_auctioneer.oldBids[doc.location.host] = undefined;
							element = doc.getElementById('inhalt');
							if (MutationObserver) {
								var observer = new MutationObserver(function(m){ galaxytoolbar.GTPlugin_auctioneer.found_auctioneer_sub_page_mutation_handler(m,doc); });
								observer.observe(element, { childList: true });
							} else {
								doc.getElementById('inhalt').addEventListener("DOMNodeInserted", galaxytoolbar.GTPlugin_auctioneer.found_auctioneer_sub_page,true);
							}
						}
						return;
					}*/
					
					// Allyhistory
					if (doc.URL.search("page=alliance") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"allypage")) {
							element = doc.getElementById('eins');
							if (MutationObserver) {
								var observer = new MutationObserver(function(m){ galaxytoolbar.GTPlugin_allypage.submit_allydata_mutation_handler(m,doc); });
								observer.observe(element, { childList: true });
							} else {
								element.addEventListener("DOMNodeInserted", function(e){ galaxytoolbar.GTPlugin_allypage.submit_allydata_event_handler(e,doc); }, false );
							}
						}
						return;
					}
					
					// Empire view
					if (doc.URL.search("page=empire") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"empire")) {
							element = doc.getElementById('mainWrapper');
							
							if (MutationObserver) {
								var observer = new MutationObserver(function(m){ galaxytoolbar.GTPlugin_empire.submit_empiredata_mutation_handler(m,doc); });
								observer.observe(element, { childList: true });
							} else {
								element.addEventListener("DOMNodeInserted", function(e){ galaxytoolbar.GTPlugin_empire.submit_empiredata_event_handler(e, doc, true); }, false );
							}
							
						if (doc.getElementById("empireTab")) {
								galaxytoolbar.GTPlugin_empire.submit_empiredata(doc);
							}
						}
						return;
					}
					
					//messageContent
					// overall message view - reports can be part of it, but also combat reports etc. since OGame V6
					if (doc.URL.search("page=messages") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"reports")) {
							element = doc.getElementById('messages');
													
							if (MutationObserver) {
								var observer = new MutationObserver(function(m){ if (galaxytoolbar.GTPlugin_messages) galaxytoolbar.GTPlugin_messages.parseMessages_V6(m,doc); });
								observer.observe(element, { childList: true, subtree: true });
							} // no else - Chrome supports it anyway and FF since version 14
							return;
						}
					}
				
					if (doc.URL.search("page=overview") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
							galaxytoolbar.GTPlugin_planet_data.get_overview_data(doc);
						}
						return;
					}
					
					// OGame 3.0.0 Highscores
					if (doc.URL.search("page=highscore") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"stats")) {
							if (doc.getElementById("ranks") != null) {
								galaxytoolbar.GTPlugin_highscore.submit_highscoredata(doc);
							}
							
							element = doc.getElementById('stat_list_content');
							if (MutationObserver) {
								var observer = new MutationObserver(function(m){ galaxytoolbar.GTPlugin_highscore.submit_highscoredata_mutation_handler(m,doc); });
								observer.observe(element, { childList: true });
							} else {
								element.addEventListener("DOMNodeInserted", function(e){ galaxytoolbar.GTPlugin_highscore.submit_highscoredata_event_handler(e,doc,true); }, false );
							}
						}
						return;
					}
					
					// single message view (iframe) - reports
					if (doc.URL.search("page=showmessage") > -1) { // TODO: no longer there with OGame V6
						// in fact, a link to an espionage action should have "cat=4" in its link
						// but there is an OGame bug:
						// when going into such a message, the cat-number is correct, but if I click on "previous" or "next"
						// message, the cat-number stays, no matter what kind of message it is. 
						// besides, espionage actions don't have their own cat-number
						var res = galaxytoolbar.GTPlugin_messages.parse_Messages(doc);
						
						// add defenders coords/techs to crs
						if (doc.getElementById("battlereport") != null) {
							if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
								/**
								 * Note: this code reads the onclick attribute of OGame (which will open the detailed combat report)
								 * and add some more information from the combat report overview to it
								 * after that, it is written back
								 */
								var coords = doc.getElementById("battlereport").getElementsByTagName("a")[0].innerHTML.trim();
								var link = doc.getElementById("shortreport").getElementsByTagName("a")[doc.getElementById("shortreport").getElementsByTagName("a").length-1];
								
								// read the onclick attribute from OGame
								var onc = link.getAttribute("onclick").split("',");
								onc[0] += "&def_coords="+coords;
								
								// add defenders techs only in case it is no acs defend to the onclick attribute value
								var defenders = doc.getElementById("combatants").getElementsByTagName("div")[2].getElementsByTagName("a");
								if (defenders.length == 1) {
									var shortreport = doc.getElementById("shortreport").getElementsByTagName("tr");
									onc[0]+= "&def_weapon="+parseInt(shortreport[2].getElementsByTagName("td")[4].innerHTML.match(/(\d+)/)[1]);
									onc[0]+= "&def_shield="+parseInt(shortreport[3].getElementsByTagName("td")[4].innerHTML.match(/(\d+)/)[1]);
									onc[0]+= "&def_armour="+parseInt(shortreport[4].getElementsByTagName("td")[4].innerHTML.match(/(\d+)/)[1]);
								}
								
								// add repaired defense
								var line = doc.getElementById("shortreport").getElementsByClassName("summary")[0].
															getElementsByTagName("tr")[3].getElementsByTagName("td")[1].innerHTML;
								var string = galaxytoolbar.GTPlugin_combat_reports.parse_repaired(doc,line);
								
								onc[0] += string;
								
								onc = onc.join("',");
								// set the onclick attribute with adjusted URL, so that we have more information available in the pop-up window (of OGame),
								//  which will be opened when the users clicks on the link
								link.setAttribute("onclick",onc);
							}
						}
						
						if (!res && galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"reports")) {
							galaxytoolbar.GTPlugin_messages.findSingleReport(doc);
						}
						
						return;
					}
					
					var tmp;
					// fleet
					if (doc.URL.search("page=fleet1") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"fleet")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, general.getLocString("fleetpagefound"),"All Galaxytools");
							if (doc.getElementById("warning") != null) {
								general.set_status(doc, "galaxyplugin"+1 , 2, general.getLocString("fleetpagenofleet"),"All Galaxytools");
							} else {
								tmp = galaxytoolbar.GTPlugin_planet_data.getData(doc,["military","civil"],1); // civil = ID to look for
								//alert(data2_xml);
								if (tmp != "") {
									general.send(doc,"fleet",tmp,doc.URL);
							} else {
									general.set_status(doc, "galaxyplugin"+1 , 3, general.getLocString("nodatafound"),"All Galaxytools");	
								}
							}
						}
						return;
					}
					
					// shipyard
					if (doc.URL.search("page=shipyard") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"shipyard")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, general.getLocString("shipyardfound"),"All Galaxytools");
							tmp = galaxytoolbar.GTPlugin_planet_data.getData(doc,["military","civil"],2); // civil = ID to look for
							//alert(data2_xml);
							if (tmp != "") {
								general.send(doc,"shipyard",tmp,doc.URL);
							} else {
								general.set_status(doc, "galaxyplugin"+1 , 3, general.getLocString("nodatafound"),"All Galaxytools");
							}
						}
						
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
							galaxytoolbar.GTPlugin_planet_data.get_fleet_queue_only(doc);
						}
						return;
					}
					
					// resources buildings
					if (doc.URL.search("page=resources") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"buildings")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, general.getLocString("buildingpagefound"),"All Galaxytools");
							tmp = galaxytoolbar.GTPlugin_planet_data.getData(doc,["building","storage"],2); // storage = ID to look for
							if (tmp != "") {
								general.send(doc,"buildings",tmp,doc.URL);
							} else {
								general.set_status(doc, "galaxyplugin"+1 , 3, general.getLocString("nodatafound"),"All Galaxytools");
							}
						}
						
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
							var xml = galaxytoolbar.GTPlugin_planet_data.get_planetinfo_header(doc);
							xml += galaxytoolbar.GTPlugin_planet_data.get_building_queue_only(doc);
							xml += galaxytoolbar.GTPlugin_planet_data.get_fleet_queue_from_building_pages(doc,1);
							xml += "\t</planetinfo>\n";
							general.send(doc,"queue",xml,doc.URL);
						}
						return;
					}
					
					// facilities
					if (doc.URL.search("page=station") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"buildings")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, general.getLocString("buildingpagefound"),"All Galaxytools");
							tmp = galaxytoolbar.GTPlugin_planet_data.getData(doc,["stationbuilding"],2); // stationbuilding = ID to look for
							//alert(data_xml);
							if (tmp != "") {
								general.send(doc,"buildings",tmp,doc.URL);
							} else {
								general.set_status(doc, "galaxyplugin"+1 , 3, general.getLocString("nodatafound"),"All Galaxytools");
							}
							
							if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
								var xml = galaxytoolbar.GTPlugin_planet_data.get_planetinfo_header(doc);
								xml += galaxytoolbar.GTPlugin_planet_data.get_building_queue_only(doc);
								xml += "\t</planetinfo>\n";
								general.send(doc,"queue",xml,doc.URL);
							}
						}
						return;
					}
					
					// defense
					if (doc.URL.search("page=defense") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"defense")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, general.getLocString("defensepagefound"),"All Galaxytools");
							tmp = galaxytoolbar.GTPlugin_planet_data.getData(doc,["defensebuilding"],2);
							//alert(data_xml);
							if (tmp != "") {
								general.send(doc,"defense",tmp,doc.URL);
							} else {
								general.set_status(doc, "galaxyplugin"+1 , 3, general.getLocString("nodatafound"),"All Galaxytools");
							}
							
							
						}
						
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
							galaxytoolbar.GTPlugin_planet_data.get_fleet_queue_only(doc);
						}
						return;
					}
					
					// research
					if (doc.URL.search("page=research") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"research")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, general.getLocString("techpagefound"),"All Galaxytools");
							
							tmp = galaxytoolbar.GTPlugin_planet_data.getData(doc,["base1","base2","base3","base4"],2);
							
							if (tmp != "") {
								general.send(doc,"techs",tmp,doc.URL);
							} else {
								general.set_status(doc, "galaxyplugin"+1 , 3, general.getLocString("nodatafound"),"All Galaxytools");
							}
							
							if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
								var xml = galaxytoolbar.GTPlugin_planet_data.get_planetinfo_header(doc);
								xml += galaxytoolbar.GTPlugin_planet_data.get_active_research(doc);
								xml += "\t</planetinfo>\n";
								general.send(doc,"queue",xml,doc.URL);
							}
						}
						return;
					}
					
					if (doc.URL.search("page=resourceSettings") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
							general.set_status(doc, "galaxyplugin"+1 , 0, "Resource settings found","All Galaxytools");
							var xml = galaxytoolbar.GTPlugin_planet_data.get_planetinfo_header(doc);
							xml += galaxytoolbar.GTPlugin_planet_data.get_resourceSettings(doc);
							xml += "\t</planetinfo>\n";
							general.send(doc,"resourceSettings",xml,doc.URL);
						}
					}
					
					// read all Techs
					if (doc.URL.search("page=globalTechtree") > -1 || doc.URL.search("page=techtree&tab=3") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"reports")) {
							galaxytoolbar.GTPlugin_techtreeparser.parse_techtree(doc,doc);
						}
						return;
					}
					
					// send full crs, just to ogeneral
					if (doc.URL.search("page=combatreport") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"ogeneral")) {
							galaxytoolbar.GTPlugin_combat_reports.submit_complete_cr(doc);
						}
						return;
					}
					
					// save the activity you are causing on your own (e.g. by attacking a planet)
					if (doc.URL.search("page=movement") > -1) {
						if (galaxytoolbar.GTPlugin_storage.target_tool_exists(doc.URL,"galaxy")) {
							galaxytoolbar.GTPlugin_messages.save_own_activities(doc);
						}
						return;
					}
					
					// decomment to get an alert of all translations for our probes_files when visiting the settings
					/*if (doc.URL.search("page=preferences") > -1) {
						var resources_names = galaxytoolbar.GTPlugin_planet_data.get_resources_names(doc);
						galaxytoolbar.GTPlugin_techtreeparser.get_language_file(doc.URL,resources_names);
						//galaxytoolbar.GTPlugin_techtreeparser.get_androgame_language_file(doc.URL,null);
						return;
					}*/
				}
			}
			
			try {
				// display button on Galaxytool page in order to copy the tool specific settings into a new profile
				if (doc.URL.search("/secret/") > -1) {
					if (doc.getElementById("G-71bfcce7-421d-4042-95d4-a585a821cbca") != null) {
						var info_pane = doc.getElementById("toolbarInfos");
						if (info_pane != null) {
							var el = doc.createElement("input");
							
							el.setAttribute("type",'button');
							el.setAttribute("class",'button');
							el.setAttribute("value",general.getLocString("addsettingstotoolbar"));
							
							info_pane.getElementsByTagName("td")[info_pane.getElementsByTagName("td").length-1].appendChild(el);
							el.addEventListener("click",function(e) {
								var plugin_url = doc.getElementById("plugin_url").innerHTML.trim();
								var plugin_token = doc.getElementById("plugin_token").innerHTML.trim();
								var tool_version = doc.getElementById("galaxytool-version").innerHTML.match(/v(\d+).(\d+).?(\d+)?/);
								
								var tool_version_major = parseInt(tool_version[1]);
								var tool_version_minor = parseInt(tool_version[2]);
								var tool_version_revision = tool_version[3] != undefined ? parseInt(tool_version[3]) : 0;
								if (plugin_token.match(/^[0-9a-f]{32}$/i) != null && /^https{0,1}:\/\/.+\.php$/.test(plugin_url)) {
									var win = galaxytoolbar.GTPlugin_general.get_options_window();
									if (win == null) {
										galaxytoolbar.GTPlugin_general.openOptionsDialog(true,plugin_url,plugin_token,tool_version_major,tool_version_minor,tool_version_revision);
									} else {
										win.focus();
										win.wrappedJSObject.galaxytoolbar.GTPlugin_options2.add_settings(plugin_url,plugin_token,tool_version_major,tool_version_minor,tool_version_revision);
									} 
								} else {
									alert("No token created yet or Galaxytool URL invalid!");
								}
							},false);
							
							// add information on the current AddOn version - independent of AMO
							var httpRequest = new XMLHttpRequest();
							httpRequest.onload = function add_current_version_and_compare(){
								try {
									if (httpRequest.status != 200)
										return 0;
									
									// the requested file should contain the version only
									if (httpRequest.responseText.length > 20)
										return 0;
									
									var version = httpRequest.responseText.split(".").map(function(n) {return parseInt(n,10);});
									// the version must contain at least 3 values
									if (version.length < 3)
										return 0;
									
									var my_version = galaxytoolbar.GTPlugin_general.version.split(".").map(function(n) {return parseInt(n,10);});
									
									var el_ = doc.createElement("span");
									
									if (!galaxytoolbar.GTPlugin_general.compare_versions(my_version[0],my_version[1],my_version[2],version[0],version[1],version[2])) {
										el_.setAttribute("style",'color:red');
									} else {
										el_.setAttribute("style",'color:lightgreen');
									}
									
									
									el_.appendChild(doc.createTextNode(galaxytoolbar.GTPlugin_general.version));
									
									info_pane.getElementsByTagName("tr")[2].getElementsByTagName("td")[1].appendChild(doc.createTextNode(" ("));
									info_pane.getElementsByTagName("tr")[2].getElementsByTagName("td")[1].appendChild(el_);
									info_pane.getElementsByTagName("tr")[2].getElementsByTagName("td")[1].appendChild(doc.createTextNode(" / "+version.join(".")+")"));
								} catch (err) {
									general.log_to_console(err);
								}
							};
							httpRequest.open("GET", "http://galaxytool.eu/galaxytoolbar_version.txt", true);
							// do not use the cached version - it could have changed in the meantime
							httpRequest.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
							httpRequest.send(null);
						}
					}
					
				}
			} catch (e) {
				general.log_to_console(e);
			}
		} catch(error) {
			// nothing to do
			general.log_to_console("error at initialization: "+error);
		}
	},
	
	update_summer_wintertime: function(doc) {
		var script = galaxytoolbar.GTPlugin_general.get_script_of_page(doc);
		var pos = script.indexOf("startServerTime");
		if (pos > -1) {
			var tmp = script.substring(pos,pos+100);
			
			var match = tmp.match(/\((-{0,1}\d+)\)/);
			if (match[1]) {
				galaxytoolbar.GTPlugin_general.is_summertime[doc.location.host] = parseInt(match[1]);
			} else {
				galaxytoolbar.GTPlugin_general.is_summertime[doc.location.host] = 0;
			}
		}
	},
	
	add_send_reports_button: function(doc) {
		var p = doc.getElementById("tabs-nfFavorites").firstChild;  // better placement possible within LI Tags but no longer needed with Ogame V6
		
		var a = doc.createElement("a");
		
		a.setAttribute("class","tooltipHTML");
		
		a.setAttribute("title",galaxytoolbar.GTPlugin_general.getLocString("toolbar_name")+"|"+galaxytoolbar.GTPlugin_general.getLocString("submit_espionage_msg"));
		
		a.setAttribute("style","float:right; margin-right:50px; margin-top: 2px; cursor:pointer;");
		
		a.setAttribute("href","javascript:void(0);");
		
		var img = doc.createElement("img");
		
		img.setAttribute("src","chrome://galaxyplugin/skin/images/send_to_galaxytool.png");
		
		a.appendChild(img);
		
		a.addEventListener("click",function(e) {
			galaxytoolbar.GTPlugin_messages.findMultipleReport(doc,true);
		},false);
		p.parentNode.insertBefore(a,p);
	},
	
	add_send_fleet_movements_button: function(doc) {
		var p = doc.getElementById("eventHeader").firstChild;
		
		var a = doc.createElement("a");
		
		a.setAttribute("class","tooltipHTML");
		
		a.setAttribute("title",galaxytoolbar.GTPlugin_general.getLocString("toolbar_name")+"|"+galaxytoolbar.GTPlugin_general.getLocString("submit_fmovments"));
		
		a.setAttribute("style","float:left; margin-left:30px; margin-top: 7px; cursor:pointer;");
		
		a.setAttribute("href","javascript:void(0);");
		
		var img = doc.createElement("img");
		
		img.setAttribute("src","chrome://galaxyplugin/skin/images/send_to_galaxytool_small.png");
		
		a.appendChild(img);
		
		a.addEventListener("click",function(e) {
			galaxytoolbar.GTPlugin_fleet_movement.get_fleet_data_210(doc,false);
		},false);
		p.parentNode.insertBefore(a,p);
	}
};
