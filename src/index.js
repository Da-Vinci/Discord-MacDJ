const Discord = require('discord.js');
const app = require('./app/main');
const bot = new Discord.Client();

// start electron app
app(bot);