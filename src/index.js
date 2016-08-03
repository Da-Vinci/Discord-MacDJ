'use strict';

const path = require('path');
const os = require('os');

process.env.PATH = path.resolve(path.join('.', 'dist', os.platform(), os.arch())) + path.delimiter + process.env.PATH;

console.log(process.env.PATH)

require('./app/main');