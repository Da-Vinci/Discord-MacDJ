"use strict";

const ytdl = require('ytdl-core');

class Player {

  constructor(config) {
    this.config = config;
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
    const connection = this.connections.get(channel.server.id);
    if (connection) return Promise.resolve(connection);

    return new Promise((resolve, reject) => {
      this.client.joinVoiceChannel(channel).then(connection => {
        this.connections.set(channel.server.id, connection);
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
    this.client.leaveVoiceChannel(channel).then(Promise.resolve).catch(Promise.reject);
  }

  /**
   * Start playing the queue
   * @param  {Object} channel discord.js channel resolvable
   * @param  {Object} options Options to pass to playRawStream
   * @return {Promise}        
   */
  play(channel, options) {
    let server = channel.server.id;
    
    if (!this.queue[server]) return Promise.reject('No songs in queue.');

    return new Promise((resolve, reject) => {
      this.getConnection(channel).then(connection => {
        connection.stopPlaying();

        let songObj = this.queue[server][0],
            url = `https://www.youtube.com/watch?v=${songObj.video_id}`,
            stream = ytdl(url, { audioonly: true });

        stream.on('error', console.error);

        connection.playRawStream(stream).then(intent => {
          intent.on('error', console.error);

          intent.once('end', () => {
            this.queue[server].push( this.queue[server].shift() );
            this.play.call(this, channel, options);
          });
        }).catch(console.error);
        
        return resolve();
      }).catch(reject);
    });
  }

  /**
   * Stop playing
   * @param  {Object} channel discord.js channel resolvable
   */
  stop(channel) {
    this.getConnection(channel).then(connection => {
      if (connection.playingIntent) connection.playingIntent.removeAllListeners('end');
      connection.stopPlaying();
    });
  }

  /**
   * Skip song
   * @param  {Object} msg discord.js message resolvable
   */
  skip(msg) {
    // return if there's nothing in queue
    if (!this.queue[msg.server.id]) return;
    // stop playing
    this.stop(msg.author.voiceChannel);
    // shift the queue
    this.queue[msg.server.id].push( this.queue[msg.server.id].shift() );
    // play the next song
    this.play(msg.author.voiceChannel);
  }

  /**
   * Pause song
   * @param  {Object} msg discord.js message resolvable
   */
  pause(channel) {
    this.getConnection(channel).then(connection => connection.pause());
  }

  /**
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
    this.queue[msg.server.id] = this.queue[msg.server.id] || [];
    return new Promise((resolve, reject) => {
      ytdl.getInfo(url, (err, info) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        if (!info.video_id) return reject('No video id.');
        this.queue[msg.server.id].push(info);
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
    // return if there's nothing in queue
    if (!this.queue[msg.server.id]) return;
    // remove the first song if there's no index
    if (!index) return this.queue[msg.server.id].shift();
    // remove the item by index
    this.queue[msg.server.id].splice(--index, 1);
  }

  /**
   * List songs in queue
   * @param  {Object} msg discord.js message resolvable
   * @return {Array}      List of songs in queue
   */
  list(msg) {
    return this.queue[msg.server.id];
  }

  /**
   * Clear the song queue
   * @param  {Object} msg discord.js message resolvable
   */
  clear(msg) {
    return this.queue[msg.server.id] = [];
  }

  /**
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
}

module.exports = Player;
