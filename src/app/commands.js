
const commands = new Map();

commands.set('play', {
  name: 'play',
  description: 'Play a song.',
  execute: msg => {
    msg.reply(':middle_finger:');
  }
});

commands.set('stop', {
  name: 'stop',
  description: 'Stop playing.',
  execute: msg => {
    msg.reply(':middle_finger:');
  }
});

commands.set('skip', {
  name: 'skip',
  description: 'Skip the current song.',
  execute: msg => {
    msg.reply(':middle_finger:');
  }
});

commands.set('pause', {
  name: 'pause',
  description: 'Pause playing the current song.',
  execute: msg => {
    msg.reply(':middle_finger:');
  }
});

commands.set('resume', {
  name: 'resume',
  description: 'Resume playing the current song.',
  execute: msg => {
    msg.reply(':middle_finger:');
  }
});

module.exports = commands;