const path = require('path');
const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize', 'scrollglue']);

main.controller('MainController', ['$scope', '$sce', MainController]);
main.controller('TokenController', ['$scope', TokenController]);

function MainController($scope, $sce) {
    $scope.trustAsHtml = $sce.trustAsHtml; // i don't trust this AAHAHAHAHAHAHAHAHA
    $scope.bot = { username: '' };
    $scope.settings = [
        {key: "Prefix", value: '<input type="text" id="prefix" value="+"></input>', format: ""},
        {key: "Default Volume", value: "100", "format": "%"}
    ];

    ipcRenderer.on('ready', (event, client) => {
        $scope.client = client.user;
        $scope.prefix = client.prefix;
        window.$('#prefix').val(client.prefix);
        window.client = client;
        $scope.servers = {};
        $('.overlay').remove();
        $scope.$apply();
    });

    ipcRenderer.on('voiceConnect', (event, channel) => {
      $scope.servers = $scope.servers.map(s => {
        s.voiceChannel = s.voiceChannels.find(c => c.id === channel.id);
        return s;
      });
      $scope.$apply();
    });

    ipcRenderer.on('voiceDisconnect', (event, channel) => {
      $scope.servers = $scope.servers.map(s => {
        if (s.voiceChannel && s.voiceChannel.id === channel.id) {
          delete s.voiceChannel;
        }
        return s;
      });
      $scope.$apply();
    });
}

$( document ).ready(function() {
    $('#volume').on('input', function() {
        console.log($(this).val());
    });
    $('#prefix').keypress(function (e) {
        if (e.which == 13) {
            if ($(this).val().length < 33) {
                ipcRenderer.send('prefix', $(this).val())
            }
            return false;
        }
    });
});

function TokenController($scope) {
  $scope.token = config.token || "";
  $scope.saveToken = saveToken;

  function saveToken() {
    ipcRenderer.send('token', $scope.token);
  }
}
