'use strict';

const path = require('path');
const Datastore = require('nedb');
const electron = require('electron');
const Discord = require('discord.js');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const app = electron.app;
const Menu = electron.Menu;
const appMenu = require('./appMenu')(app);
const utils = require('./lib/utils');
const client = new Discord.Client();

let config = {},
  main;

class Main {

  constructor() {
    this.client = client;
    this.mainWindow = null;
    this.activeChannel = null;
    this.retries = 0;
    this.commands = require('./commands');

    // debug: print userData path so we know where data files are being stored locally
    console.log(app.getPath('userData'));

    // Create the nedb config db
    this.config = new Datastore({
      filename: path.join(app.getPath('userData'), 'config.db'),
      autoload: true
    });

    app.config = {};

    // App event handlers
    app.on('ready', this.login.bind(this));

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (this.mainWindow === null) {
        this.createWindow();
      }
    });

    // Bot event handlers
    client.on('ready', this.onReady.bind(this));
    client.on('error', this.onError.bind(this));
    client.on('disconnected', this.onDisconnect.bind(this));
    client.on('message', this.onMessage.bind(this));

    return this;
  }

  get app() {
    return app;
  }

  /**
   * Login with token or show the token window
   */
  login() {
    this.config.findOne({}, (err, doc) => {
      if (!doc || !doc.token) {
        return this.createTokenWindow();
      }

      this.token = doc.token;
      client.loginWithToken(this.token).then(() => {
        if (!this.mainWindow) {
          this.createWindow();
        }
      }).catch(err => console.log(err));
    });
  }

  /**
   * Client ready event handler
   */
  onReady() {
    let payload = {
      user: client.user,
      users: client.users,
      servers: client.servers.map(s => { return { id: s.id, name: s.name, icon: s.icon }; }),
      textChannels: client.channels.filter(c => c.type === 'text').map(c => { return { id: c.id, name: c.name }; }),
      voiceChannels: client.channels.filter(c => c.type === 'voice').map(c => { return { id: c.id, name: c.name }; })
    };

    this.mainWindow.webContents.send('ready', payload);
  }

  /**
   * Client error event handler
   * @param  {Object} err Error
   */
  onError(err) {
    console.error(err);
  }

  /**
   * Client disconnect event handler
   */
  onDisconnect() {
    // retry 3 times
    if (this.retries >= 3) {
      this.retries = 0;
      return this.createTokenWindow();
    }

    this.retries++;

    // debug
    console.log(`Attempting to reconnect... ${this.retries}`);

    // respect reconnect rate limit of 5s
    setTimeout(function() {
      this.login();
    }.bind(this), 5000);
  }

  /**
   * Generate help command output
   *
   * @param  {Object} msg  Message resolvable
   */
  generateHelp(msg) {
    let msgArray = [];

    msgArray.push('```xl');
    for (let command of this.commands.values()) {
      msgArray.push(`${utils.pad(command.name, 15)} ${command.description}`);
    }
    msgArray.push('```');

    client.sendMessage(msg.channel, msgArray);
  }

  /**
   * Message handler
   * @param  {Object} msg Message resolvable
   */
  onMessage(msg) {
    const prefix = config.prefix || '+',
          params = msg.cleanContent.split(' ');

    if (!params.join(' ').startsWith(prefix)) return;
    if (msg.author.bot || msg.author.equals(client.user)) return;

    const cmd = params[0].replace(prefix, '').toLowerCase(),
          args = params.slice(1);

    if (cmd === 'help') return this.generateHelp(msg, args);
    if (!this.commands.has(cmd)) return;

    const command = this.commands.get(cmd);

    // execute command
    command.execute(msg, args, cmd);
  }

  /**
   * Save the token for logging in
   * @param  {Object} event ipc event object
   * @param  {String} token token entered by the user
   */
  saveToken(event, token) {
    const callback = () => {
      this.login();
      if (this.tokenWindow) this.tokenWindow.close();
    };

    this.config.findOne({}, (err, doc) => {
      if (!doc) {
        app.config = {token};
        this.config.insert({token}, callback);
      } else {
        doc.token = token;
        app.config = doc;
        this.config.update({ _id: doc._id }, doc, callback);
      }
    });
  }

  /**
   * Create the token window
   */
  createTokenWindow() {
    this.tokenWindow = new BrowserWindow({width: 650, height: 100});
    this.tokenWindow.loadURL('file://' + __dirname + '/token.html');

    Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu));

    // Register the event listener to save token
    ipcMain.on('token', this.saveToken.bind(this));
  }

  /**
   * Create the client window
   */
  createWindow() {
    this.mainWindow = new BrowserWindow({width: 1280, height: 720});
    this.mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    // this.mainWindow.webContents.openDevTools();

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // create the client menu
    Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu));

    app.mainWindow = this.mainWindow;
  }
}

main = new Main();
module.exports = main;
