const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const { triggerAsyncId } = require("async_hooks");

const client = new Discord.Client();

require("./ExtendedMessage");

client.login(config.BOT_TOKEN);

/* -------------------------------------------------------------------------- */
/*                       Funciones y estructuras utiles                       */
/* -------------------------------------------------------------------------- */
function obtenerSettings(){
    return JSON.parse(fs.readFileSync(__dirname + "/settings.json", "utf-8"));
}
function guardarSettings(objeto){
    fs.writeFileSync("./settings.json", JSON.stringify(objeto));
}
function normalizeMessageInfo(message_name, message_content){
    let message_obj = {
        message_name: message_name,
        message_content: message_content,
        dates: []
    }
    return message_obj;
}
function normalizeDate(day, hour, minute){
    let date = {
        day: day,
        hour: hour,
        minute: minute==undefined?"00":minute
    }
    return date;
}

function validHour(hour){
    if(isNaN(hour)){
        return false;
    }
    if(hour > 23 || hour < 0){
        return false;
    }else{
        return true;
    }
}
function validMinute(minute){
    if(minute === undefined){
        return true;
    }
    if(isNaN(minute)){
        return false;
    }
    if(minute > 59 || minute < 0){
        return false;
    }else{
        return true;
    }
}

function dateExists(dateList, dateObj){
    let found = dateList.find((e)=>{
        return (e.day === dateObj.day) && (e.hour === dateObj.hour) && (e.minute === dateObj.minute);
    });
    if(found === undefined){
        return false;
    }else{
        return true;
    }
}

function successMessage(action){
    const embed = {
        "description": EMOJIS.confirmation + " " + action,
        "url": "https://discordapp.com",
        "color": 8311585
    };
    return {embed};
}
function errorMessage(action){
    const embed = {
        "description": EMOJIS.error + " " + action,
        "url": "https://discordapp.com",
        "color": 13632027
    };
    return {embed};
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const COMMANDS = ["help", "prefix", "createscheduledmessage", "showmessagecontent", "changemessagecontent", "removescheduledmessage", "addnewdate", "removedate", "test"];
const EMOJIS = {
    e100: "<:100:911514881818251294>",
    confirmation: "<:white_check_mark:911516809394528307>",
    error: "<:bangbang:911663442128150601>"
}

let helpMessage = "Commands: \n"
                 +"    help";

/**
 * Comandos
 *  0. help
 *  1. prefix <prefix>
 * 
 *  2. createscheduledmessage <message_name> <message> 
 *  3. showmessagecontent <message_name>
 *  4. changemessagecontent <message_name> <new_message_content>
 *  5. removescheduledmessage <message_name>
 * 
 *  6. addnewdate <message_name> <day> <hour> <*minute>
 *  7. removedate <message_name> <day> <hour> <*minute>
 */

client.on("ready", function(){
    console.log("The client is ready");
    
});
client.on("message", function(message){
    let settings = obtenerSettings();

    if(message.author.bot) return;
    if(!message.content.startsWith(settings.prefix)) return;

    const commandBody = message.content.slice(settings.prefix.length);
    const args = commandBody.split(" ").map(function(element){
        return element.trim();
    }).filter(function(element){
        return element !== "";
    });
    const command = args.shift().toLowerCase();

    if(!COMMANDS.includes(command)) return;

    /* -------------------------------------------------------------------------- */
    /*                                   Actions                                  */
    /* -------------------------------------------------------------------------- */

    /* ------------------------------ help command ------------------------------ */
    if(command === COMMANDS[0]){
        message.channel.send(helpMessage);

    /* ----------------------------- prefix command ----------------------------- */
    }else if(command === COMMANDS[1]){
        if(args.length !== 1){
            message.channel.send("Wrong number of arguments for command: " + command);
        }else if(args[0].length !== 1){
            message.channel.send("Prefix must be a single character");
        }else{
            settings.prefix = args[0].toLowerCase();
            message.channel.send("New prefix set: " + settings.prefix);
            guardarSettings(settings);
        }
    
    /* --------------------- createscheduledmessage command --------------------- */
    }else if(command === COMMANDS[2]){
        if(args.length < 2){
            message.channel.send("Wrong number of arguments for command: " + command);
            return;
        }

        let message_name = args.shift().toLowerCase();
        let encontrado = settings.messageList.find(element => {
            return element.message_name === message_name;
        });
        if(encontrado !== undefined){
            message.channel.send("This message already exists");
            return;
        }
        
        let messageStr = args.join(" ");

        let messageObj = normalizeMessageInfo(message_name, messageStr);
        settings.messageList.push(messageObj);
        guardarSettings(settings);

        let confirmationMessage = "Scheduled message created: \n"
                                + "     Message name: " + messageObj.message_name + "\n"
                                + "     Message content: " + messageObj.message;
        message.channel.send(confirmationMessage);
    
    /* ------------------------ showmessagecontent command ----------------------- */
    }	else if(command === COMMANDS[3]){
        if(args.length > 1){
            message.channel.send("Too many arguments for command: " + command);
            return;
        }

        let messageInfo = settings.messageList.find(function(element){
            return args[0] === element.message_name;
        });
        if(messageInfo === undefined){
            message.channel.send("That message doesn't exist");
            return;
        }

        message.inlineReply("Message: " + messageInfo.message_content)
        
    /* ---------------------- changemessagecontent command ---------------------- */
    }else if(command === COMMANDS[4]){
        if(args.length < 2){
            message.channel.send("Wrong number of arguments for command: " + command);
            return;
        }

        let messageStr = args.slice(1, args.length).join(" ");

        let index = settings.messageList.map(e => e.message_name).indexOf(args[0]);

        if(index === -1){
            message.channel.send("That message doesn't exist");
            return;
        }

        settings.messageList[index].message_content = messageStr;
        guardarSettings(settings);
        message.channel.send("Message " + args[0] + " updated successfuly");

    /* --------------------- removescheduledmessage command --------------------- */
    }else if(command === COMMANDS[5]){
        if(args.length > 1){
            message.channel.send("Wrong number of arguments for command: " + command);
            return;
        }
        let index = settings.messageList.map(e => e.message_name).indexOf(args[0]);
        if(index === -1){
            message.channel.send("That message doesn't exist");
            return;
        }

        settings.messageList.splice(index, 1);
        guardarSettings(settings);
        message.channel.send(successMessage("Message " + args[0] + " deleted successfuly"));

    /* --------------------------- addnewdate command --------------------------- */
    }else if(command === COMMANDS[6]){
        if(args.length !== 3 && args.length !== 4){
            message.channel.send(errorMessage("Wrong number of arguments for command **" + command + "**\n See **help** for more information on how to use it"));
            return;
        }
        let index = settings.messageList.map(e => e.message_name).indexOf(args[0]);
        if(index === -1){
            message.channel.send(errorMessage("That message doesn't exist"));
            return;
        }
        if(!WEEKDAYS.includes(args[1].toLowerCase()) || !validHour(args[2]) || !validMinute(args[3])){
            message.channel.send(errorMessage("Invalid date"));
            return;
        }
        let dateObj = normalizeDate(args[1], args[2], args[3]);
        if(dateExists(settings.messageList[index].dates, dateObj)){
            message.channel.send(errorMessage("That date is already registered in this message"));
            return;
        }

        settings.messageList[index].dates.push(dateObj);
        guardarSettings(settings);
        message.channel.send(successMessage("Date added successfuly"));


    /* --------------------------- removedate command --------------------------- */
    }else if(command === COMMANDS[7]){


    }else if(command === COMMANDS[8]){
        message.channel.send(successMessage("Message updated successfully"));
        message.channel.send(errorMessage("Wrong number of arguments"));
    }
});