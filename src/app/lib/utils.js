'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

Object.defineProperty(Array.prototype, 'group', {
  enumerable: false,
  value: function (key) {
    var map = {};
    this.map(e => ({k: key(e), d: e})).forEach(e => {
      map[e.k] = map[e.k] || [];
      map[e.k].push(e.d);
    });
    return Object.keys(map).map(k => ({[k]: map[k]}));
  }
});

class Utils {

  /**
  * Returns HH:MM:SS formatted time from seconds
  * @param  {String}   s        seconds
  * @return {String}   HH:MM:SS formatted string
  */
  betterTime (s) {
    let sec_num = parseInt(s, 10);
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
  }

  /**
   * Returns files within a directory recursively
   * @param  {String}   dir      Path to directory
   * @param  {Function} callback Callback
   */
  readdirRecursive(dir, callback) {
    let list = [],
        files = fs.readdirSync(dir),
        dirs;

    let isDir = (fname) => {
      return fs.existsSync(path.join(dir, fname)) ? fs.statSync(path.join(dir, fname)).isDirectory() : false;
    };

    dirs = files.filter(isDir);

    files = files.filter(file => { return !isDir(file); });
    files = files.map(file => { return path.join(dir, file); });

    list = list.concat(files);

    while (dirs.length) {
      let d = path.join(dir, dirs.shift());
      list = list.concat( this.readdirRecursive( d ) );
    }

    return (callback) ? callback(list) : list;
  }

  /**
   * Check if file exists
   * @param  {String} path Path to file
   * @return {Boolean}     Whether the file exists or not
   */
  existsSync(path) {
    try {
      fs.accessSync(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create md5 hash
   * @param  {String} data Data to hash
   * @return {String}      MD5 hash of data
   */
  md5(data) {
    return crypto.createHash('md5').update(data).digest("hex");
  }

  /**
   * Pad a string
   * @param {String} str string to pad
   * @param {Number} n length to pad to
   */
  pad(str, n) {
    return (str.length < n) ? (str + " ".repeat(n)).slice(0, n) : str;
  }

  /**
   * Utility function to partition array by string length
   * @param  {Array} arr  Array to partition
   * @param  {Number} len String length of partition
   * @return {Array}      Partitioned array
   */
  partitionArray(msgArray, len) {
    // Convert to string
    let msgArrays = [],
        msgString = msgArray.join("\n");

    // Split string by 2000 characters (discord message limit)
    if (msgString.length > len) {
      let str = '', pos;
      while (msgString.length > 0) {
        if (msgString.length > len) {
          pos = msgString.lastIndexOf("\n",len);
        } else {
          pos = msgString.length;
        }
        str = msgString.substr(0, pos);
        msgString = msgString.substr(pos);
        msgArrays.push(str);
      }
    } else {
      msgArrays.push(msgString);
    }

    return msgArrays;
  }


  /**
   * Convert hex color to integer
   * @param  {String} color hex value
   */
  hexToInt(color) {
    return color.startsWith('#') ? parseInt(color.replace('#', ''), 16) : parseInt(color, 16);
  }
}

module.exports = new Utils();
