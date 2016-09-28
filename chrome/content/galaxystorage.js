"use strict";
if(!galaxytoolbar) var galaxytoolbar={};
if(!galaxytoolbar.GTPlugin_storage) galaxytoolbar.GTPlugin_storage={};

galaxytoolbar.GTPlugin_storage={
	
	file:			null,
	storageService:	null,
	dbConn:			null,
	db_tools:		"galaxytool_tools",
	db_languages:	"galaxytool_languages",
	db_espionage:	"galaxytool_espionage",
	db_activities:  "galaxytool_activities", // stores recent activity updates to the tools
	
	initStorage: function() {
		try {
			var file = Components.classes["@mozilla.org/file/directory_service;1"]  
								 .getService(Components.interfaces.nsIProperties)  
								 .get("ProfD", Components.interfaces.nsIFile);  
			file.append("galaxytool_options.sqlite");  
			
			var storageService = Components.classes["@mozilla.org/storage/service;1"]  
									.getService(Components.interfaces.mozIStorageService);  
			var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
			this.dbConn = mDBConn;  
			
			// create table if it does not exist yet
			this.install();
			
		} catch(init_error) {
			alert("Storage INIT error: "+init_error);
			return;
		}
	},
	
	insert_tool: function(id,tool_name, ogame_url, tool_url, tool_version_major, tool_version_minor, 
						  tool_version_revision,  tool_user, tool_password, tool_token, universe, is_ogeneral,
						  ogeneral_ip, ogeneral_port, s_galaxy, s_stats, s_reports, s_allypage, s_espionage_action,
						   s_short_cr, s_player_message, s_player_message_c, s_phalanx, s_buildings, s_research,
						  s_fleet, s_defense, s_empire, s_shipyard, s_fmovement) {
		try {
			// delete old entry of that tool (if it exists)
			var statement = null;
			if (id != null) {
				// Tool was loaded from SQLite
				this.delete_tool(id);
			}
			
			statement = this.dbConn.createStatement('INSERT INTO "main"."'+this.db_tools+'" ' +
					'("tool_name","ogame_url","tool_url","tool_user","tool_password","tool_token", "universe", ' +
					'"is_ogeneral", "ogeneral_ip", "ogeneral_port", '+
					' "submit_galaxy","submit_stats","submit_reports","submit_allypage", ' +
					' "submit_buildings","submit_research","submit_fleet","submit_defense", "submit_empire", '+
					' "submit_shipyard","submit_phalanx","submit_fmovement","submit_espionage_action", '+
					' "submit_short_cr","submit_player_message","submit_player_message_c", '+
					' "tool_version_major","tool_version_minor", "tool_version_revision") VALUES ' +
					'(:tool_name, :ogame_url, :tool_url, :tool_user, :tool_password, :tool_token, :universe, ' +
					':is_ogeneral, :ogeneral_ip, :ogeneral_port,'+
					':submit_galaxy, :submit_stats, :submit_reports, :submit_allypage, ' +
					':submit_buildings, :submit_research, :submit_fleet, :submit_defense, :submit_empire, ' +
					':submit_shipyard, :submit_phalanx, :submit_fmovement, :submit_espionage_action, ' +
					':submit_short_cr, :submit_player_message, :submit_player_message_c, ' +					
					':tool_version_major, :tool_version_minor, :tool_version_revision )');  
			
			// general data - prepared statement is providing security for SQL injections
			statement.params.tool_name		= tool_name;
			statement.params.ogame_url		= ogame_url;
			statement.params.tool_url		 = tool_url;
			statement.params.tool_user		= tool_user;
			statement.params.tool_password	= tool_password;
			statement.params.tool_token		= tool_token;
			statement.params.universe		 = universe;
			
			statement.params.is_ogeneral	= (is_ogeneral == "true" || is_ogeneral)	  ? "true" : "false";
			statement.params.ogeneral_ip		 = ogeneral_ip;
			statement.params.ogeneral_port		 = ogeneral_port;
			
			// universe data
			statement.params.submit_galaxy	= (s_galaxy == "true"   || s_galaxy)	  ? "true" : "false";
			statement.params.submit_stats	 = (s_stats == "true"	|| s_stats)	   ? "true" : "false"; 
			statement.params.submit_reports   = (s_reports == "true"  || s_reports)	 ? "true" : "false"; 
			statement.params.submit_allypage  = (s_allypage == "true" || s_allypage)	? "true" : "false";
			statement.params.submit_phalanx   = (s_phalanx == "true"  || s_phalanx)	 ? "true" : "false";
			statement.params.submit_espionage_action  = (s_espionage_action == "true" || s_espionage_action)	? "true" : "false";
			statement.params.submit_short_cr  = (s_short_cr == "true" || s_short_cr)	? "true" : "false";
			statement.params.submit_player_message  = (s_player_message == "true" || s_player_message)	? "true" : "false";
			statement.params.submit_player_message_c  = (s_player_message_c == "true" || s_player_message_c)	? "true" : "false";
			
			// own data
			statement.params.submit_buildings = (s_buildings == "true" || s_buildings) ? "true" : "false";
			statement.params.submit_research  = (s_research == "true"  || s_research)  ? "true" : "false";
			statement.params.submit_fleet	 = (s_fleet == "true"	 || s_fleet)	 ? "true" : "false"; 
			statement.params.submit_defense   = (s_defense == "true"   || s_defense)   ? "true" : "false";
			statement.params.submit_empire	= (s_empire == "true"	|| s_empire)	? "true" : "false"; 	
			statement.params.submit_shipyard  = (s_shipyard == "true"  || s_shipyard)  ? "true" : "false"; 
			statement.params.submit_fmovement = (s_fmovement == "true" || s_fmovement) ? "true" : "false"; 
			
			statement.params.tool_version_major = tool_version_major;
			statement.params.tool_version_minor = tool_version_minor;
			statement.params.tool_version_revision = tool_version_revision;
			
			this.dbConn.executeAsync([statement],1);
		} catch(error) {
			alert("error at insert: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			
		}
	},
	
	update_tool: function(id,tool_name, ogame_url, tool_url, tool_version_major, tool_version_minor, 
						  tool_version_revision,  tool_user, tool_password, tool_token, universe, is_ogeneral,
						  ogeneral_ip, ogeneral_port, s_galaxy, s_stats, s_reports, s_allypage, s_espionage_action,
						   s_short_cr, s_player_message, s_player_message_c, s_phalanx, s_buildings, s_research,
						  s_fleet, s_defense, s_empire, s_shipyard, s_fmovement) {
		
		try {
			var statement = null;
		
			statement = this.dbConn.createStatement('UPDATE "main"."'+this.db_tools+'" SET ' +
					'tool_name = :tool_name , ogame_url = :ogame_url , ' +
					'tool_url = :tool_url , tool_user = :tool_user , ' +
					'tool_password = :tool_password , tool_token = :tool_token, universe = :universe , ' +
					'is_ogeneral = :is_ogeneral, ogeneral_ip = :ogeneral_ip, ogeneral_port = :ogeneral_port, '+
					'submit_galaxy = :submit_galaxy , submit_stats = :submit_stats , '+
					'submit_reports = :submit_reports , submit_allypage = :submit_allypage , ' +
					'submit_buildings = :submit_buildings , submit_research = :submit_research , ' +
					'submit_fleet = :submit_fleet , submit_defense = :submit_defense, ' +
					'submit_empire = :submit_empire, submit_shipyard = :submit_shipyard, ' +
					'submit_phalanx = :submit_phalanx, submit_fmovement = :submit_fmovement, ' +
					'submit_espionage_action = :submit_espionage_action, submit_short_cr = :submit_short_cr, ' +
					'submit_player_message = :submit_player_message, ' +
					'submit_player_message_c = :submit_player_message_c, tool_version_major = :tool_version_major, '+
					'tool_version_minor = :tool_version_minor, tool_version_revision = :tool_version_revision '+
					'WHERE id = :id ' );
			
			
			// general data - prepared statement is providing security for SQL injection
			statement.params.tool_name		= tool_name; 
			statement.params.ogame_url		= ogame_url; 
			statement.params.tool_url		 = tool_url; 
			statement.params.tool_user		= tool_user; 
			statement.params.tool_password	= tool_password;
			statement.params.tool_token		= tool_token;
			statement.params.universe		 = universe;
			
			statement.params.is_ogeneral	= (is_ogeneral == "true" || is_ogeneral)	  ? "true" : "false";
			statement.params.ogeneral_ip		 = ogeneral_ip;
			statement.params.ogeneral_port		 = ogeneral_port;
			
			// universe data
			statement.params.submit_galaxy	= (s_galaxy == "true"   || s_galaxy)	  ? "true" : "false";
			statement.params.submit_stats	 = (s_stats == "true"	|| s_stats)	   ? "true" : "false"; 
			statement.params.submit_reports   = (s_reports == "true"  || s_reports)	 ? "true" : "false"; 
			statement.params.submit_allypage  = (s_allypage == "true" || s_allypage)	? "true" : "false";
			statement.params.submit_phalanx   = (s_phalanx == "true"  || s_phalanx)	 ? "true" : "false";
			statement.params.submit_espionage_action  = (s_espionage_action == "true" || s_espionage_action)	? "true" : "false";
			statement.params.submit_short_cr  = (s_short_cr == "true" || s_short_cr)	? "true" : "false";
			statement.params.submit_player_message  = (s_player_message == "true" || s_player_message)	? "true" : "false";
			statement.params.submit_player_message_c  = (s_player_message_c == "true" || s_player_message_c)	? "true" : "false";
			
			// own data
			statement.params.submit_buildings = (s_buildings == "true" || s_buildings) ? "true" : "false";
			statement.params.submit_research  = (s_research == "true"  || s_research)  ? "true" : "false";
			statement.params.submit_fleet	 = (s_fleet == "true"	 || s_fleet)	 ? "true" : "false"; 
			statement.params.submit_defense   = (s_defense == "true"   || s_defense)   ? "true" : "false"; 
			statement.params.submit_empire	= (s_empire == "true"	|| s_empire)   ? "true" : "false";
			statement.params.submit_shipyard  = (s_shipyard == "true"  || s_shipyard)  ? "true" : "false"; 
			statement.params.submit_fmovement = (s_fmovement == "true" || s_fmovement) ? "true" : "false"; 
			
			statement.params.id				  = id;
			
			statement.params.tool_version_major = tool_version_major;
			statement.params.tool_version_minor = tool_version_minor;
			statement.params.tool_version_revision = tool_version_revision;
			
			this.dbConn.executeAsync([statement],1);
		} catch(error) {
			alert("error at update: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			
		}
	},
	
	insert_translations: function(tool_ids,english_names,translations) {
		try {
			
			var statements = [];
			var statement = "";
			var statement2 = "";
			for (var  i=0;i < tool_ids.length;i++){
				// first, delete the old entries (just in case Ogame invents new buildings)
				
				statement = this.dbConn.createStatement('DELETE FROM "main"."'+this.db_languages+'" WHERE tool_id = :tool_id');
				statement.params.tool_id = tool_ids[i];
				statements.push(statement);
				
				for(var j=0;j < english_names.length;j++) {
					//then insert each technique
					 statement2 = this.dbConn.createStatement('INSERT INTO "main"."'+this.db_languages+'" ' +
						'("tool_id","tech_name_english","tech_name") VALUES ' +
						"(:tool_id, :english_name, :translation)");  
					
					statement2.params.tool_id = tool_ids[i];
					statement2.params.english_name = english_names[j];
					statement2.params.translation = translations[j];
					
					statements.push(statement2);
				}
			}
			
			//perform async request - for performance reasons!
			this.dbConn.executeAsync(statements, statements.length);
			
			return true;
		} catch(error) {
			alert("update techs error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			return false;
		}
	},
	
	get_translation: function(tool_id,word,set_locking_var,loc) {
		try {
			var statement = "";
			statement = this.dbConn.createStatement('SELECT * FROM "main"."'+this.db_languages+'" WHERE tool_id = :tool_id AND tech_name = :tech_name');
			statement.params.tool_id = tool_id;
			statement.params.tech_name = word;
			
			while (statement.executeStep()){
				var translation = statement.row.tech_name_english;
				statement.reset();
				return translation;
			}
			
			return "Unknown entry";
		} catch(error) {
			alert("get translations error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	hasTranslation: function(tool_id) {
		try {
			var statement = "";
			statement = this.dbConn.createStatement('SELECT tool_id FROM "main"."'+this.db_languages+'" WHERE tool_id = :tool_id');
			statement.params.tool_id = tool_id;
			
			while (statement.executeStep()){
				statement.reset();
				return true;
			}
			
			return false;
		} catch(error) {
			alert("get translations error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	insert_espionage_action: function(uni,galaxy,system,planet) {
		try {
			// add 90s because you need some time to reach the planet with your probe...
			var statements = [];
			
			var statement = this.dbConn.createStatement(
							'INSERT OR REPLACE INTO "main"."'+this.db_espionage+'" ' +
							'("universe","galaxy","system","planet","time") VALUES ' +
							"(:uni,:galaxy,:system,:planet,strftime('%s')+90)");
							
			statement.params.uni = uni;
			statement.params.galaxy = galaxy;
			statement.params.system = system;
			statement.params.planet = planet;
			
			statements.push(statement);
			
			this.dbConn.executeAsync(statements,1);
		} catch(e) {
			alert("Error in insert_espionage_action: "+e);
		}
	},
	
	insert_fleet_action: function(uni,galaxy,system,planet,utc_time) {
		try {
			var statement = [this.dbConn.createStatement(
							'INSERT OR REPLACE INTO "main"."'+this.db_espionage+'" ' +
							'("universe","galaxy","system","planet","time") VALUES ' +
							"(:uni,:galaxy,:system,:planet,:utc_time)")];
							
							
			statement.params.uni = uni;
			statement.params.galaxy = galaxy;
			statement.params.system = system;
			statement.params.planet = planet;
			statement.params.utc_time = utc_time;
			
			this.dbConn.executeAsync(statement,1);
		} catch(e) {
			alert("Error in insert_fleet_action: "+e);
		}
	},
	
	delete_old_espionage_entries: function() {
		try {
			//delete entries older than 1 hour
			var statement = [galaxytoolbar.GTPlugin_storage.dbConn.createStatement(
								'DELETE FROM "main"."'+galaxytoolbar.GTPlugin_storage.db_espionage+'" ' +
								"WHERE time < (strftime('%s')-3600)")];
			galaxytoolbar.GTPlugin_storage.dbConn.executeAsync(statement,1);
		} catch(e) {
			alert("Error in delete_old_espionage_entries: "+e);
		}
	},
	
	caused_activity_self: function(url,galaxy,system,planet,minutes) {
		try {
			if (minutes == 7) {
				minutes = 15;
			} else {
				//rounding problems may occur otherwise
				minutes += 1;
			}
			
			//the time may not be in the future
			var statement = this.dbConn.createStatement('SELECT * FROM "main"."'+this.db_espionage+'" WHERE universe=:url'
														+' AND galaxy=:galaxy AND system=:system AND planet=:planet'
														+" AND time BETWEEN strftime('%s')-:minutes AND strftime('%s')");
														
			statement.params.url = url;
			statement.params.galaxy = galaxy;
			statement.params.system = system;
			statement.params.planet = planet;
			statement.params.minutes = minutes*60;
			
			while (statement.executeStep()) {
				statement.reset();
				return true;
			}
			
			return false;
		} catch(e) {
			//alert(e);
			return false;
		}
	},
	
	install: function() {
		// install latest DB table schema
		try {
			
			var tool_db_exists = this.dbConn.tableExists(this.db_tools);
			if (tool_db_exists) {
				return;
			}
			
			var statement = '' +
					'CREATE TABLE "'+this.db_tools+'" (' +
					'"id" INTEGER PRIMARY KEY  AUTOINCREMENT NOT NULL , ' +
					'"tool_name" VARCHAR NOT NULL DEFAULT "", ' +
					'"ogame_url" VARCHAR NOT NULL DEFAULT "", ' +
					'"tool_url" VARCHAR NOT NULL DEFAULT "", ' +
					'"tool_user" VARCHAR NOT NULL DEFAULT "", ' +
					'"tool_password" VARCHAR NOT NULL DEFAULT "", ' +
					'"tool_token" VARCHAR NOT NULL DEFAULT "", ' +
					'"universe" VARCHAR NOT NULL DEFAULT "", ' +
					'"is_ogeneral" VARCHAR NOT NULL DEFAULT false, ' +
					'"ogeneral_ip" VARCHAR NOT NULL DEFAULT "127.0.0.1",' +
					'"ogeneral_port" INTEGER NOT NULL DEFAULT 11000,' +
					'"submit_galaxy" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_stats" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_reports" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_allypage" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_buildings" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_research" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_fleet" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_defense" VARCHAR NOT NULL DEFAULT true, '+
					'"submit_empire" VARCHAR NOT NULL DEFAULT true, '+
					'"submit_shipyard" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_phalanx" VARCHAR NOT NULL DEFAULT true, ' +
					'"submit_fmovement" VARCHAR NOT NULL DEFAULT true, '+
					'"submit_espionage_action" VARCHAR NOT NULL DEFAULT true, '+
					'"submit_short_cr" VARCHAR NOT NULL DEFAULT true, '+
					'"submit_player_message" VARCHAR NOT NULL DEFAULT true, '+
					'"submit_player_message_c" VARCHAR NOT NULL DEFAULT false, '+
					'"tool_version_major" INTEGER NOT NULL DEFAULT 0, '+
					'"tool_version_minor" INTEGER NOT NULL DEFAULT 0, '+
					'"tool_version_revision" INTEGER NOT NULL DEFAULT 0 )';
			
			this.dbConn.executeSimpleSQL(statement);
			
			var languages_db_exists = this.dbConn.tableExists(this.db_languages);
			if (languages_db_exists) {
				return;
			}
			
			var statement2 = '' + 
					'CREATE TABLE "'+this.db_languages+'" (' +
					'"tool_id" INTEGER NOT NULL , ' +
					'"tech_name_english" VARCHAR NOT NULL , ' +
					'"tech_name" VARCHAR NOT NULL )';
					
			this.dbConn.executeSimpleSQL(statement2);
			
			//note: sqlite doesn't have a real date datatype
			var statement3 = '' +
				'CREATE TABLE "'+this.db_espionage+'" (' +
				'"universe" VARCHAR NOT NULL, ' +
				'"galaxy" INTEGER NOT NULL , ' +
				'"system" INTEGER NOT NULL , ' +
				'"planet" INTEGER NOT NULL , ' +
				'"time" INTEGER NOT NULL, ' +
				'PRIMARY KEY ("universe","galaxy", "system", "planet"))';
			
			this.dbConn.executeSimpleSQL(statement3);
			
			var statement4 = '' + 
					'CREATE TABLE "'+this.db_activities+'" (' +
					'"universe" VARCHAR NOT NULL , ' +
					'"playerid" VARCHAR NOT NULL , ' +
					'"rounded_time" VARCHAR NOT NULL )';
						
			this.dbConn.executeSimpleSQL(statement4);
		} catch(error) {
			alert("install error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	install_update_2_4: function() {
		try {
			var languages_db_exists = this.dbConn.tableExists(this.db_languages);
			if (!languages_db_exists) {
				var statement = '' + 
						'CREATE TABLE "'+this.db_languages+'" (' +
						'"tool_id" INTEGER NOT NULL , ' +
						'"tech_name_english" VARCHAR NOT NULL , ' +
						'"tech_name" VARCHAR NOT NULL )';
							
				this.dbConn.executeSimpleSQL(statement);
			}
			
			// it is not possible to add more than one column at the same time with SQLITE
			if(!this.column_exists(this.db_tools,"submit_empire")) {
				var statement5 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_empire" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement5);
			}
			
			if(!this.column_exists(this.db_tools,"tool_version_major")) {
				var statement2 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "tool_version_major" INTEGER NOT NULL DEFAULT 0';
				this.dbConn.executeSimpleSQL(statement2);
			}
			
			if(!this.column_exists(this.db_tools,"tool_version_minor")) {
				var statement3 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "tool_version_minor" INTEGER NOT NULL DEFAULT 0';
				this.dbConn.executeSimpleSQL(statement3);	
			}
			
			if(!this.column_exists(this.db_tools,"tool_version_revision")) {
				var statement4 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "tool_version_revision" INTEGER NOT NULL DEFAULT 0';
				this.dbConn.executeSimpleSQL(statement4);
			}
			
		} catch(error) {
			alert("install update 2.4 error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}	
	},
	
	install_update_2_5: function() {
		try {
			var espionages_db_exists = this.dbConn.tableExists(this.db_espionage);
			if (!espionages_db_exists) {
				var statement = '' + 
					'CREATE TABLE "'+this.db_espionage+'" (' +
					'"universe" VARCHAR NOT NULL, ' +
					'"galaxy" INTEGER NOT NULL , ' +
					'"system" INTEGER NOT NULL , ' +
					'"planet" INTEGER NOT NULL , ' +
					'"time" INTEGER NOT NULL , ' +
					'PRIMARY KEY ("universe","galaxy", "system", "planet"))';
				this.dbConn.executeSimpleSQL(statement);
			}
			
			if (!this.column_exists(this.db_tools,"submit_shipyard")) {
				var statement1 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_shipyard" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement1);
			}
			
			if (!this.column_exists(this.db_tools,"submit_phalanx")) {
				var statement2 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_phalanx" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement2);
			}
			
			if (!this.column_exists(this.db_tools,"submit_fmovement")) {
				var statement3 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_fmovement" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement3);
			}
			
			if (!this.column_exists(this.db_tools,"submit_espionage_action")) {
				var statement4 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_espionage_action" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement4);
			}
			
			if (!this.column_exists(this.db_tools,"submit_short_cr")) {
				var statement5 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_short_cr" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement5);
			}
			
			if (!this.column_exists(this.db_tools,"submit_player_message")) {
				var statement6 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_player_message" VARCHAR NOT NULL DEFAULT true';
				this.dbConn.executeSimpleSQL(statement6);
			}
			
			if (!this.column_exists(this.db_tools,"submit_player_message_c")) {
				var statement7 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "submit_player_message_c" VARCHAR NOT NULL DEFAULT false';
				this.dbConn.executeSimpleSQL(statement7);
			}
			
			
		} catch(error) {
			alert("install update 2.5 error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}	
	},
	
	install_update_2_6: function() {
		try {
			var statement5 = "";
			if (!this.column_exists(this.db_tools,"token")) {
				statement5 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "tool_token" VARCHAR NOT NULL DEFAULT ""';
				this.dbConn.executeSimpleSQL(statement5);
			}
			if (!this.column_exists(this.db_tools,"is_ogeneral")) {
				statement5 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "is_ogeneral" VARCHAR NOT NULL DEFAULT false';
				this.dbConn.executeSimpleSQL(statement5);
			}
			if (!this.column_exists(this.db_tools,"ogeneral_ip")) {
				statement5 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "ogeneral_ip" VARCHAR NOT NULL DEFAULT "127.0.0.1"';
				this.dbConn.executeSimpleSQL(statement5);
			}
			if (!this.column_exists(this.db_tools,"ogeneral_port")) {
				statement5 = '' +
						'ALTER TABLE "'+this.db_tools+'" '+
						'ADD COLUMN "ogeneral_port" INTEGER NOT NULL DEFAULT 11000';
				this.dbConn.executeSimpleSQL(statement5);
			}
		} catch(error) {
			alert("install update 2.6 error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}	
	},
	
	install_update_2_8: function() {
		try {
			var activities_db_exists = this.dbConn.tableExists(this.db_activities);
			if (!activities_db_exists) {
				var statement = '' + 
						'CREATE TABLE "'+this.db_activities+'" (' +
						'"universe" VARCHAR NOT NULL , ' +
						'"playerid" VARCHAR NOT NULL , ' +
						'"rounded_time" VARCHAR NOT NULL )';
							
				this.dbConn.executeSimpleSQL(statement);
			}
		} catch(error) {
			alert("install update 2.8 error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}	
	},
	
	insert_current_activities: function(sUniverseUrl, aPlayerIds, aDate) {
		// insert activities detected from chat bar (buddies and alliance member)
		// it is not intended to insert any other activities here - they would be deleted
		// as non-recent activities!
		try {
			if (!aPlayerIds || aPlayerIds.length == 0) {
				return;
			}
			var uni = sUniverseUrl.substring(8,sUniverseUrl.indexOf("/game"));
			
			// first delete outdated information
			var statement = this.dbConn.createStatement(
								'DELETE FROM "main"."'+this.db_activities+'" ' +
								"WHERE rounded_time < :rounded_time");
			statement.params.rounded_time = JSON.stringify(this._round_date(aDate));
			this.dbConn.executeAsync([statement],1);
			
			// then insert the new activities
			var statements = [];
			for (var i=0; i<aPlayerIds.length; i++) {
				var statement = this.dbConn.createStatement(
								'INSERT OR REPLACE INTO "main"."'+this.db_activities+'" ' +
								'("universe","playerid","rounded_time") VALUES ' +
								"(:uni,:playerid,:rounded_time)");
								
				statement.params.uni = uni;
				statement.params.playerid = aPlayerIds[i];
				statement.params.rounded_time = JSON.stringify(this._round_date(aDate));
				
				statements.push(statement);
			}
			
			// .. and save
			this.dbConn.executeAsync(statements,1);
			
		} catch(e) {
			alert("Error in insert_submitted_activities: "+e);
		}
	},
	
	read_current_activities: function(sUniverseUrl, aDate) {
		try {
			var uni = sUniverseUrl.substring(8,sUniverseUrl.indexOf("/game"));

			var aResult = new Array();
			
			var statement = this.dbConn.createStatement('SELECT playerid FROM "main"."'+this.db_activities+'" WHERE universe=:uni AND rounded_time=:rounded_time');
			statement.params.uni = uni;
			statement.params.rounded_time = JSON.stringify(this._round_date(aDate));
			
			while (statement.executeStep()) {
				aResult.push(statement.row.playerid);
			}

			return aResult;
		} catch(e) {
			alert("Error in read_current_activities: "+e);
		}
	},
	
	_round_date: function(aDate) {
		var date;
		var year = aDate[0];
		var month = aDate[1];
		var day = aDate[2];
		var hour = aDate[3];
		var minute = aDate[4];
		
		if (minute > 52) {
			date = new Date(aDate[0], aDate[1], aDate[2], aDate[3], aDate[4], 0, 0);
			date = new Date(date.getTime() + 10 *60000); // add 10 minutes to get next full hour (day, month or even year)

			year   = date.getFullYear();
			month  = date.getMonth() + 1;
			day    = date.getDate();
			hour   = date.getHours();
			minute = 0;
		} else if (minute < 8) {
			minute = 0;
		} else if (minute >= 8 && minute < 23) {
			minute = 15;
		} else if (minute >= 23 && minute < 38) {
			minute = 30;
		} else {
			minute = 45;
		}
		
		return [year, month, day, hour, minute, 0, 0];
	},
	
	reload_all_universe_names: function() {
		var statement = this.dbConn.createStatement('SELECT id,ogame_url FROM "main"."'+this.db_tools+'"');
		
		var statements = [];
		
		while (statement.executeStep()) {
			var id = statement.row.id;
			var url = statement.row.ogame_url;
			url = url.trim().replace(/^http:\/\//,"").replace(/(\/.*)*$/,"");
			
			if (url != statement.row.ogame_url) {
				var tmp = this.dbConn.createStatement('UPDATE "main"."'+this.db_tools+'" SET ogame_url=:ogame_url WHERE id=:id');
				tmp.params.id = id;
				tmp.params.ogame_url = url;
				statements.push(tmp);
			}
			galaxytoolbar.GTPlugin_options2.reload_ogame_servername(id,url,true);
		}
		this.dbConn.executeAsync(statements,statements.length);
	},
	
	column_exists: function(table,column){
		try {
			var statement = '' + 
							'SELECT '+column+' FROM "main"."'+table+'"';
			statement = this.dbConn.createStatement(statement);
			
			while (statement.executeStep()) {	
				statement.reset();	
				return true;
			}
			
			return false;
			
		} catch(column_does_not_exist) {
			return false;
		}
	},
	
	tool_exists: function(id) {
		try {
			var sqlquery = 'SELECT * FROM "main"."'+this.db_tools+'" WHERE id = :id';
			var statement = this.dbConn.createStatement(sqlquery);
			statement.params.id = id;
			
			while (statement.executeStep()) {
				statement.reset();
				return true;
			}
			
			return false;
			
		} catch(error) {
			alert("tool exists error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			return false;
		}
	},
	
	delete_tool: function(id) {
		try {
			if (id != null) {
				// Tool was loaded from SQLite
				var sqlquery = 'DELETE FROM "main"."'+this.db_tools+'" WHERE id = :id';
				var statement = this.dbConn.createStatement(sqlquery);
				statement.params.id = id;
				
				var sqlquery2 = 'DELETE FROM "main"."'+this.db_languages+'" WHERE tool_id = :id';
				var statement2 = this.dbConn.createStatement(sqlquery2);
				statement2.params.id = id;
				this.dbConn.executeAsync([statement,statement2],2);
			}
			
		} catch(error) {
			alert("delete tool error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}		
	},
	
	read_tools: function() {
		try {
			var return_value = new Array();
			var statement = "";
			
			statement = this.dbConn.createStatement('SELECT * FROM "main"."'+this.db_tools+'"');
			
			while (statement.executeStep()) {  
				var array_index = return_value.length;
				return_value[array_index] = new Object();
				return_value[array_index]["id"]					= statement.row.id;
				return_value[array_index]["deleted"]	   		= false;
				return_value[array_index]["updated"]	   		= false;
				return_value[array_index]["name"]		  		= statement.row.tool_name;
				return_value[array_index]["ogame_url"]	 		= statement.row.ogame_url;
				return_value[array_index]["tool_url"]	  		= statement.row.tool_url;
				return_value[array_index]["tool_version_major"] = statement.row.tool_version_major;
				return_value[array_index]["tool_version_minor"] = statement.row.tool_version_minor;
				return_value[array_index]["tool_version_revision"] = statement.row.tool_version_revision;
				return_value[array_index]["tool_user"]	 		= statement.row.tool_user;
				return_value[array_index]["tool_password"] 		= statement.row.tool_password;
				return_value[array_index]["tool_token"]			= statement.row.tool_token;
				return_value[array_index]["universe"]			= statement.row.universe;
				
				return_value[array_index]["is_ogeneral"]		= statement.row.is_ogeneral;
				return_value[array_index]["ogeneral_ip"]		= statement.row.ogeneral_ip;
				return_value[array_index]["ogeneral_port"]		= parseInt(statement.row.ogeneral_port);
				
				// universe data checkboxes
				return_value[array_index]["submit_galaxy"]   = statement.row.submit_galaxy;
				return_value[array_index]["submit_stats"]	= statement.row.submit_stats;
				return_value[array_index]["submit_reports"]  = statement.row.submit_reports;
				return_value[array_index]["submit_allypage"] = statement.row.submit_allypage;
				return_value[array_index]["submit_phalanx"] = statement.row.submit_phalanx;
				return_value[array_index]["submit_espionage_action"] = statement.row.submit_espionage_action;
				return_value[array_index]["submit_short_cr"] = statement.row.submit_short_cr;
				return_value[array_index]["submit_player_message"] = statement.row.submit_player_message;
				return_value[array_index]["submit_player_message_c"] = statement.row.submit_player_message_c;
				
				// own data checkboxes
				return_value[array_index]["submit_buildings"] = statement.row.submit_buildings;
				return_value[array_index]["submit_research"]  = statement.row.submit_research;
				return_value[array_index]["submit_fleet"]	 = statement.row.submit_fleet;
				return_value[array_index]["submit_defense"]   = statement.row.submit_defense;
				return_value[array_index]["submit_empire"]   = statement.row.submit_empire;
				return_value[array_index]["submit_shipyard"]   = statement.row.submit_shipyard;
				return_value[array_index]["submit_fmovement"]   = statement.row.submit_fmovement;
			}  
			
			return return_value;
			
		} catch(error) {
			alert("read tools error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}		
	},
	
	read_tool_ids_for_ogame_url: function(universe_url) {
		var ids = new Array();
		var statement = "";
		
		try {
			statement = this.dbConn.createStatement('SELECT id FROM "main"."'+this.db_tools+'" WHERE :universe_url LIKE \'%\' || ogame_url || \'%\'');
			statement.params.universe_url = universe_url;
			
			while (statement.executeStep()) {
				ids.push(statement.row.id);
			}
		
			return ids;
			
		} catch (error) {
			alert("read tools for ogame url error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	read_tools_for_ogame_url: function(universe_url) {
		try {
			var return_value = new Array();
			var statement	= "";
		
			statement = this.dbConn.createStatement('SELECT * FROM "main"."'+this.db_tools+'" WHERE :universe_url LIKE \'%\' || ogame_url || \'%\'');
			statement.params.universe_url = universe_url;
			
			while (statement.executeStep()) {
				var array_index = return_value.length;
				return_value[array_index] = new Object();
				return_value[array_index]["id"]					= statement.row.id;
				return_value[array_index]["deleted"]			= false;
				return_value[array_index]["updated"]			= false;
				return_value[array_index]["name"]				= statement.row.tool_name;
				return_value[array_index]["ogame_url"]			= statement.row.ogame_url;
				return_value[array_index]["tool_url"]			= statement.row.tool_url;
				return_value[array_index]["tool_version_major"] = statement.row.tool_version_major;
				return_value[array_index]["tool_version_minor"] = statement.row.tool_version_minor;
				return_value[array_index]["tool_version_revision"] = statement.row.tool_version_revision;
				return_value[array_index]["tool_user"]			= statement.row.tool_user;
				return_value[array_index]["tool_password"] 		= statement.row.tool_password;
				return_value[array_index]["tool_token"]			= statement.row.tool_token;
				return_value[array_index]["universe"]			= statement.row.universe;
				
				return_value[array_index]["is_ogeneral"]		= statement.row.is_ogeneral == "true" ? true : false;
				return_value[array_index]["ogeneral_ip"]		= statement.row.ogeneral_ip;
				return_value[array_index]["ogeneral_port"]		= parseInt(statement.row.ogeneral_port);
				
				// universe data checkboxes
				return_value[array_index]["submit_galaxy"]   = (statement.row.submit_galaxy == "true") ? true : false;
				return_value[array_index]["submit_stats"]	= (statement.row.submit_stats == "true") ? true : false;
				return_value[array_index]["submit_reports"]  = (statement.row.submit_reports == "true") ? true : false;
				return_value[array_index]["submit_allypage"] = (statement.row.submit_allypage == "true") ? true : false;
				return_value[array_index]["submit_phalanx"]  = (statement.row.submit_phalanx == "true") ? true : false;
				return_value[array_index]["submit_espionage_action"] = (statement.row.submit_espionage_action == "true") ? true : false;
				return_value[array_index]["submit_short_cr"] = (statement.row.submit_short_cr == "true") ? true : false;
				return_value[array_index]["submit_player_message"] = (statement.row.submit_player_message == "true") ? true : false;
				return_value[array_index]["submit_player_message_c"] = (statement.row.submit_player_message_c == "true") ? true : false;
				
				// own data checkboxes
				return_value[array_index]["submit_buildings"] = (statement.row.submit_buildings == "true") ? true : false;
				return_value[array_index]["submit_research"]  = (statement.row.submit_research == "true") ? true : false;
				return_value[array_index]["submit_fleet"]	 = (statement.row.submit_fleet == "true") ? true : false;
				return_value[array_index]["submit_defense"]   = (statement.row.submit_defense == "true") ? true : false;
				return_value[array_index]["submit_empire"]	= (statement.row.submit_empire == "true") ? true : false;
				return_value[array_index]["submit_shipyard"]  = (statement.row.submit_shipyard == "true") ? true : false;
				return_value[array_index]["submit_fmovement"] = (statement.row.submit_fmovement == "true") ? true : false;
			}
			
			return return_value;
			
		} catch(error) {
			alert("read tools for ogame url error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	tool_exists_for_ogame_url: function(universe_url) {
		var statement = "";
		
		try {
			statement = this.dbConn.createStatement('SELECT id FROM "main"."'+this.db_tools+'" WHERE  :universe_url LIKE \'%\' || ogame_url || \'%\'');
			statement.params.universe_url = universe_url;
			
			while (statement.executeStep()) {
				statement.reset();
				return true;
			}
		
			return false;
			
		} catch (error) {
			alert("read tools for ogame url error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			return false;
		}
	},

	target_tool_exists: function(universe_url,parameter) {
		try {
			var statement = "";
			
			switch(parameter) {
				case "galaxy"		: parameter = "submit_galaxy"; break;
				case "stats"		: parameter = "submit_stats"; break;
				case "reports"		: parameter = "submit_reports"; break;
				case "allypage"		: parameter = "submit_allypage"; break;
				case "espionage_action"  : parameter = "submit_espionage_action"; break;
				case "short_cr"		: parameter = "submit_short_cr"; break;
				case "message"		: parameter = "submit_player_message"; break;
				case "message_c"	: parameter = "submit_player_message_c"; break;
				case "buildings"	: parameter = "submit_buildings"; break;
				case "research"		: parameter = "submit_research"; break;
				case "fleet"		: parameter = "submit_fleet"; break;
				case "defense"		: parameter = "submit_defense"; break;
				case "shipyard"		: parameter = "submit_shipyard"; break;
				case "empire"		: parameter = "submit_empire"; break;
				case "phalanx"		: parameter = "submit_phalanx"; break;
				case "fmovement"	: parameter = "submit_fmovement"; break;
				case "ogeneral"		: parameter = "is_ogeneral"; break;
				default: parameter = "submit_galaxy";
			}
			
			statement = this.dbConn.createStatement('SELECT * FROM "main"."'+this.db_tools+'" WHERE :universe_url LIKE \'%\' || ogame_url || \'%\' AND ('+parameter+'=\'true\' OR is_ogeneral=\'true\')');
			statement.params.universe_url = universe_url;
			
			while (statement.executeStep()) {  
				//always reset statement when last execution returned true, so the table is not locked anymore
				statement.reset();
				return true;
			}
			
			return false;
			
		} catch(error) {
			alert("target_tool_exists error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			return false;
		}		
	},
	
	get_number_of_tools: function() {
		try {
			var return_value = 0;
			var statement	= "";
		
			statement = this.dbConn.createStatement('SELECT count(*) as number FROM "main"."'+this.db_tools+'"');
			
			statement.executeStep();
			return_value = parseInt(statement.row.number);
			statement.reset();
			
			return return_value;
		} catch(error) {
			alert("get number of tools error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			return 0;
		}		
	},
	
	update_universe_for_ogame_url: function(universe_url,universe_name) {
		try {
			var statement	= "";
			statement = this.dbConn.createStatement('UPDATE "main"."'+this.db_tools+'" SET universe = :universe WHERE :universe_url LIKE \'%\' || ogame_url || \'%\'');
			statement.params.universe = universe_name;
			statement.params.universe_url = universe_url;
			this.dbConn.executeAsync([statement],1);
			
		} catch(error) {
			alert("update universe for ogame url error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString+"\nQuery: "+query);
		}
	},
	
	update_galaxytool_version: function(tool_url,tool_version_major,tool_version_minor,tool_version_revision) {
		try {
			var statement = "";
			statement = this.dbConn.createStatement('UPDATE "main"."'+this.db_tools+'" '+
													'SET tool_version_major = :tool_version_major, '+
													'tool_version_minor = :tool_version_minor, '+
													'tool_version_revision = :tool_version_revision '+
													'WHERE tool_url = :tool_url');
			
			statement.params.tool_version_major = tool_version_major;
			statement.params.tool_version_minor = tool_version_minor;
			statement.params.tool_version_revision = tool_version_revision;
			
			statement.params.tool_url = tool_url;
			
			this.dbConn.executeAsync([statement],1);
		} catch(error) {
			alert("update galaxytool version error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	get_translation_for_language_file: function(tech_name_english,tool_id) {
		try {
			var statement	= "";
			statement = this.dbConn.createStatement('SELECT * FROM "main"."'+this.db_languages+'" '+
													'WHERE tech_name_english = :tech_name_english AND tool_id = :tool_id ');
			
			statement.params.tech_name_english = tech_name_english;
			statement.params.tool_id = tool_id;
			
			while (statement.executeStep()) {
				var tech = statement.row.tech_name;
				statement.reset(); 
				return tech;
			}
			
			alert("nothing found");
		} catch(error) {
			alert("get translation for language file error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
		}
	},
	
	copy_pref_data_to_db: function() {
		try {
			
			var Prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			
			// Tool 1-5
			for (var i = 1; i < 6; i++) {
				if (Prefs.getCharPref("gtplugin.settings.url"+i) != "") {
					galaxytoolbar.GTPlugin_storage.insert_tool(
						i, // ID
						"Tool"+i, // Tool Name
						Prefs.getCharPref("gtplugin.settings.ogameurl"+i), // Ogame URL
						Prefs.getCharPref("gtplugin.settings.url"+i), // tool url
						0, // galaxytool version major
						0, // galaxytool version minor
						0, // galaxytool version revision
						Prefs.getCharPref("gtplugin.settings.username"+i), // tool user
						Prefs.getCharPref("gtplugin.settings.password"+i), // tool password
						Prefs.getCharPref("gtplugin.settings.ogameuni"+i), // universe
						Prefs.getBoolPref("gtplugin.settings.submib_galaxy"), // submit galaxy
						Prefs.getBoolPref("gtplugin.settings.submib_stats"),// submit stats
						Prefs.getBoolPref("gtplugin.settings.submib_reports"),// submit reports
						Prefs.getBoolPref("gtplugin.settings.submib_allypage"),// submit allypage
						true, //submit espionage action
						true, //submit short cr
						true, //submit player message
						false, //submit player message content
						true, //submit phalanx
						Prefs.getBoolPref("gtplugin.settings.submib_buildings"),// submit buildings
						Prefs.getBoolPref("gtplugin.settings.submib_research"),// submit research
						Prefs.getBoolPref("gtplugin.settings.submib_fleet"),// submit fleet
						Prefs.getBoolPref("gtplugin.settings.submib_defense"),// submit defense
						true, //submit empire
						true, //submit shipyard
						true //submit fmovement
					);
				}
			}
		} catch(error) {
			// alert("copy pref data to db error: "+error+"\n\nSQL error details: "+this.dbConn.lastErrorString);
			// no error! If no prefs exist, this exception will be catched instead
		}
	},
	
	close: function() {
		if (this.dbConn != null) {
			try {
				// Firefox 4+
				this.dbConn.asyncClose();
			} catch (e) {
				// Firefox 3.6 does not support asynchClose, so try to close synchronously
				// (will fail, if asynch operations are waiting, and will create memory leak)
				try {
					this.dbConn.close();
				} catch(e2) {
					this.dbConn = null;
				}
		  	}
		}
	}
};