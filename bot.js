#!/usr/bin/env node

/**
 * g33kBot
 *
 * TODO:
 * 1. Youtube bot that responds to Youtube urls (catched via regex)
 * 2. Booru bot that responds to boory urls (requires more logic)
 * 3. Generic url bot that returns simplified info
 * 4. Add HTTP Server for remote commands (to be used with foobar~)
 *
 * Build a more flexible and secure admin/mod list (and check hostname or login status(?))
 *
 * TRIGGERS: (! && .)
 *
 * TRIGGER  (alt)		ARGS				STATUS 				ETA			DESCRIPTION 																		EXAMPLE OUTPUT
 * OP 					USERNAMES			NEEDS POLISHING					Gives +o status to target(s)
 * DEOP 				USERNAMES			NEEDS POLISHING 				Takes +o status from target(s)
 * LMGTFY (GOOGLE)		SEARCHQUERY			NOT STARTED 					Return top three search results														TOP3 Google Searchresults for <QUERY>:
 * 4C (4THREAD)			/board/##			NOT STARTED 					Return thread OP and replycount (inc images & age & last post timestamp)			Board: Animu & Mango  Title: none - Anonymous [SAGE] - OP MESSAGE HERE (144 post, 4 images, last post: 15 minutes ago)
 * MOGRACAL				(optional)DATE 		NOT STARTED 					Returns events for date (if given) or event coming week if no date is given
 * YSEARCH (youtube|yt)	QUERY 				NOT STARTED 					Returns first five results and a link to result page from Youtube
 * RMUTE 				NONE 				NOT STARTED 					Take +v from a random user for 15 minutes. LIMIT USAGE AND PREVENT  -v from OP 		<BOTNAME> Spins the wheel. <3sec sleep> <BOT> takes voice from <TARGET>.
 * 8BALL 									NOT STARTED
 *
 */


var irc  	= require('./lib/irc.js');
var util 	= require('util');
var color 	= require('ansi-color').set;
var jsdom 	= require('jsdom').jsdom;
var http 	= require('http');
var https	= require('https');
var youtube = require('youtube-api');
var window = jsdom().createWindow();

// Initialize stuff
youtube.authenticate({
	type:"oath",
	token: "secret"
});

function Bot() {};

Bot.prototype.construct = function() {};

Bot.extend = function(def) {
	var classDef = function() {
		if(arguments[0] !== Bot) { this.construct.apply(this, arguments); }
	};

	var proto = new this(Bot);
	var superClass = this.prototype;

	for (var n in def) {
		var item = def[n];
		if (item instanceof Function) item.$ = superClass;
		proto[n] = item;
	}

	classDef.prototype = proto;

	classDef.extend = this.extend;
	return classDef;
};

Bot.prototype.init = function() {};

var g33kBot = Bot.extend({
	construct: function(client) {
		var c = client;
		var self = s = this;
		var caller = null;
		var target = null;
		self.opt = {
			debug: false
		};
		self.conf = {
			triggers: [".","!"]
		}
		self.admins = ["PBX_g33k"];
	},
	administer: function ( from, variable, value ) {},

	log: function ( message ) {
		if( this.opt.debug ) {
			util.log("g33kBot: " + message );
		}
	},

	checkPermission: function( caller ) {
		return ( s.admins.indexOf(caller) != -1 ); // need to extend this ASAP
	},

	actionOp: function ( msg, channel ) {
		// Check if admin calls the action
		if( s.checkPermission(this.caller) ) {
			var targets = s.getArgs(msg);
			for (var i = targets.length - 1; i >= 0; i--) {
				c.send('MODE', channel, '+o', targets[i]);
			};
			//c.send('MODE', channel, '+o', )
		} else {
			c.say(channel, "fuck you, you are not allowed to do this");
		}
	},

	actionDeop: function ( msg, channel ) {
		if( s.checkPermission(this.caller) ) {
			var targets = s.getArgs(msg);
			for (var i = targets.length - 1; i >= 0; i--) {
				c.send('MODE', channel, '-o', targets[i]);
			};
			//c.send('MODE', channel, '+o', )
		} else {
			c.say(channel, "fuck you, you are not allowed to do this");
		}
	},

	actionDie: function () {
		if( s.checkPermission(this.caller) ) {
			process.exit(0);
		}
	},

	actionThread: function( msg, channel ) {
		c.say( channel, "this method has not been implemented yet");
	},

	messageTrigger: function ( from, to, txt, message ) {
		console.log("FUNC::messageTrigger("+from + "," + to + "," + txt + "," + message+")");
		var self = this;

		caller = from;
		target = to;
		var msg = txt;
		var trigger = msg.substr(0,1);
		var irchChannel = to;//message.args[1];
		// Search for triggers
		if( self.conf.triggers.indexOf( trigger ) != -1 )
		{
			var endMethodName = msg.indexOf(" ");
			if(endMethodName == -1) endMethodName = msg;
			var methodName = "action" + capitaliseFirstLetter(msg.substr(1,endMethodName)).trim();
			var fn = self[methodName];

			if( typeof fn == 'function' || typeof fn == 'object')
			{
				//c.say( irchChannel, 'note: i am broken');
				fn(msg, target);
			}
		} else if ( yRaw = /(?:http:\/\/)?w{0,3}\.?youtu\.?be(?:(?:[^' '\n\r]+v=)|(?:[^' '\n\r&#]*\/))([^' '\n\r&#]+)(?:&[^' '\n\r]+)?/gm.exec(msg) ) {
			var yID = '';
			if(typeof yRaw[1] != 'undefined'){ yID = yRaw[1];
			}else if(typeof yRaw[2] != 'undefined'){ yID = yRaw[2];
			}else{ c.say( irchChannel, irc.colors.wrap('red', 'Something went wrong. PBX_g33k!! Fix me you lazy ass developer. ERR:YT01' )); }
			console.log("RAWR!!!");
			console.log(yRaw);
			console.log(msg);
			youtube.videos.list({
				"part":"id,snippet,statistics",
				"id":yID
			}, function( err, data ){
				if( err != null )
				{
					console.log("ERR::YOUTUBE");
					c.say( irchChannel, irc.colors.wrap('red', 'Something went wrong. PBX_g33k!! Fix me you lazy ass developer. ERR:YT02' ));
				} else {
					var items = data.items[0];
					//for (var i = items.length - 1; i >= 0; i--) {
						var snippet = items.snippet;
						var statistics = items.statistics;
						// Example line: youTube: [TITLE] 【IA】Liberator - taishi【Original MMD-PV】 [UPLOADER] Vanguard Sound Studio [VIEWS] 5030 [LIKES] 273 [COMMENTS] 20
						var line =
							'\u00031,0You\u00030,4Tube\u000f: \u0002\u000310[TITLE]\u000f ' +
							snippet.title +
							' \u0002\u000310[UPLOADER]\u000f ' +
							snippet.channelTitle +
							' \u0002\u000310[VIEWS]\u000f ' +
							statistics.viewCount +
							' \u0002\u000310[LIKES]\u000f ' +
							statistics.likeCount +
							' \u0002\u000310[COMMENTS]\u000f ' +
							statistics.commentCount
						;
						c.say( irchChannel, line );
					//};

				}



			});
		}
		// We didn't find a trigger
		// TODO:
		// 1. youtube url parser
		// 		-> return info from Youtube API
		// 2. *booru url parser
		// 		-> Show title, image safety and the likes
		// 3. generic url parser
		// 		-> Show page title
	},

	/**
	 * Returns video information by passing a youtube URL
	 * @param  {string} videoid 	parsed videoid
	 * @return {object}     		An object containing all information about the video
	 */
	parseYoutube: function (videoID) {

	},

	getArgs: function (msg) {
		var argsRaw = msg.substr( msg.indexOf(" ") );
		return this.splitArgs(argsRaw);
	},

	splitArgs: function (args) {
		return args.split(" ");
	}
});

//Some dumb shit
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var bot = new g33kBot(c);
var c = new irc.Client(
    'irc.rizon.net',
    'g33kBot',
    {
    	//#password: 'PBX_g33k:Denizli!',
    	channelPrefixes: "#",
        channels: ["#pswg-devel mikuisolev"]
    }
);

c.addListener('raw', function(message) { console.log('raw: ', message) });
c.addListener('error', function(message) { console.log(color('error: ', 'red'), message) });
c.addListener('message#', function( from, to, text, message ) { bot.messageTrigger( from, to, text, message ); });

var repl = require('repl').start('> ');
repl.context.repl = repl;
repl.context.util = util;
repl.context.irc = irc;
repl.context.c = c;

repl.inputStream.addListener('close', function() {
    console.log("\nClosing session");
    c.disconnect('Closing session');
});