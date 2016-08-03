"use strict";

const ytdl = require('ytdl-core');
const child = require('child_process');
const Transform = require('stream').Transform;

class Player {

  constructor(config, main) {
    this.config = config;
    this.main = main;
  }

  /**
   * Start the player module
   * @param  {Object} client Reference to discord client
   */
  start(client) {
    this.client = client;
    this.connections = new Map();
    this.queue = this.config.queue = {};
  }

  /**
   * Get or create the voice connection
   * @param  {Object} channel discord.js channel resolvable
   * @return {Promise}        Resolves a connection object
   */
  getConnection(channel) {
    const connection = this.connections.get(channel.guild_id);
    if (connection) return Promise.resolve(connection);

    return new Promise((resolve, reject) => {
      channel.join(false, false).then(connection => {
        this.connections.set(channel.guild_id, connection);

        this.main.mainWindow.webContents.send('voiceConnect', {
          id: channel.id,
          name: channel.name,
          guild_id: channel.guild_id,
          bitrate: channel.bitrate,
          user_limit: channel.user_limit
        });

        return resolve(connection);
      }).catch(reject);
    });
  }

  /**
   * Destroy the voice connection
   * @param  {Object} channel discord.js channel resolvable
   * @return {Promise}        Resolves when done.
   */
  destroyConnection(channel) {
    this.getConnection(channel).then(info => {
      info.disconnect();
      channel.leave();

      this.main.mainWindow.webContents.send('voiceDisconnect', {
        id: channel.id,
        name: channel.name,
        guild_id: channel.guild_id,
        bitrate: channel.bitrate,
        user_limit: channel.user_limit
      });
    });
  }

  /**
   * Start playing the queue
   * @param  {Object} channel discord.js channel resolvable
   * @return {Promise}
   */
  play(channel) {
    if (!this.queue[channel.guild_id]) return Promise.reject('No songs in queue.');

    return new Promise((resolve, reject) => {
      this.getConnection(channel).then(info => {
        let mediaInfo = this.queue[channel.guild_id][0];

        let formats = mediaInfo.formats
          .filter(f => f.container === 'webm')
          .sort((a, b) => b.audioBitrate - a.audioBitrate);
        let bestaudio = formats.find(f => f.audioBitrate > 0 && !f.bitrate) ||
                        formats.find(f => f.audioBitrate > 0);

        if(!bestaudio) return;

        console.log(bestaudio.url);

        let encoder = info.voiceConnection.createExternalEncoder({
            type: 'ffmpeg',
            format: 'opus',
            source: bestaudio.url,
            frameDuration: 60,
            debug: false
        });

        encoder.on('error', err => console.error(err));

        encoder.once('end', () => {
          if (this.queue.length > 1) {
            this.queue[channel.guild_id].push( this.queue[channel.guild_id].shift() );
            this.play.call(this, channel);
          } else this.queue[channel.guild_id].shift();
        });

        encoder.play();

        return resolve();
      }).catch(reject);
    });
  }

  /**
   * Start playing the queue
   * @param  {Object} channel discord.js channel resolvable
   * @return {Promise}
   */
  playO(channel) {
    if (!this.queue[channel.guild_id]) return Promise.reject('No songs in queue.');

    return new Promise((resolve, reject) => {
      this.getConnection(channel).then(info => {
        let encoderStream = info.voiceConnection.getEncoderStream();

        if (encoderStream) encoderStream.unpipeAll();

        let songObj = this.queue[channel.guild_id][0],
            url = `https://www.youtube.com/watch?v=${songObj.video_id}`,
            stream = ytdl(url, { audioonly: true });

        console.log(stream);

        this.encodeStream(stream).then(data => {
          console.log(data);
          encoderStream = info.voiceConnection.getEncoderStream({
            frameDuration: 60,
            sampleRate: 48000,
            channels: 2
          });

          encoderStream.on('unpipe', () => data.stream.destroy());

          data.stream.on('error', console.error);
          data.stream.once('end', () => {
            if (encoderStream) encoderStream.unpipeAll();

            if (this.queue.length > 1) {
              this.queue[channel.guild_id].push( this.queue[channel.guild_id].shift() );
              this.play.call(this, channel);
            } else this.queue[channel.guild_id].shift();
          });

          data.stream.pipe(encoderStream);

        }).catch(err => console.error(err));

        return resolve();
      }).catch(reject);
    });
  }

  /**
   * Stop playing
   * @param  {Object} channel discord.js channel resolvable
   */
  stop(channel) {
    this.getConnection(channel).then(info => {
      let encoderStream = info.voiceConnection.getEncoderStream();

      if (!encoderStream) return;

      encoderStream.unpipeAll();
      channel.leave();

      this.main.mainWindow.webContents.send('voiceDisconnect', {
        id: channel.id,
        name: channel.name,
        guild_id: channel.guild_id,
        bitrate: channel.bitrate,
        user_limit: channel.user_limit
      });
    });
  }

  /**
   * Skip song
   * @param  {Object} msg discord.js message resolvable
   */
  skip(msg) {
    let voiceChannel = msg.author.getVoiceChannel(msg.guild);
    // return if there's nothing in queue
    if (!this.queue[msg.guild.id]) return;
    // stop playing
    this.stop(voiceChannel);
    // shift the queue
    this.queue[msg.guild.id].push( this.queue[msg.guild.id].shift() );
    // play the next song
    this.play(voiceChannel);
  }

  /**
   * NOT FUNCTIONAL
   * Pause song
   * @param  {Object} msg discord.js message resolvable
   */
  pause(channel) {
    this.getConnection(channel).then(connection => connection.pause());
  }

  /**
   * NOT FUNCTIONAL
   * Resume song
   * @param  {Object} msg discord.js message resolvable
   */
  resume(channel) {
    this.getConnection(channel).then(connection => connection.resume());
  }

  /**
   * Add song to queue
   * @param {Object} msg     discord.js message resolvable
   * @param {Object} songObj Youtube song object
   */
  add(msg, url) {
    this.queue[msg.guild.id] = this.queue[msg.guild.id] || [];
    return new Promise((resolve, reject) => {
      ytdl.getInfo(url, (err, info) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        if (!info.video_id) return reject('No video id.');
        this.queue[msg.guild.id].push(info);
        this.main.mainWindow.webContents.send('queueUpdate', {
          guild: msg.guild.id,
          queue: this.queue[msg.guild.id]
        });
        resolve(info);
      });
    });
  }

  /**
   * Remove song from queue
   * @param  {Object} msg   discord.js message resolvable
   * @param  {Number} index Index of song to remove
   */
  remove(msg, index) {
    let result;

    // return if there's nothing in queue
    if (!this.queue[msg.guild.id]) return;
    // remove the first song if there's no index
    if (!index) result = this.queue[msg.guild.id].shift();
    else result = this.queue[msg.guild.id].splice(--index, 1).shift();

    this.main.mainWindow.webContents.send('queueUpdate', {
      guild: msg.guild.id,
      queue: this.queue[msg.guild.id]
    });

    return result;
  }

  /**
   * List songs in queue
   * @param  {Object} msg discord.js message resolvable
   * @return {Array}      List of songs in queue
   */
  list(msg) {
    return this.queue[msg.guild.id];
  }

  /**
   * Clear the song queue
   * @param  {Object} msg discord.js message resolvable
   */
  clear(msg) {
    this.queue[msg.guild.id] = [];
    this.main.mainWindow.webContents.send('queueUpdate', {
      guild: msg.guild.id,
      queue: this.queue[msg.guild.id]
    });
  }

  /**
   * NOT FUNCTIONAL
   * Set volume to play in discord
   * @param  {Object} channel discord.js channel resolvable
   * @param  {Float} volume   Volume level (0-1.5)
   */
  volume(channel, volume) {
    this.getConnection(channel).then(connection => {
      if (volume) return connection.setVolume(volume);
      return connection.getVolume();
    });
  }

  /**
   * Encode raw stream, taken from discord.js
   */
  encodeStream(stream, options) {
    options = options || {};

    return new Promise((resolve, reject) => {
      this.volume = new Volume(options.volume);

      var enc = child.spawn('ffmpeg', [
        '-i', '-',
        '-f', 's16le',
        '-ar', '48000',
        '-ss', (options.seek || 0),
        '-ac', 2,
        'pipe:1'
      ]);

      var dest = stream.pipe(enc.stdin);

      dest.on('unpipe', () => dest.destroy());
      dest.on('error', () => dest.destroy());

      this.hookEncodingProcess(resolve, reject, enc, stream);
    });
  }

  /**
   * Hook encoding process, taken from discord.js
   */
  hookEncodingProcess(resolve, reject, enc, stream) {
    var processKilled = false;

    function killProcess(cause) {
      if (processKilled)
        return;

      enc.stdin.pause();
      enc.kill("SIGKILL");

      processKilled = true;

      reject(cause);
    }

    var ffmpegErrors = "";

    enc.stdout.pipe(this.volume);

    enc.stderr.on("data", (data) => {
      ffmpegErrors += "\n" + new Buffer(data).toString().trim();
    });

    enc.stdout.once("end", () => {
      killProcess("end");
    });

    enc.stdout.once("error", () => {
      enc.stdout.emit("end");
    });

    enc.once("exit", (code) => {
      if (code) {
        reject(new Error("FFMPEG: " + ffmpegErrors));
      }
    });

    this.volume.once("readable", () => {
      var data = {
        proc: enc,
        stream: this.volume,
        channels: 2
      };

      if (stream) {
        data.instream = stream;
      }

      resolve(data);
    });

    this.volume.once("end", () => {
      killProcess("end");
    });

    this.volume.once("error", () => {
      killProcess("end");
    })

    this.volume.on("end", () => {
      killProcess("end");
    });

    this.volume.on("close", () => {
      killProcess("close");
    });
  }
}

module.exports = Player;

/**
 * @see https://github.com/reneraab/pcm-volume/blob/master/index.js Inspired by this script
 */
class Volume extends Transform {
  constructor(volume) {
    super();
    this.set(volume);
  }

  get volume() {
    return this._volume === undefined ? 1 : this._volume;
  }

  set volume(value) {
    this._volume = value;
  }

  // Set the volume so that a value of 0.5 is half the perceived volume and
  // 2.0 is double the perceived volume.
  setVolumeLogarithmic(value) {
    this.volume = Math.pow(value, 1.660964);
  }

  // Set the volume to a value specified as decibels.
  setVolumeDecibels(db) {
    this.volume = Math.pow(10, db / 20);
  }

  get multiplier() {
    return this.volume;
  }

  get() {
    return this.volume;
  }

  set(volume) {
    this.volume = volume === undefined ? 1 : volume;
  }

  _transform(buffer, encoding, callback) {
    let out = new Buffer(buffer.length);

    for (let i = 0; i < buffer.length; i += 2) {
      // Check whether the index is actually in range - sometimes it's possible
      // that it skips ahead too far before the end condition of the for can
      // kick in.
      if (i >= buffer.length - 1) {
        break;
      }

      // Read Int16, multiple with multiplier and round down
      //console.log(this.volume, this.multiplier, buffer.readInt16LE(i));
      let uint = Math.floor(this.multiplier * buffer.readInt16LE(i));

      // Ensure value stays within 16bit
      uint = Math.min(32767, uint);
      uint = Math.max(-32767, uint);

      // Write 2 new bytes into other buffer;
      out.writeInt16LE(uint, i);
    }

    this.push(out);
    callback();
  }
}
