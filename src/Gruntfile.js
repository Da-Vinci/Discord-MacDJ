module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    companyName: 'The DaVinci Team',
    copyright: 'Copyright (C) 2016 The DaVinci Team',

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
          ignore: new RegExp('(/bin/linux|/bin/win32)'),
          icon: '../assets/macdj.icns',
          prune: true,
          asar: true,
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
          ignore: new RegExp('(/bin/linux|/bin/win32)'),
          icon: '../assets/macdj.ico',
          prune: true,
          asar: true,
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
          ignore: new RegExp('(/bin/linux|/bin/win32)'),
          icon: '../assets/macdj.ico',
          prune: true,
          asar: true,
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

    appdmg: {
      options: {
        basepath: '../assets',
        title: '<%= pkg.productName %>',
        icon: 'macdj.icns',
        background: 'background.png'
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('gruntify-eslint');

  // register tasks
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('build-osx', ['eslint', 'electron:osxBuild']);
  grunt.registerTask('build-win', ['eslint', 'electron:win32Build', 'electron:win64Build']);
  grunt.registerTask('build-all', ['eslint', 'electron:osxBuild', 'electron:win32Build', 'electron:win64Build']);

};