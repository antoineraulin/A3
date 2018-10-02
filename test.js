var lastCmd = ["dir", "cd C:\ & dir", "sucesmesboules", ""];
var pos = 1;
var keypress = require('keypress');

process.stdout.write("shell> ");
keypress(process.stdin);

process.stdin.on("keypress", function (ch, key) {
    if (key.name == "up") {
        if(pos + 1 <= lastCmd.length){
        pos++;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write("shell> "+lastCmd[lastCmd.length - pos]);
        }
    }else if(key.name == "down"){
        if(pos - 1 > 0){
            pos--;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write("shell> "+lastCmd[lastCmd.length - pos]);
            }
    }
    if (key && key.ctrl && key.name == 'c') {
        process.exit()
      }    
});

setTimeout(function(){
    //useless
},60000);

process.stdin.setRawMode(true);
process.stdin.resume();