'use strict';

const commands = new Map();

// commands.set('play', {
//   name: 'play',
//   description: 'Play the current queue',
//   execute: function (msg) {
//     let voiceChannel = msg.author.getVoiceChannel(msg.guild);
//     if (!voiceChannel) return msg.channel.sendMessage('You should be in a voice channel first.');
//     this.player.play(voiceChannel).catch(err => console.error(err));
//   }
// });

commands.set('play', {
  name: 'play',
  description: 'Add a song to the queue.',
  execute: function (msg, args) {
    let voiceChannel = msg.author.getVoiceChannel(msg.guild);

    if (!voiceChannel) return msg.channel.sendMessage('You should be in a voice channel first.');
    if (!args.length) return msg.channel.sendMessage('Usage: play [url]');

    this.player.add(msg.guild.id, voiceChannel, args[0]).then((info) => {
      msg.channel.sendMessage(`Added ${info.title} to the queue.`);
    }).catch(err => console.error(err));
  }
});

commands.set('stop', {
  name: 'stop',
  description: 'Stop playing.',
  execute: function (msg) {
    let voiceChannel = msg.author.getVoiceChannel(msg.guild);
    this.player.stop(voiceChannel);
  }
});

commands.set('skip', {
  name: 'skip',
  description: 'Skip the current song.',
  execute: function (msg) {
    this.player.skip(msg);
  }
});

commands.set('list', {
  name: 'list',
  description: 'List the songs in queue.',
  execute: function (msg) {
    let list = this.player.list(msg),
        msgArray = [];

    msgArray.push('```');
    for (let i in list) {
      let info = list[i];
      msgArray.push(`${++i}: ${info.title} ${info.betterTime}`);
    }
    msgArray.push('```');

    msg.channel.sendMessage(msgArray.join("\n"));
  }
});

commands.set('clear', {
  name: 'clear',
  description: 'Clear the queue.',
  execute: function (msg) {
    this.player.clear();
    msg.channel.sendMessage('The queue is empty.');
  }
});

commands.set('remove', {
  name: 'remove',
  description: 'Remove a song from the queue.',
  execute: function (msg, args) {
    let index = (args.length && !isNaN(parseInt(args[0], 10))) ? args[0] : 1;

    const result = this.player.remove(msg.guild.id, index);
    msg.channel.sendMessage(`Removed ${result.title}`);
  }
});

commands.set('pause', {
  name: 'pause',
  description: 'Pause playing the current song.',
  execute: function (msg) {
    msg.channel.sendMessage(':middle_finger:');
  }
});

commands.set('resume', {
  name: 'resume',
  description: 'Resume playing the current song.',
  execute: function (msg) {
    msg.channel.sendMessage(':middle_finger:');
  }
});

commands.set('invite', {
  name: 'invite',
  description: 'Generates a bot invite link.',
  execute: function (msg) {
    this.client.User.getApplication().then((application) => {
      msg.channel.sendMessage(`To invite the bot to your server, click here:
https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot`);
    });
  }
});

commands.set('ping', {
    name: 'ping',
    description: 'ping pong ping pong',
    hideFromHelp: true,
    execute: function(msg) {
        let start = process.hrtime();
        msg.channel.sendMessage('pong').then((message) => {
            let diff = Math.round(process.hrtime(start)[1]/1000000);
            message.edit("pong `"+diff+"ms`");
        });
    }
});

module.exports = commands;
