"use strict";
if(!galaxytoolbar) var galaxytoolbar={};
if(!galaxytoolbar.GTPlugin_options2) galaxytoolbar.GTPlugin_options2={};

galaxytoolbar.GTPlugin_options2={
	// new functions for new galaxytool options layout
	selected_tool: null,
	tools:		new Array(),
	do_not_set_fields : false,
	dont_update : false,
	general_settings_updated: false,
	request_id : 0,
	
	initWindow: function() {
		galaxytoolbar.GTPlugin_storage.initStorage();
		this.loadValues();
		
		if (window.arguments != undefined) {
			if (window.arguments.length > 0) {
				if (window.arguments[0]) {
					this.add_settings(window.arguments[1],window.arguments[2],window.arguments[3],window.arguments[4],window.arguments[5]);
					return;
				}
			}
		}
		
		if (this.tools.length == 0) {
			this.add_new_tool();
		} else {
			// select first one
			this.selected_tool = 0;
			this.set_userdata();
		}
	},
	
	add_settings: function(plugin_url,plugin_token,tool_version_major,tool_version_minor,tool_version_revision) {
		//switch to options tab
		document.getElementById("tabs").selectedIndex = 1;
		var indexes = this.get_indexes_of_tool(plugin_url);
		if (indexes.length == 0) {
			this.add_new_tool(plugin_url,plugin_token,tool_version_major,tool_version_minor,tool_version_revision);
		} else {
			for (var i = 0; i < indexes.length; i++) {
				this.selected_tool = indexes[i];
				this.tools[indexes[i]]["tool_token"] = plugin_token;
				this.tools[indexes[i]]["tool_version_major"] = tool_version_major;
				this.tools[indexes[i]]["tool_version_minor"] = tool_version_minor;
				this.tools[indexes[i]]["tool_version_revision"] = tool_version_revision;
				this.tools[indexes[i]]["updated"] = true;
				this.set_userdata();
			}
		}
		return;
	},
	
	copy_userdata: function() {
		try {
			if (this.selected_tool == null) {
				// we did not have a tool selected yet
				return;
			}
			
			// copy previous values into array that shall be saved later on
			// textfields
			this.tools[this.selected_tool]["name"]			= document.getElementById("GTPlugin-name").value;
			this.tools[this.selected_tool]["ogame_url"]		= document.getElementById("GTPlugin-ogameurl").value.trim();
			document.getElementById("GTPlugin-ogameurl").value = this.tools[this.selected_tool]["ogame_url"];
			this.tools[this.selected_tool]["tool_url"]		= document.getElementById("GTPlugin-url").value.trim();
			document.getElementById("GTPlugin-url").value	= this.tools[this.selected_tool]["tool_url"];
			this.tools[this.selected_tool]["tool_user"]		= document.getElementById("GTPlugin-username").value;
			this.tools[this.selected_tool]["tool_password"]	= document.getElementById("GTPlugin-password").value;
			this.tools[this.selected_tool]["tool_token"]	= document.getElementById("GTPlugin-token").value;
			
			this.tools[this.selected_tool]["is_ogeneral"]	=document.getElementById("GTPlugin-isogeneral").checked;
			var ip = document.getElementById("GTPlugin-ogeneralip").value.trim();
			var ip_cont = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
			this.tools[this.selected_tool]["ogeneral_ip"]	= ip_cont != null && ip_cont[1] < 256 && ip_cont[2] < 256 && ip_cont[3] < 256 && ip_cont[4] < 256 ? ip : "127.0.0.1";
			
			var port = parseInt(document.getElementById("GTPlugin-ogeneralport").value);
			this.tools[this.selected_tool]["ogeneral_port"]	= isNaN(port) ? 11000 : port;
			
			// universe data checkboxes
			this.tools[this.selected_tool]["submit_galaxy"]				= document.getElementById("GTPlugin-submit_galaxy").checked;
			this.tools[this.selected_tool]["submit_stats"]				= document.getElementById("GTPlugin-submit_stats").checked;
			this.tools[this.selected_tool]["submit_reports"]			= document.getElementById("GTPlugin-submit_reports").checked;
			this.tools[this.selected_tool]["submit_allypage"]			= document.getElementById("GTPlugin-submit_allypage").checked;
			this.tools[this.selected_tool]["submit_espionage_action"]	= document.getElementById("GTPlugin-submit_espionage_action").checked;
			this.tools[this.selected_tool]["submit_short_cr"]			= document.getElementById("GTPlugin-submit_short_cr").checked;
			this.tools[this.selected_tool]["submit_player_message"]		= document.getElementById("GTPlugin-submit_player_message").checked;
			this.tools[this.selected_tool]["submit_player_message_c"]	= document.getElementById("GTPlugin-submit_player_message_content").checked;
			this.tools[this.selected_tool]["submit_phalanx"]			= document.getElementById("GTPlugin-submit_phalanx").checked;
			
			// own data checkboxes
			this.tools[this.selected_tool]["submit_buildings"]	= document.getElementById("GTPlugin-submit_buildings").checked;
			this.tools[this.selected_tool]["submit_research"]	= document.getElementById("GTPlugin-submit_research").checked;
			this.tools[this.selected_tool]["submit_fleet"]		= document.getElementById("GTPlugin-submit_fleet").checked;
			this.tools[this.selected_tool]["submit_defense"]	= document.getElementById("GTPlugin-submit_defense").checked;
			this.tools[this.selected_tool]["submit_empire"]		= document.getElementById("GTPlugin-submit_empire").checked;
			this.tools[this.selected_tool]["submit_shipyard"]	= document.getElementById("GTPlugin-submit_shipyard").checked;
			this.tools[this.selected_tool]["submit_fmovement"]	= document.getElementById("GTPlugin-submit_fmovement").checked;
		} catch(error) {
			alert("copy_userdata: "+error);
		}	
	},
	
	set_userdata: function() {
		try {
			if (this.selected_tool == null) {
				return;
			}
			if (this.tools == null) {
				return;
			}
			
			this.dont_update = true;
			// set values at text fields
			document.getElementById("GTPlugin-caption").setAttribute("label", this.tools[this.selected_tool]["name"]);
			document.getElementById("GTPlugin-name").value		= this.tools[this.selected_tool]["name"];
			document.getElementById("GTPlugin-ogameurl").value	= this.tools[this.selected_tool]["ogame_url"];
			if (this.tools[this.selected_tool]["ogame_servername_color"] != "") {
				document.getElementById("GTPlugin-ogameurl").setAttribute("style","-moz-appearance:none; width: 250px;background-color:"+this.tools[this.selected_tool]["ogame_servername_color"]);
			} else {
				document.getElementById("GTPlugin-ogameurl").setAttribute("style","width: 250px;");
			}
			document.getElementById("GTPlugin-url").value		= this.tools[this.selected_tool]["tool_url"];
			
			var version;
			if (this.tools[this.selected_tool]["tool_version_major"] == 0) {
				 version = "≤4.5.4"; 
			} else {
				version = this.tools[this.selected_tool]["tool_version_major"]+
				"."+this.tools[this.selected_tool]["tool_version_minor"]+
				"."+this.tools[this.selected_tool]["tool_version_revision"];
			}
			
			document.getElementById("GTPlugin-version").value	= version;
			
			document.getElementById("GTPlugin-username").value	= this.tools[this.selected_tool]["tool_user"];
			document.getElementById("GTPlugin-password").value	= this.tools[this.selected_tool]["tool_password"];
			document.getElementById("GTPlugin-token").value		= this.tools[this.selected_tool]["tool_token"];
			document.getElementById("GTPlugin-uni").value		= this.tools[this.selected_tool]["universe"];
			
			if (this.tools[this.selected_tool]["universe"] == "unknown") {
				document.getElementById("GTPlugin-uni").setAttribute("class","gt_label_uni_not_okay");	
			} else {
				document.getElementById("GTPlugin-uni").setAttribute("class","gt_label_uni_okay");
			}
			
			document.getElementById("GTPlugin-isogeneral").setAttribute("checked", this.tools[this.selected_tool]["is_ogeneral"]);
			document.getElementById("GTPlugin-ogeneralip").value		= this.tools[this.selected_tool]["ogeneral_ip"];
			document.getElementById("GTPlugin-ogeneralport").value		= this.tools[this.selected_tool]["ogeneral_port"];
			
			// universe data checkboxes
			document.getElementById("GTPlugin-submit_galaxy").setAttribute("checked", this.tools[this.selected_tool]["submit_galaxy"]);
			document.getElementById("GTPlugin-submit_stats").setAttribute("checked", this.tools[this.selected_tool]["submit_stats"]);
			document.getElementById("GTPlugin-submit_reports").setAttribute("checked", this.tools[this.selected_tool]["submit_reports"]);
			document.getElementById("GTPlugin-submit_allypage").setAttribute("checked", this.tools[this.selected_tool]["submit_allypage"]);
			document.getElementById("GTPlugin-submit_espionage_action").setAttribute("checked", this.tools[this.selected_tool]["submit_espionage_action"]);
			document.getElementById("GTPlugin-submit_short_cr").setAttribute("checked", this.tools[this.selected_tool]["submit_short_cr"]);
			document.getElementById("GTPlugin-submit_player_message").setAttribute("checked", this.tools[this.selected_tool]["submit_player_message"]);
			document.getElementById("GTPlugin-submit_player_message_content").setAttribute("checked", this.tools[this.selected_tool]["submit_player_message_c"]);
			document.getElementById("GTPlugin-submit_phalanx").setAttribute("checked", this.tools[this.selected_tool]["submit_phalanx"]);
			
			// own data checkboxes
			document.getElementById("GTPlugin-submit_buildings").setAttribute("checked", this.tools[this.selected_tool]["submit_buildings"]);
			document.getElementById("GTPlugin-submit_research").setAttribute("checked", this.tools[this.selected_tool]["submit_research"]);
			document.getElementById("GTPlugin-submit_fleet").setAttribute("checked", this.tools[this.selected_tool]["submit_fleet"]);
			document.getElementById("GTPlugin-submit_defense").setAttribute("checked", this.tools[this.selected_tool]["submit_defense"]);
			document.getElementById("GTPlugin-submit_empire").setAttribute("checked", this.tools[this.selected_tool]["submit_empire"]);
			document.getElementById("GTPlugin-submit_shipyard").setAttribute("checked", this.tools[this.selected_tool]["submit_shipyard"]);
			document.getElementById("GTPlugin-submit_fmovement").setAttribute("checked", this.tools[this.selected_tool]["submit_fmovement"]);
			
			this.remove_userpw_fields(this.tools[this.selected_tool]["tool_token"].match(/^[0-9a-f]{32}$/i) != null);
			this.on_isog_changed();
			this.dont_update = false;
		} catch(error) {
			alert("set_userdata: "+error);
		}
	},
	
	load_selected_tool: function(menuitem) {
		try {
			if (this.do_not_set_fields) {
				// we just want to set the focus to the new line without copying data
				document.getElementById("GTPlugin-checkbtn").removeAttribute("image");
				this.do_not_set_fields = false;
				return;
			}
			//alert("pressed "+variable.getAttribute("label"));
			// copy user entered data into array
			this.copy_userdata();
			
			// now set the newly selected tool as global defined tool
			this.selected_tool = menuitem.getAttribute("value");
			
			// set userdata for selected tool
			this.set_userdata();
			document.getElementById("GTPlugin-checkbtn").removeAttribute("image");
			
		} catch(error) {
			alert("error at load tool: "+e);
		}
	},
	
	add_new_tool: function(tool_url,tool_token,tool_version_major,tool_version_minor,tool_version_revision) {
		try {
			var array_index = this.tools.length;
			this.tools[array_index] = new Object();
			this.tools[array_index]["id"]						= null;
			this.tools[array_index]["deleted"]					= false;
			this.tools[array_index]["updated"]					= true;
			this.tools[array_index]["name"]						= "New Tool";
			this.tools[array_index]["ogame_url"]				= "s10-org.ogame.gameforge.com";
			this.tools[array_index]["tool_url"]					= tool_url != undefined ? tool_url : "http://yourdomain.tld/galaxytool/secret/galaxyplugin.php";
			this.tools[array_index]["tool_version_major"]		= tool_version_major != undefined ? tool_version_major : 0;
			this.tools[array_index]["tool_version_minor"]		= tool_version_minor != undefined ? tool_version_minor : 0;
			this.tools[array_index]["tool_version_revision"]	= tool_version_revision != undefined ? tool_version_revision : 0;
			this.tools[array_index]["tool_user"]				= "";
			this.tools[array_index]["tool_password"]			= "";
			this.tools[array_index]["tool_token"]				= tool_token != undefined ? tool_token: "";
			this.tools[array_index]["ogame_servername_color"]	= tool_url != undefined ? "red" : "";
			this.tools[array_index]["universe"]					= "unknown";
			// ogeneral
			this.tools[array_index]["is_ogeneral"]				= "false";
			this.tools[array_index]["ogeneral_ip"]				= "127.0.0.1";
			this.tools[array_index]["ogeneral_port"]			= 11000;
			
			// universe data checkboxes
			this.tools[array_index]["submit_galaxy"]			= "true";
			this.tools[array_index]["submit_stats"]				= "true";
			this.tools[array_index]["submit_reports"]			= "true";
			this.tools[array_index]["submit_allypage"]			= "true";
			this.tools[array_index]["submit_espionage_action"]	= "true";
			this.tools[array_index]["submit_short_cr"]			= "true";
			this.tools[array_index]["submit_player_message"]	= "true";
			this.tools[array_index]["submit_player_message_c"]	= "false";
			this.tools[array_index]["submit_phalanx"]			= "true";
			
			// own data checkboxes
			this.tools[array_index]["submit_buildings"]	= "true";
			this.tools[array_index]["submit_research"]	= "true";
			this.tools[array_index]["submit_fleet"]		= "true";
			this.tools[array_index]["submit_defense"]	= "true";
			this.tools[array_index]["submit_empire"]	= "true";
			this.tools[array_index]["submit_shipyard"]	= "true";
			this.tools[array_index]["submit_fmovement"]	= "true";
			
			// add item to menulist
 			this.tools[array_index]["menuitem"] = document.getElementById("GTPlugin-tool_list").appendItem( this.tools[array_index]["name"], array_index, " - "+this.tools[array_index]["ogame_url"] );
			
			if (this.selected_tool != null) {
	 			// backup old values first
	 			this.copy_userdata();
			}
 			
 			this.selected_tool = this.tools.length - 1;
 			
 			// select new tool in dropdown
 			this.do_not_set_fields = true;
 			document.getElementById("GTPlugin-tool_list").selectedIndex = this.selected_tool; 
 			
 			// set new data at fields
 			this.set_userdata();
 			 			
		} catch(e) {
			alert("error at add tool: "+e);
		}
	},
	
	delete_tool: function() {
		try {
			// this.selected_tool contains currently selected tool
			if (this.selected_tool == null) {
				// nothing to delete
				return;
			}
			
			// database done in save only
			// hide item at list
			this.tools[this.selected_tool]["menuitem"].style.display="none";
			
			// array content will be lost as soon as the window is closed; but mark it as deleted
			this.tools[this.selected_tool]["deleted"] = true;
			
			// select another tool which is not yet marked as deleted
			var remaining_tools = false;		
			for (var i=0; i < this.tools.length; i++) {
				if (!this.tools[i]["deleted"]) {
					this.selected_tool = i;
					this.set_userdata();
					remaining_tools = true;
					
					// select tool in dropdown
 					this.do_not_set_fields = true;
 					document.getElementById("GTPlugin-tool_list").selectedIndex = this.selected_tool; 
					
					return;
				}
			}
			if (remaining_tools == false) {
				// we did not find any remaining tool
				this.add_new_tool();
			}
		} catch(error) {
			alert("delete tool error: "+error);
		}
	},
	
	on_ogame_url_changed: function() {
		try {
			// we don't want to have leading http:// and trailing / or something else like that
			var new_url = document.getElementById("GTPlugin-ogameurl").value.trim().replace(/^http:\/\//,"").replace(/(\/.*)*$/,"");
			document.getElementById("GTPlugin-ogameurl").value = new_url;
			// change the menuitem description
			galaxytoolbar.GTPlugin_options2.tools[galaxytoolbar.GTPlugin_options2.selected_tool]["menuitem"].setAttribute("description",new_url);
			galaxytoolbar.GTPlugin_options2.tools[galaxytoolbar.GTPlugin_options2.selected_tool]["universe"]	= "";
			this.reload_ogame_servername(galaxytoolbar.GTPlugin_options2.selected_tool,new_url);
			
			galaxytoolbar.GTPlugin_options2.tools[galaxytoolbar.GTPlugin_options2.selected_tool]["ogame_servername_color"] = "";
			document.getElementById("GTPlugin-ogameurl").setAttribute("style","width: 250px;");
			galaxytoolbar.GTPlugin_options2.on_change();
		} catch(error) {
			alert("reset uni error: "+error);
		}
	},
	
	reload_ogame_servername: function(id,url,direct_update) {
		if (url.match(/\.ogame\.[\w\.]{2,}/) == null) {
			if (!direct_update) {
				galaxytoolbar.GTPlugin_options2.tools[galaxytoolbar.GTPlugin_options2.selected_tool]["universe"]	= "";
				
				if (id == galaxytoolbar.GTPlugin_options2.selected_tool)
					document.getElementById("GTPlugin-uni").value = "";
			}
			return;
		}
			
		var api = "http://"+url+"/api/serverData.xml";
		var req_id = ++galaxytoolbar.GTPlugin_options2.request_id;
		try {
			var httpRequest = new XMLHttpRequest();
			httpRequest.open("GET", api, true);
			httpRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded;charset=UTF-8");
			httpRequest.overrideMimeType("text/xml");
			httpRequest.onload = function() {
				var servername = "";
				var el;
				try {
					el = httpRequest.responseXML.getElementsByTagName("name");
					
					if (el.length > 0)
						servername = httpRequest.responseXML.getElementsByTagName("name")[0].textContent;
					
					if (servername == "")
						servername = httpRequest.responseXML.getElementsByTagName("number")[0].textContent;
				} catch(e) {}
				
				if (req_id == galaxytoolbar.GTPlugin_options2.request_id && !direct_update) {
					galaxytoolbar.GTPlugin_options2.tools[id]["universe"] = servername;
					
					if (id == galaxytoolbar.GTPlugin_options2.selected_tool)
						document.getElementById("GTPlugin-uni").value = servername;
				} else {
					galaxytoolbar.GTPlugin_storage.update_universe_for_ogame_url(url,servername);
				}
			};
			httpRequest.onerror = function() {
				// prevent concurrence
				if (req_id == galaxytoolbar.GTPlugin_options2.request_id && !direct_update) {
					galaxytoolbar.GTPlugin_options2.tools[id]["universe"] = "";
					
					if (id == galaxytoolbar.GTPlugin_options2.selected_tool)
						document.getElementById("GTPlugin-uni").value = "";
				}
			};
			httpRequest.send(null);
		} catch(e) {
			if (!direct_update) {
				galaxytoolbar.GTPlugin_options2.tools[id]["universe"] = "";
					
				if (id == galaxytoolbar.GTPlugin_options2.selected_tool)
					document.getElementById("GTPlugin-uni").value = "";
			}
		}
	},
	
	on_ogame_url_input: function() {
		try {
			this.tools[this.selected_tool]["ogame_servername_color"] = "";
			document.getElementById("GTPlugin-ogameurl").setAttribute("style","width: 250px;");
			this.reload_ogame_servername(this.selected_tool,document.getElementById("GTPlugin-ogameurl").value);
		} catch(e) {
		}
	},
	
	on_galaxytool_url_changed: function() {
		try {
			this.tools[this.selected_tool]["tool_version_major"]	= 0;
			this.tools[this.selected_tool]["tool_version_minor"]	= 0;
			this.tools[this.selected_tool]["tool_version_revision"]	= 0;
			document.getElementById("GTPlugin-version").value		= "≤4.5.4";
			
			this.on_change();
		} catch(error) {
			alert("reset Galaxytool version error: "+error);
		}
	},
	
	on_change: function() {
		try {
			if (!this.dont_update)
				this.tools[this.selected_tool]["updated"] = true;
				
			this.copy_userdata();
		} catch(error) {
			alert("on change: "+error);
		}
	},
	
	on_name_changed: function() {
		// handle name changes
		try {
			// change the menuitem description
			this.tools[this.selected_tool]["menuitem"].setAttribute("label",document.getElementById("GTPlugin-name").value);
			this.on_change();
		} catch(error) {
			alert("on name changed: "+error);
		}
	},
	
	on_token_changed: function() {
		document.getElementById("GTPlugin-token").value = document.getElementById("GTPlugin-token").value.trim();
		this.remove_userpw_fields(document.getElementById("GTPlugin-token").value.match(/^[0-9a-f]{32}$/i) != null);
		this.on_change();
	},
	
	on_isog_changed: function() {
		if (document.getElementById("GTPlugin-isogeneral").checked) {
			// remove gtool url, token, user, password fields
			document.getElementById("GTPlugin-url-hbox").style.display = "none";
			document.getElementById("GTPlugin-token-hbox").style.display = "none";
			this.remove_userpw_fields(true);
			document.getElementById("GTPlugin-whattosend-hbox").style.display = "none";
			// display Ogeneral settings instead
			document.getElementById("GTPlugin-ogeneralip-hbox").setAttribute("style","");
			document.getElementById("GTPlugin-ogeneralport-hbox").setAttribute("style","");
			window.sizeToContent();
			this.on_change();
		} else {
			// remove Ogeneral settings
			document.getElementById("GTPlugin-ogeneralip-hbox").style.display = "none";
			document.getElementById("GTPlugin-ogeneralport-hbox").style.display = "none";
			// show all gtool settings instead
			document.getElementById("GTPlugin-whattosend-hbox").setAttribute("style","");
			document.getElementById("GTPlugin-token-hbox").setAttribute("style","");
			document.getElementById("GTPlugin-url-hbox").setAttribute("style","");
			this.on_token_changed();
		}
	},
	
	on_ip_changed: function() {
		//GTPlugin-ogeneralip

	},
	
	on_general_settings_changed: function() {
		if (!this.dont_update)
			this.general_settings_updated = true;
	},
	
	remove_userpw_fields: function(remove) {
		if (remove) {
			document.getElementById("GTPlugin-username-hbox").style.display = "none";
			document.getElementById("GTPlugin-password-hbox").style.display = "none";
		} else {
			document.getElementById("GTPlugin-username-hbox").setAttribute("style","");
			document.getElementById("GTPlugin-password-hbox").setAttribute("style","");
			
		}
		// trigger a resize, because of possible extra fields
		window.sizeToContent();
	},
	
	getPrefs: function() {
		return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	},
	
	loadValues: function() {
		try {
			this.dont_update = true;
			var prefs = this.getPrefs();
			// debug information
			if (prefs.prefHasUserValue("gtplugin.settings.debug")) {
				var debug = prefs.getBoolPref("gtplugin.settings.debug");
				document.getElementById("GTPlugin-debug").checked = debug;
			}
			// status window
			if (prefs.prefHasUserValue("gtplugin.settings.show_statuswindow")) {
				var show_statuswindow = prefs.getBoolPref("gtplugin.settings.show_statuswindow");
				document.getElementById("GTPlugin-show_statuswindow").checked = show_statuswindow;
			}
			/* no need to save that value anymore
			if (prefs.prefHasUserValue("gtplugin.settings.get_own_player_id")) {
				var get_player_id = prefs.getBoolPref("gtplugin.settings.get_own_player_id");
				document.getElementById("GTPlugin-own_player_id").checked = get_player_id;
			}
			*/
			// Status window styles
			var style;
			if (prefs.prefHasUserValue("gtplugin.status_style_window")) {
				style = prefs.getCharPref("gtplugin.status_style_window");
				document.getElementById("GTPlugin-status_style_window").value = style;
			} else {
				// default value
				document.getElementById("GTPlugin-status_style_window").value = "position:fixed;top:10px;left:10px;z-index: 9999;";
			}
			
			if (prefs.prefHasUserValue("gtplugin.status_style_window_iframe")) {
				style = prefs.getCharPref("gtplugin.status_style_window_iframe");
				document.getElementById("GTPlugin-status_style_window_iframe").value = style;
			} else {
				// default value
				document.getElementById("GTPlugin-status_style_window_iframe").value = "position:fixed;top:20px;right:25px;z-index: 9999;";
			}
			
			if (prefs.prefHasUserValue("gtplugin.status_style_header")) {
				style = prefs.getCharPref("gtplugin.status_style_header");
				document.getElementById("GTPlugin-status_style_header").value = style;
			} else {
				// default value
				document.getElementById("GTPlugin-status_style_header").value = "font-weight:bold;";
			}
			if (prefs.prefHasUserValue("gtplugin.status_style_results")) {
				style = prefs.getCharPref("gtplugin.status_style_results");
				document.getElementById("GTPlugin-status_style_results").value = style;
			} else {
				// default value
				document.getElementById("GTPlugin-status_style_results").value = "color:white;";
			}		
			this.dont_update = false;
			// load tool specific information from SQLite
			this.tools = galaxytoolbar.GTPlugin_storage.read_tools();
			
			// add items to menulist
			for (var i=0; i< this.tools.length; i++) {
				this.tools[i]["ogame_servername_color"] = "";
				this.tools[i]["menuitem"] = document.getElementById("GTPlugin-tool_list").appendItem( this.tools[i]["name"], i, " - "+this.tools[i]["ogame_url"] );
			}
		} catch(error) {
			alert("loadValues error: "+error);
		}
	},
	
	saveValues: function() {
		try {
			// as a first step, copy values from input fields into array
			this.copy_userdata();
			
			var prefs = this.getPrefs();
			
			// Settings stored in PREF 
			prefs.setBoolPref("gtplugin.settings.debug", document.getElementById("GTPlugin-debug").checked); // set a pref
			prefs.setBoolPref("gtplugin.settings.show_statuswindow", document.getElementById("GTPlugin-show_statuswindow").checked);
			//prefs.setBoolPref("gtplugin.settings.get_own_player_id", document.getElementById("GTPlugin-own_player_id").checked);
			
			// Status window
			prefs.setCharPref("gtplugin.status_style_window", decodeURIComponent(this.getValue("GTPlugin-status_style_window")));
			prefs.setCharPref("gtplugin.status_style_window_iframe", decodeURIComponent(this.getValue("GTPlugin-status_style_window_iframe")));
			prefs.setCharPref("gtplugin.status_style_header", decodeURIComponent(this.getValue("GTPlugin-status_style_header")));
			prefs.setCharPref("gtplugin.status_style_results", decodeURIComponent(this.getValue("GTPlugin-status_style_results")));
			
			// data stored in SQLite 
			for (var i=0; i<this.tools.length; i++) {
				var tool_exists = galaxytoolbar.GTPlugin_storage.tool_exists(this.tools[i]["id"]);
				if (this.tools[i]["deleted"] == false && !tool_exists) {
					// insert data into SQLite only, if the tool was not created yet and is not marked as deleted
					galaxytoolbar.GTPlugin_storage.insert_tool(
						this.tools[i]["id"],
						this.tools[i]["name"],
						this.tools[i]["ogame_url"],
						this.tools[i]["tool_url"],
						this.tools[i]["tool_version_major"],
						this.tools[i]["tool_version_minor"],
						this.tools[i]["tool_version_revision"],
						this.tools[i]["tool_user"],
						this.tools[i]["tool_password"],
						this.tools[i]["tool_token"],
						this.tools[i]["universe"],
						// ogeneral
						this.tools[i]["is_ogeneral"],
						this.tools[i]["ogeneral_ip"],
						this.tools[i]["ogeneral_port"],
						// universe data checkboxes
						this.tools[i]["submit_galaxy"],
						this.tools[i]["submit_stats"],
						this.tools[i]["submit_reports"],
						this.tools[i]["submit_allypage"],
						this.tools[i]["submit_espionage_action"],
						this.tools[i]["submit_short_cr"],
						this.tools[i]["submit_player_message"],
						this.tools[i]["submit_player_message_c"],
						this.tools[i]["submit_phalanx"],
						// own data checkboxes
						this.tools[i]["submit_buildings"],
						this.tools[i]["submit_research"],
						this.tools[i]["submit_fleet"],
						this.tools[i]["submit_defense"],
						this.tools[i]["submit_empire"],
						this.tools[i]["submit_shipyard"],
						this.tools[i]["submit_fmovement"]);
						
						this.tools[i]["updated"] = false;
				} else if (this.tools[i]["deleted"] && tool_exists) {
					// delete tool from DB only, if the tool is marked as deleted and the tool exists
					galaxytoolbar.GTPlugin_storage.delete_tool(this.tools[i]["id"]);
					this.tools[i]["updated"] = false;
				}
				
				if (this.tools[i]["updated"] && tool_exists) {
					// update data only if necessary and tool exists
					galaxytoolbar.GTPlugin_storage.update_tool(
						this.tools[i]["id"],
						this.tools[i]["name"],
						this.tools[i]["ogame_url"],
						this.tools[i]["tool_url"],
						this.tools[i]["tool_version_major"],
						this.tools[i]["tool_version_minor"],
						this.tools[i]["tool_version_revision"],
						this.tools[i]["tool_user"],
						this.tools[i]["tool_password"],
						this.tools[i]["tool_token"],
						this.tools[i]["universe"],
						// ogeneral
						this.tools[i]["is_ogeneral"],
						this.tools[i]["ogeneral_ip"],
						this.tools[i]["ogeneral_port"],
						// universe data checkboxes
						this.tools[i]["submit_galaxy"],
						this.tools[i]["submit_stats"],
						this.tools[i]["submit_reports"],
						this.tools[i]["submit_allypage"],
						this.tools[i]["submit_espionage_action"],
						this.tools[i]["submit_short_cr"],
						this.tools[i]["submit_player_message"],
						this.tools[i]["submit_player_message_c"],
						this.tools[i]["submit_phalanx"],
						// own data checkboxes
						this.tools[i]["submit_buildings"],
						this.tools[i]["submit_research"],
						this.tools[i]["submit_fleet"],
						this.tools[i]["submit_defense"],
						this.tools[i]["submit_empire"],
						this.tools[i]["submit_shipyard"],
						this.tools[i]["submit_fmovement"]);
						
						this.tools[i]["updated"] = false;
				}
			}
			
			galaxytoolbar.GTPlugin_storage.close();
			window.close();
		} catch (error) {
			alert("Save values error: "+error);
		}
	},
	
	check_connection: function() {
		document.getElementById("GTPlugin-checkbtn").setAttribute("disabled",true);
		document.getElementById("GTPlugin-addbtn").setAttribute("disabled",true);
		document.getElementById("GTPlugin-delbtn").setAttribute("disabled",true);
		document.getElementById("GTPlugin-tool_list").setAttribute("disabled",true);
		this.reload_ogame_servername(this.selected_tool,this.tools[this.selected_tool]["ogame_url"], false);
		
		//TODO: improve regexp here
		if (/^https?:\/\/.+\.php$/.test(this.tools[this.selected_tool]["tool_url"])) {
			var galaxytool_url = this.tools[this.selected_tool]["tool_url"];
			if ((this.tools[this.selected_tool]["tool_user"] != "" 
				&& this.tools[this.selected_tool]["tool_password"] != "")
				|| this.tools[this.selected_tool]["tool_token"].match(/^[0-9a-f]{32}$/i) != null) {
				
				var username = this.tools[this.selected_tool]["tool_user"]; 
				var password = this.tools[this.selected_tool]["tool_password"];
				var token = this.tools[this.selected_tool]["tool_token"];
				//now we can check the connection
				var major = 0;
				var minor = 0;
				var revision = 0;
				var version;
				var general = galaxytoolbar.GTPlugin_general;
				try {
					var param;
					if (token.match(/^[0-9a-f]{32}$/i) != null) {
						param = 'type=validate&token='+token;
					} else {
						param = 'type=validate&user='+username+'&password='+general.get_MD5(password);
					}
					var httpRequest = new XMLHttpRequest();
					httpRequest.open("POST", galaxytool_url, true);
					httpRequest.setRequestHeader("Content-Type","application/x-www-form-urlencoded;charset=UTF-8");
					httpRequest.overrideMimeType("text/xml");
					httpRequest.onreadystatechange = function () {	
						if (httpRequest.readyState == 4) {
							if (httpRequest.status == 200) {
								
								var options2 = galaxytoolbar.GTPlugin_options2;
								try {
									//alert(httpRequest.responseText);
									var response = httpRequest.responseXML;
									version = response.getElementsByTagName("version")[0];
									
									major = parseInt(version.getAttribute("major"));
									
									if (version.hasAttribute("minor")) {
										minor = parseInt(version.getAttribute("minor"));
									}
									
									if (version.hasAttribute("revision")) {
										revision = parseInt(version.getAttribute("revision"));
									}
									
									options2.tools[options2.selected_tool]["tool_version_major"] = major;
									options2.tools[options2.selected_tool]["tool_version_minor"] = minor;
									options2.tools[options2.selected_tool]["tool_version_revision"] = revision;
									options2.tools[options2.selected_tool]["updated"] = true;		
									
									version = major+"."+minor+"."+revision;
									
									if (general.compare_versions(major,minor,revision,4,7,0)) {
										var permissions = response.getElementsByTagName("permission");
										var messages = response.getElementsByTagName("message");
										if (permissions.length > 0) {
											if (permissions[0].getAttribute("name") == "caninsert") {
												if (permissions[0].childNodes[0].nodeValue != "true") {
													options2.show_result("The connection test showed, that the Galaxytool URL is correct, but another error occured:",
													"You are not allowed to insert data. Ask you Galaxytool admin to give you all necessary permissions!",
													galaxytool_url,username,password,token,"",version,"yellow",true,true);
												} else {
													options2.show_result("","","","","","","",version,"green",false,true);
												}
											} else {
												options2.show_result("","","","","","","",version,"red",false,true);
											}
										} else if (messages.length > 0) {
											var all_messages = "";
											for ( var i=0; i < messages.length; i++) all_messages += messages[i].childNodes[0].nodeValue+"\n";
											options2.show_result("The connection test showed, that the Galaxytool URL is correct, but another error occured:",
													all_messages,
													galaxytool_url,
													username,
													password,token,"",version,"yellow",true,true);
										} else {
											options2.show_result("The connection test showed, that the Galaxytool URL is correct, but an unknown error occured. ResponseText:",
													httpRequest.responseText,galaxytool_url,username,password,token,"",version,"red",true,true);
										}
									} else {
										//Galaxytool v4.6
										options2.show_result("","","","","","",version,"green",false,true);
									}
									return 1;
								} catch(wrong_url) {
									options2.show_result("The connection test failed"+wrong_url,"",galaxytool_url,username,password,token,
														"Probably your Galaxytool URL is wrong!","","red",true,false);
									return 0;
								}	
							} else {
								var options2 = galaxytoolbar.GTPlugin_options2;
								// old tool
								if (httpRequest.responseText.indexOf("starting to work") > -1) {
									options2.tools[options2.selected_tool]["tool_version_major"] = 0;
									options2.tools[options2.selected_tool]["tool_version_minor"] = 0;
									options2.tools[options2.selected_tool]["tool_version_revision"] = 0;
									options2.tools[options2.selected_tool]["updated"] = true;
									options2.show_result("The connection test showed, that you are trying to connect to an old Galaxytool.\n",
														"This version of the Galaxytoolbar is not compatible with your Galaxytool version."+
														" Please make sure, that you have at least v4.6 of the Galaxytool installed.\n",
														galaxytool_url,username,password,token,"","≤4.5.4","red",true,true);
								} else {
								//could not reach the Galaxytool
								options2.show_result("The connection test failed","",galaxytool_url,username,password,token,"Connection Status Code: "+httpRequest.status+"\n"+
									"Probably your Galaxytool URL is wrong!","","red",true,false);
								}
								return 0;
							}
						}
					};
					httpRequest.send(param);
				} catch (e) {
					this.show_result("The connection test failed","",galaxytool_url,username,password,token,"Additionally, we got an error: "+e,"","red",true,false);
				}
			} else {
				alert("No username and password or valid login token specified!");
				this.show_result("","","","","","","","","",false,false);
			}
		} else {
			alert("No valid Galaxytool URL specified!");
			this.show_result("","","","","","","","","","",false,false);
		}
	},
	
	show_result : function(prologue,details,galatool_url,username,password,token,epilogue,version,color,show_alert,set_version) {
		if (show_alert) {
			var params;
			
			if (token.match(/^[0-9a-f]{32}$/i) != null) {
				params = "Logon Key: "+token+"\n";
			} else {
				params = "Username: "+username+"\n"
						+"Password: "+password+"\n";
			}
			
			alert(prologue+"\n"
					+details+"\n"
					+"Parameters sent:\n"
					+"Galaxytool URL: "+galatool_url+"\n"
					+params
					+epilogue);
		}
		
		if (set_version) {
			document.getElementById("GTPlugin-version").value  = version;
		}
		
		// unlock all elements
		document.getElementById("GTPlugin-checkbtn").setAttribute("disabled",false);
		document.getElementById("GTPlugin-addbtn").setAttribute("disabled",false);
		document.getElementById("GTPlugin-delbtn").setAttribute("disabled",false);
		document.getElementById("GTPlugin-tool_list").setAttribute("disabled",false);
		if (color != "") {
			document.getElementById("GTPlugin-checkbtn").setAttribute("image","chrome://galaxyplugin/skin/images/"+color+"_small.png");
		} else {
			document.getElementById("GTPlugin-checkbtn").removeAttribute("image");
		}
	},
	
	cancel: function() {
		
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
						.getService(Components.interfaces.nsIPromptService);  
		
		var check = {value: false};
  
		var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +  
					prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;
		
		if (this.general_settings_updated) {
			if (prompts.confirmEx(null, galaxytoolbar.GTPlugin_general.getLocString("toolbar_name"), galaxytoolbar.GTPlugin_general.getLocString("settings_changed"),flags, "", "", "", null, check))
				return false;
		} else {
			for (var i = 0; i < this.tools.length; i++) {
				if (this.tools[i]["updated"]) {
					if (prompts.confirmEx(null, galaxytoolbar.GTPlugin_general.getLocString("toolbar_name"), galaxytoolbar.GTPlugin_general.getLocString("settings_changed"),flags, "", "", "", null, check))
						return false;
					break;
				}
			}
		}
		return true;
	},
	
	getValue: function(elementID) {
		// Get a handle to our url textfield
		var textfield = document.getElementById(elementID);
		// Get the value, trimming whitespace as necessary
		var string = this.trimString(textfield.value);
		
		// If there is no url, we return ""
		// Otherwise, we convert the search terms to a safe URI version and return it
		if (string.length == 0) { 
			return "";
		} else {
			return encodeURIComponent(string);
		}
	},
	
	get_indexes_of_tool: function(url) {
		var indexes = new Array();
		for(var i = 0; i < this.tools.length; i++) {
			if (this.tools[i]["tool_url"] == url) {
				indexes.push(i);
			}
		}
		return indexes;
	},
	
	trimString: function(string) {
		// Return empty if nothing was passed in
		if (!string) return "";
		
		// Efficiently replace any leading or trailing whitespace
		var value = string.replace(/^\s+/, '');
		value = string.replace(/\s+$/, '');
		
		// Replace any multiple whitespace characters with a single space
		value = value.replace(/\s+/g, ' ');
		
		// Return the altered string
		return value;
	}
};