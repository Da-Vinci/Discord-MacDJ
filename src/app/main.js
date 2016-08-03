'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const Discord = require('discordie');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const app = electron.app;
const Menu = electron.Menu;
const appMenu = require('./appMenu')(app);
const utils = require('./lib/utils');
const Player = require('./lib/player');
const client = new Discord();
const dbPath = path.join(app.getPath('userData'), 'config.db');

let main;

if (!utils.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({}));
}

class Main {

  constructor() {
    this.client = client;
    this.mainWindow = null;
    this.activeChannel = null;
    this.retries = 0;
    this.commands = require('./commands');

    // debug: print userData path so we know where data files are being stored locally
    console.log(app.getPath('userData'));

    this.config = app.config = this.getConfig();

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

    this.player = new Player(this.config, this);

    // Bot event handlers
    client.Dispatcher.on("GATEWAY_READY", this.onReady.bind(this));
    client.Dispatcher.on('DISCONNECTED', this.onDisconnect.bind(this));
    client.Dispatcher.on("MESSAGE_CREATE", this.onMessage.bind(this));

    // UI event handlers
    ipcMain.on('command', this.onCommand.bind(this));

    return this;
  }

  get app() {
    return app;
  }

  /**
   * Login with token or show the token window
   */
  login() {
    if (!this.config || !this.config.token) {
      return !this.tokenWindow ? this.createTokenWindow() : null;
    }

    client.connect({ token: this.config.token });
    if (!this.mainWindow) this.createWindow();
  }

  /**
   * Client ready event handler
   */
  onReady() {
    let payload = {
      prefix: this.config.prefix || '+',
      user: {
          id: client.User.id,
          username: client.User.username,
          discriminator: client.User.discriminator
      },
      users: client.Users,
      servers: client.Guilds.map(s => {
        return {
          id: s.id,
          name: s.name,
          icon: s.icon,
          textChannels: s.channels.filter(c => c.type === 'text').map(c => { return { id: c.id, name: c.name }; }),
          voiceChannels: s.channels.filter(c => c.type === 'voice').map(c => { return { id: c.id, name: c.name }; })
        };
      })
    };

    this.player.start(client);

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

    msg.channel.sendMessage(msgArray.join("\n"));
  }

  /**
   * Message handler
   * @param  {Object} msg Message resolvable
   */
  onMessage(event) {
    let msg = event.message;
    const prefix = this.config.prefix || '+',
          params = msg.content.split(' ');

    if (!params.join(' ').startsWith(prefix)) return;
    if (msg.author.bot || msg.author.equals(client.User)) return;

    const cmd = params[0].replace(prefix, '').toLowerCase(),
          args = params.slice(1);

    if (cmd === 'help') return this.generateHelp(msg, args);
    if (!this.commands.has(cmd)) return;

    if (msg.channel.is_private) return msg.channel.sendMessage('You should be in a channel to use commands.');

    const command = this.commands.get(cmd);

    // execute command
    command.execute.call(this, msg, args);
  }

  /**
   * UI Command handler
   * @param  {Object} event   ipc event
   * @param  {Object} payload payload object
   */
  onCommand(event, payload) {
    switch (payload.command) {
      case 'queueDelete':
        var index = parseInt(payload.data.index, 10) + 1;
        this.player.remove(payload.data.guild, index);
        break;
      case 'prefix':
        this.config.prefix = payload.data;
        this.saveConfig();
        break;
    }
  }

  /**
   * Get config from db
   * @return {Object} Config object
   */
  getConfig() {
    return JSON.parse(fs.readFileSync(dbPath));
  }

  saveConfig() {
    return fs.writeFileSync(dbPath, JSON.stringify(this.config));
  }

  /**
   * Save the token for logging in
   * @param  {Object} event ipc event object
   * @param  {String} token token entered by the user
   */
  saveToken(event, token) {
    this.config.token = token;
    this.saveConfig();
    this.login();
  }

  /**
   * Create the token window
   */
  createTokenWindow() {
    let width = process.platform === "win32" ? 700 : 670,
        height = process.platform === "win32" ? 160 : 140;

    this.tokenWindow = new BrowserWindow({width: width, height: height});
    this.tokenWindow.setMenu(null);
    this.tokenWindow.loadURL('file://' + __dirname + '/token.html');

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

    if (this.tokenWindow) this.tokenWindow.close();
  }
}

main = new Main();
module.exports = main;
