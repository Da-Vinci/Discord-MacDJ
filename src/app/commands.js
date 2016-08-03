'use strict';

const commands = new Map();

commands.set('play', {
  name: 'play',
  description: 'Play a song.',
  execute: function (msg) {
    let voiceChannel = msg.author.getVoiceChannel(msg.guild);
    if (!voiceChannel) return msg.channel.sendMessage('You should be in a voice channel first.');
    this.player.play(voiceChannel).catch(err => console.error(err));
  }
});

commands.set('add', {
  name: 'add',
  description: 'Add a song to the queue.',
  execute: function (msg, args) {
    if (!args.length) return msg.channel.sendMessage('Usage: add [url]');
    this.player.add(msg, args[0]).then((info) => {
      msg.channel.sendMessage(`Added ${info.title} to the queue.`);
    }).catch(err => console.error(err));
  }
});

commands.set('stop', {
  name: 'stop',
  description: 'Stop playing.',
  execute: function (msg) {
    msg.channel.sendMessage(':middle_finger:');
  }
});

commands.set('skip', {
  name: 'skip',
  description: 'Skip the current song.',
  execute: function (msg) {
    msg.channel.sendMessage(':middle_finger:');
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

module.exports = commands;