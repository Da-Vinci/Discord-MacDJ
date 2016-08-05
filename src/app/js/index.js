/* eslint-env node, browser, jquery */

const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize']);

main.controller('MainController', ['$scope', '$sce', MainController]);
main.controller('TokenController', ['$scope', TokenController]);

function MainController($scope, $sce) {
    $scope.trustAsHtml = $sce.trustAsHtml; // i don't trust this AAHAHAHAHAHAHAHAHA
    $scope.client = { username: '' };
    $scope.settings = [
        {key: "Prefix", value: '<input type="text" id="prefix" value="+"/>', format: ""},
        {key: "Default Volume", value: "100", "format": "%"}
    ];

    $scope.queue = {};

    ipcRenderer.on('ready', (event, client) => {
        $scope.client = client.user;
        $scope.prefix = client.prefix;
        window.$('#prefix').val(client.prefix);
        window.client = client;
        $scope.servers = client.servers.map(s => {
            s.voiceChannel = {name: "Not Connected"};
            return s;
        });
        $('.overlay').remove();
        $scope.$apply();
        applyJS();
    });

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
}

function applyJS() {
    let volume = $('#volume');
    let prefix = $('#prefix');
    let del = $('.delete');
    let add = $('.addButton');
    volume.unbind();
    prefix.unbind();
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
    prefix.keypress(function (e) {
        if (e.which == 13) {
            if ($(this).val().length < 33) {
                console.log($(this).val());
                ipcRenderer.send('command', {command: 'prefix', data: $(this).val()});
            }
            return false;
        }
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
