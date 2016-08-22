/**
 * Created by macdja38 on 2016-08-10.
 */
var request = require('request');

module.exports = class Dfm{
  constructor(config) {
    this.libraries = [];
    this.librarieList = [];
    this._config = config;
    this.maybeUpdate();
    this.fetch();
  }

  maybeUpdate() {
    if (this._config.hasOwnProperty("librarieList")) {
      this.libraries = this._config.librarieList;
    }
  }

  fetch() {
    return new Promise((resolve, reject)=>{
      if(this.librarieList.length > 0) {
        resolve(this.librarieList);
        return;
      }
      request('https://temp.discord.fm/libraries/json', (error, response, body) => {
        if(!error && response.statusCode === 200) {
          body = JSON.parse(body);
          console.log(body);
          this.librarieList = body;
          resolve(body);
        }
        reject(error);
      })
    })
  }

  async syncFetch() {
    return await fetch();
  }
};