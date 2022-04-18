const Discord = require("discord.js");
const config = require("./config.json");
const cron = require("cron");
const fs = require("fs");
let settings = obtenerSettings();
let channel;

/* Un bot no puede llamar a otro bot */

const client = new Discord.Client();
client.login(config.BOT_TOKEN);

require("./ExtendedMessage");

/* new cron.cronJob(minute, hour, monthDay, month, weekday); */
/* client.channels.cache.find(channel => channel.name === "bot-tests"); */

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const COMMANDS = ["help", "prefix", "createscheduledmessage", "showmessageinfo", "changemessagecontent", "removescheduledmessage", "addnewdate", "removedate", "showallmessages", "test"];
const SC_COMMANDS = ["", "", "csm", "smi", "cmc", "rsm", "and", "rd", "sam", ""];
const EMOJIS = {
    e100: "<:100:911514881818251294>",
    confirmation: "<:white_check_mark:911516809394528307>",
    error: "<:bangbang:911663442128150601>",
    information: "<:blue_circle:912041543693643817>"
}

let helpMessage = "Commands: \n"
                +" - help </command>\n"
                +" - prefix <prefix>\n"
                +" - createscheduledmessage (csm) <message_name> <message>\n"
                +" - showmessageinfo (smi) <message_name>\n"
                +" - changemessagecontent (cmc) <message_name> <new_message_content>\n"
                +" - removescheduledmessage (rsm) <message_name>\n"
                +" - addnewdate (and) <message_name> <day> <hour> </minute>\n"
                +" - removedate (rd) <message_name> <day> <hour> </minute>\n"
                +" - showmessages (sam) <message_name> <day> <hour> </minute>\n"

/*
 * Comandos
 *  0. help
 *  1. prefix <prefix>
 * 
 *  2. createscheduledmessage <message_name> <message> 
 *  3. showmessageinfo <message_name>
 *  4. changemessagecontent <message_name> <new_message_content>
 *  5. removescheduledmessage <message_name>
 * 
 *  6. addnewdate <message_name> <day> <hour> <*minute>
 *  7. removedate <message_name> <day> <hour> <*minute>
 *  8. showallmessages
 */

/* -------------------------------------------------------------------------- */
/*                       Funciones y estructuras utiles                       */
/* -------------------------------------------------------------------------- */
function obtenerSettings(){
    return JSON.parse(fs.readFileSync(__dirname + "/settings.json", "utf-8"));
}
function guardarSettings(objeto){
    fs.writeFileSync("./settings.json", JSON.stringify(objeto));
}

function createAndStartJob(message, channel, date){
    let crontime = `${date.minute} ${date.hour} * * ${WEEKDAYS.indexOf(date.day)}`;
    let job = new cron.CronJob(crontime, ()=>{
        channel.send(message);
    });
    job.start();
}
function startJobs(messageList){
    messageList.forEach(e => {
        e.dates.forEach(element => {
            createAndStartJob(e.content, e.channel, element);
        });
    });
}

function normalizeMessageInfo(name, channel, content){
    let obj = {
        name: name,
        channel: channel,
        content: content,
        dates: []
    }
    return obj;
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
    return dateList.find((e)=>{
        return (e.day === dateObj.day) && (e.hour === dateObj.hour) && (e.minute === dateObj.minute);
    });
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
function informativeMessage(action){
    const embed = {
        "description": action,
        "url": "https://discordapp.com",
        "color": 4886754
    };
    return {embed};
}

/**
 * Comandos
 *  0. help
 *  1. prefix <prefix>
 * 
 *  2. createscheduledmessage <message_name> <message> 
 *  3. showmessageinfo <message_name>
 *  4. changemessagecontent <message_name> <new_message_content>
 *  5. removescheduledmessage <message_name>
 * 
 *  6. addnewdate <message_name> <day> <hour> <*minute>
 *  7. removedate <message_name> <day> <hour> <*minute>
 */

client.on("ready", function(){
    console.log("The client is ready");
    channel = client.channels.cache.find(channel => channel.name === "bot-tests");
    startJobs(settings.messageList);
});
client.on("message", function(message){
    settings = obtenerSettings();
    channel = message.channel;

    if(message.author.bot) return;
    if(!message.content.startsWith(settings.prefix)) return;

    const commandBody = message.content.slice(settings.prefix.length);
    const args = commandBody.split(" ").map(function(element){
        return element.trim();
    }).filter(function(element){
        return element !== "";
    });
    const command = args.shift().toLowerCase();

    if(!COMMANDS.includes(command) && !SC_COMMANDS.includes(command)) return;

    /* -------------------------------------------------------------------------- */
    /*                                   Actions                                  */
    /* -------------------------------------------------------------------------- */

    /* ------------------------------ help command ------------------------------ */
    if(command === COMMANDS[0]){
        message.channel.send(informativeMessage(helpMessage));

    /* ----------------------------- prefix command ----------------------------- */
    }else if(command === COMMANDS[1]){
        if(args.length !== 1){
            message.channel.send(errorMessage("Wrong number of arguments for command: " + command));
        }else if(args[0].length !== 1){
            message.channel.send(errorMessage("Prefix must be a single character"));
        }else{
            settings.prefix = args[0].toLowerCase();
            message.channel.send(successMessage("New prefix set: " + settings.prefix));
            guardarSettings(settings);
        }
    
    /* --------------------- createscheduledmessage command --------------------- */
    }else if(command === COMMANDS[2] || command === SC_COMMANDS[2]){
        if(args.length < 2){
            message.channel.send(errorMessage("Wrong number of arguments for command: " + command));
            return;
        }

        let message_name = args.shift().toLowerCase();
        let encontrado = settings.messageList.find(element => {
            return element.name === message_name;
        });
        if(encontrado !== undefined){
            message.channel.send(errorMessage("This message already exists"));
            return;
        }
        
        let messageStr = args.join(" ");

        let messageObj = normalizeMessageInfo(message_name, message.channel, messageStr);
        settings.messageList.push(messageObj);
        guardarSettings(settings);

        let confirmationMessage = successMessage("Scheduled message created: \n"
                                + "     Message name: " + messageObj.name + "\n"
                                + "     Message content: " + messageObj.content);
        message.channel.send(confirmationMessage);
    
    /* ------------------------- showmessageinfo command ------------------------ */
    }	else if(command === COMMANDS[3] || command === SC_COMMANDS[3]){
        if(args.length > 1){
            message.channel.send(errorMessage("Too many arguments for command: " + command));
            return;
        }

        let messageInfo = settings.messageList.find(function(element){
            return args[0] === element.name;
        });
        if(messageInfo === undefined){
            message.channel.send(errorMessage("That message doesn't exist"));
            return;
        }

        let fullMessage = "**Message**: " + messageInfo.content + "\n**Dates:**";
        messageInfo.dates.forEach(element => {
            let minutes = element.minute<10?"0"+element.minute:element.minute;
            fullMessage += "\n - " + element.day[0].toUpperCase()+element.day.slice(1, element.day.length) + " at " + element.hour + ":" + minutes;
        });
        message.inlineReply(informativeMessage(fullMessage));
        
    /* ---------------------- changemessagecontent command ---------------------- */
    }else if(command === COMMANDS[4] || command === SC_COMMANDS[4]){
        if(args.length < 2){
            message.channel.send(errorMessage("Wrong number of arguments for command: " + command));
            return;
        }

        let messageStr = args.slice(1, args.length).join(" ");

        let index = settings.messageList.map(e => e.name).indexOf(args[0]);

        if(index === -1){
            message.channel.send(errorMessage("That message doesn't exist"));
            return;
        }

        settings.messageList[index].content = messageStr;
        guardarSettings(settings);
        message.channel.send(successMessage("Message " + args[0] + " updated successfuly"));

    /* --------------------- removescheduledmessage command --------------------- */
    }else if(command === COMMANDS[5] || command === SC_COMMANDS[5]){
        if(args.length > 1){
            message.channel.send(errorMessage("Wrong number of arguments for command: " + command));
            return;
        }
        let index = settings.messageList.map(e => e.name).indexOf(args[0]);
        if(index === -1){
            message.channel.send(errorMessage("That message doesn't exist"));
            return;
        }

        settings.messageList.splice(index, 1);
        guardarSettings(settings);
        message.channel.send(successMessage("Message " + args[0] + " deleted successfuly"));

    /* --------------------------- addnewdate command --------------------------- */
    }else if(command === COMMANDS[6] || command === SC_COMMANDS[6]){
        if(args.length !== 3 && args.length !== 4){
            message.channel.send(errorMessage("Wrong number of arguments for command **" + command + "**\n See **help** for more information on how to use it"));
            return;
        }
        let index = settings.messageList.map(e => e.name).indexOf(args[0]);
        if(index === -1){
            message.channel.send(errorMessage("That message doesn't exist"));
            return;
        }
        if(!WEEKDAYS.includes(args[1].toLowerCase()) || !validHour(args[2]) || !validMinute(args[3])){
            message.channel.send(errorMessage("Invalid date"));
            return;
        }
        let dateObj = normalizeDate(args[1], args[2], args[3]);
        if(dateExists(settings.messageList[index].dates, dateObj) !== undefined){
            message.channel.send(errorMessage("That date is already registered in this message"));
            return;
        }

        settings.messageList[index].dates.push(dateObj);
        guardarSettings(settings);
        createAndStartJob(settings.messageList[index].content, message.channel, dateObj);
        message.channel.send(successMessage("Date added successfuly"));


    /* --------------------------- removedate command --------------------------- */
    }else if(command === COMMANDS[7] || command === SC_COMMANDS[7]){
        if(args.length !== 3 && args.length !== 4){
            message.channel.send(errorMessage("Wrong number of arguments for command: " + command));
            return;
        }
        let index = settings.messageList.map(e => e.name).indexOf(args[0]);
        if(index === -1){
            message.channel.send(errorMessage("That message doesn't exist"));
            return;
        }
        let dateObj = normalizeDate(args[1], args[2], args[3]);
        let dateIndex = dateExists(settings.messageList[index].dates, dateObj);
        if(dateIndex === undefined){
            message.channel.send(errorMessage("That date for that message doesn't exist"));
            return;
        }

        settings.messageList[index].dates.splice(dateIndex, 1);
        guardarSettings(settings);
        message.channel.send(successMessage("Date for message " + args[0] + " deleted successfully"));

    /* ------------------------------ showmessages ------------------------------ */
    }else if(command === COMMANDS[8] || command === SC_COMMANDS[8]){
        let fullMessage = "List of messages: \n";
        settings.messageList.forEach(element => {
            fullMessage += " - " + element.name + ": " + element.content + "\n"
        });
        message.channel.send(informativeMessage(fullMessage));
    }
});