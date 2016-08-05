/* eslint-env node, browser, jquery */

const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize']);

main.controller('MainController', ['$scope', '$sce', MainController]);
main.controller('TokenController', ['$scope', TokenController]);
main.controller('AboutController', ['$scope', AboutController]);

function MainController($scope, $sce) {
    $scope.trustAsHtml = $sce.trustAsHtml; // i don't trust this AAHAHAHAHAHAHAHAHA
    $scope.client = { username: '' };
    $scope.settings = [
        {key: 'Username', value: '<input type="text" class="setting" id="username" value=""/>', format: ''},
        {key: "Prefix", value: '<input type="text" class="setting" id="prefix" value="+"/>', format: ""},
        {key: "Default Volume", value: "100", format: "%"}
    ];

    $scope.queue = {};

    function updateClient(event, client) {
      $scope.client = client.user;
      $scope.prefix = client.prefix;
      $scope.servers = client.servers.map(s => {
          s.voiceChannel = {name: "Not Connected"};
          return s;
      });

      console.log(client.credits);
      
      window.$('#prefix').val(client.prefix);
      window.$('#username').val(client.user.username);
      window.client = client;
      
      if ($('.overlay')) $('.overlay').remove();
      
      $scope.$apply();
      applyJS();
    }

    ipcRenderer.on('ready', updateClient);
    ipcRenderer.on('update', updateClient);

    ipcRenderer.on('voiceConnect', (event, channel) => {
      console.log('voiceConnect', channel);
      $scope.servers = $scope.servers.map(s => {
        if (s.voiceChannels.find(c => c.id === channel.id))
            s.voiceChannel = s.voiceChannels.find(c => c.id === channel.id);
        return s;
      });
      $scope.$apply();
      applyJS();
    });

    ipcRenderer.on('voiceDisconnect', (event, channel) => {
      console.log('voiceDisconnect', channel);
      $scope.servers = $scope.servers.map(s => {
        if (s.voiceChannel && s.voiceChannel.id === channel.id) {
          // delete s.voiceChannel;
          s.voiceChannel = {name: "Not Connected"};
        }
        return s;
      });
      $scope.$apply();
    });

    ipcRenderer.on('queueUpdate', (event, data) => {
      console.log('queueUpdate', data);
      $scope.queue[data.guild] = data.queue;
      $scope.$apply();
      applyJS();
    });

    ipcRenderer.on('error', (event, data) => {
        noty({text: data, type: 'error', timeout: 3000});
    });

    ipcRenderer.on('success', (event, data) => {
        noty({text: data, type: 'success', timeout: 3000});
    });
}

function applyJS() {
    let volume = $('#volume'),
        del = $('.delete'),
        add = $('.addButton');

    $('.setting').unbind();
    volume.unbind();
    del.unbind();
    add.unbind();
    add.on('click', function() {
        let $input = $(this).closest('.addDiv').find('input');
        let url = $input.val();
        let guild = $input.attr("guild");
        let vc = $input.attr("vc");
        ipcRenderer.send('command', {command: 'queueAdd', data: {url: url, guild: guild, vc: vc}});
        $input.val('');
    });

    volume.on('input', function() {
        console.log($(this).val());
    });

    $('#prefix').on('keypress', function (e) {
        if (e.which === 13) {
            if ($(this).val().length < 33) {
                console.log($(this).val());
                ipcRenderer.send('command', {command: 'prefix', data: $(this).val()});
            }
            return false;
        }
    });

    $('#username').on('keypress', function (e) {
      if (e.which === 13) {
        if ($(this).val().length > 2) {
          ipcRenderer.send('command', {command: 'username', data: $(this).val()});
        }
        return false;
      }
    });

    $('#username').on('click', function() {
        noty({text: "A bot's username can only be changed twice per hour", type: 'warning', timeout: 3000});
    });

    del.on('click', function() {
        let command = {command: 'queueDelete', data: {index: $(this).attr('index'), guild: $(this).attr('guild')}};
        console.log(command);
        ipcRenderer.send('command', command);
    });
}

function TokenController($scope) {
  $scope.token = config.token || "";
  $scope.saveToken = saveToken;

  function saveToken() {
    ipcRenderer.send('token', $scope.token);
  }
}

function AboutController($scope) {
  // need to get credits here somehow, from the other controller?
}
