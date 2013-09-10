#!/usr/bin/env node

var irc  	= require('./lib/irc.js');
var util 	= require('util');
var color 	= require('ansi-color').set;
var jsdom 	= require('jsdom').jsdom;
var http 	= require('http');
var https	= require('https');

var window = jsdom().createWindow();

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

	actionOp: function ( msg, channel ) {
		// Check if admin calls the action
		if( s.admins.indexOf(this.caller) != -1 ) {
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
		if( s.admins.indexOf(this.caller) != -1 ) {
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
		if( s.admins.indexOf(this.caller) != -1 ) {
			process.exit(0);
		}
	},

	messageTrigger: function ( from, to, txt, message ) {
		var self = this;

		caller = from;
		target = to;
		var msg = txt;
		var trigger = msg.substr(0,1);
		// Search for triggers
		if( self.conf.triggers.indexOf( trigger ) != -1 )
		{
			var endMethodName = msg.indexOf(" ");
			if(endMethodName == -1) endMethodName = msg;
			var methodName = "action" + capitaliseFirstLetter(msg.substr(1,endMethodName)).trim();
			var fn = self[methodName];
			var channel = message.args[1];

			if( typeof fn == 'function' || typeof fn == 'object')
			{
				c.say( channel, 'note: i am broken');
				fn(msg, target);
			}
		}
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

function execV(functionName, context /*, args */) {
  var args = Array.prototype.slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(this, args);
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