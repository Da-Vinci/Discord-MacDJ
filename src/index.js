'use strict';

const path = require('path');
const os = require('os');
const electron = require('electron');
const app = electron.app;
const autoUpdater = electron.autoUpdater;
var platform = os.platform() + '_' + os.arch();
var version = app.getVersion();

console.log(platform, version);

process.env.PATH = path.resolve(path.join('.', 'dist', os.platform(), os.arch())) + path.delimiter + process.env.PATH;

console.log(process.env.PATH)

require('./app/main');
