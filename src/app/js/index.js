const electron = require('electron');
const remote = electron.remote
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize', 'scrollglue']);

main.controller('MainController', ['$scope', MainController]);
main.controller('TokenController', ['$scope', TokenController]);

function MainController($scope) {
  $scope.title = "Main Page";
  $scope.bot = {name: bot.username, }
  $scope.quick = "Hello!";
  $scope.settings = [
      {key: "Token", value: bot.config.token},
      {key: "Volume", value: "11"}
  ];
  $scope.channels = [
      {name: "General", playing: false},
      {name: "Music", playing: true}
  ]
}

function TokenController($scope) {
  $scope.token = config.token || "";
  $scope.saveToken = saveToken;

  function saveToken() {
    ipcRenderer.send('token', $scope.token);
  }
}
