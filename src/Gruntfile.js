'use strict';

const path = require('path');

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON(path.resolve('./package.json')),
    companyName: 'The DaVinci Team',
    copyright: 'Copyright (C) 2016 The Da Vinci Team',

    eslint: {
      src: ['index.js', 'app/**/*.js', '!node_modules/*', '!app/**/vendor/*.js'],
      options: {
        configFile: '.eslintrc'
      }
    },

    // electron builds
    electron: {
      // OS X x64 Build Config
      osxBuild: {
        options: {
          name: '<%= pkg.productName %>',
          'app-version': '<%= pkg.version %>',
          'app-copyright': '<%= copyright %>',
          'build-version': '<%= pkg.version %>',
          dir: '.',
          out: '../builds',
          version: '1.3.1',
          platform: 'darwin',
          arch: 'x64',
          ignore: new RegExp('(/bin/linux|/bin/win32|/grunt-appdmg)'),
          icon: '../assets/macdj.icns',
          prune: true,
          asar: false,
          overwrite: true
        }
      },

      // Win32 ia32 Build Config
      win32Build: {
        options: {
          name: '<%= pkg.productName %>',
          'app-version': '<%= pkg.version %>',
          'app-copyright': '<%= copyright %>',
          'build-version': '<%= pkg.version %>',
          dir: '.',
          out: '../builds',
          version: '1.3.1',
          platform: 'win32',
          arch: 'ia32',
          ignore: new RegExp('(/bin/linux|/bin/darwin|/bin/win32/x64|/grunt-appdmg)'),
          icon: '../assets/macdj.ico',
          prune: true,
          asar: false,
          overwrite: true,
          'version-string': {
            InternalName: '<%= pkg.productName %>',
            ProductName: '<%= pkg.productName %>',
            ProductVersion: '<%= pkg.version %>',
            CompanyName: '<%= companyName %>',
            LegalCopyright: '<%= copyright %>',
            FileDescription: '<%= pkg.description %>'
          }
        }
      },

      // Win32 x64 Build Config
      win64Build: {
        options: {
          name: '<%= pkg.productName %>',
          'app-version': '<%= pkg.version %>',
          'app-copyright': '<%= copyright %>',
          'build-version': '<%= pkg.version %>',
          dir: '.',
          out: '../builds',
          version: '1.3.1',
          platform: 'win32',
          arch: 'x64',
          ignore: new RegExp('(/bin/linux|/bin/darwin|/bin/win32/ia32|/grunt-appdmg)'),
          icon: '../assets/macdj.ico',
          prune: true,
          asar: false,
          overwrite: true,
          'version-string': {
            InternalName: '<%= pkg.productName %>',
            ProductName: '<%= pkg.productName %>',
            ProductVersion: '<%= pkg.version %>',
            CompanyName: '<%= companyName %>',
            LegalCopyright: '<%= copyright %>',
            FileDescription: '<%= pkg.description %>'
          }
        }
      }
    },

    exec: {
        appdmg: {
            cmd: 'mkdir -p ../builds/dist/osx && appdmg ./appdmg.json ../builds/dist/osx/MacDJ_<%= pkg.version %>.dmg'
        },
        update: {
            cmd: 'rm -rf ./node_modules && npm install'
        }
    },

    'create-windows-installer': {
      x64: {
        appDirectory: '../builds/MacDJ-win32-x64',
        outputDirectory: '../builds/dist/win32-x64',
        authors: 'The DaVinci Team',
        exe: 'MacDJ.exe'
      },
      ia32: {
        appDirectory: '../builds/MacDJ-win32-ia32',
        outputDirectory: '../builds/dist/win32-ia32',
        authors: 'The DaVinci Team',
        exe: 'MacDJ.exe'
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-electron-installer');

  // register tasks
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('update', ['exec:update']);
  grunt.registerTask('build-osx', ['eslint', 'electron:osxBuild']);
  grunt.registerTask('build-win', ['eslint', 'electron:win32Build', 'electron:win64Build']);
  grunt.registerTask('build-all', ['eslint', 'electron:osxBuild', 'electron:win32Build', 'electron:win64Build']);
  grunt.registerTask('appdmg', ['exec:appdmg']);
  grunt.registerTask('appmsi', ['create-windows-installer']);
  grunt.registerTask('build-dist', ['eslint', 'electron:osxBuild', 'electron:win32Build', 'electron:win64Build', 'exec:appdmg', 'create-windows-installer']);

};
