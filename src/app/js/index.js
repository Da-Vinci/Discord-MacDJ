const path = require('path');
const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize', 'scrollglue']);

main.controller('MainController', ['$scope', MainController]);
main.controller('TokenController', ['$scope', TokenController]);

function MainController($scope) {
  $scope.bot = { username: 'MacDJ' };
  $scope.quick = "Hello!";
  $scope.settings = [
      {key: "Default Volume", value: "100", "format": "%"}
  ];

  ipcRenderer.on('ready', (event, payload) => {
    $scope.bot = payload.user;
    $scope.channels = payload.voiceChannels;
    $('.overlay').remove();
    $scope.$apply();
  });
}

$( document ).ready(function() {
    window.$('#volume').on('input', function() {
        console.log($(this).val());
    });
});

function TokenController($scope) {
  $scope.token = config.token || "";
  $scope.saveToken = saveToken;

  function saveToken() {
    ipcRenderer.send('token', $scope.token);
  }
}
