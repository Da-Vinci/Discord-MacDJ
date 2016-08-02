const electron = require('electron');
const remote = electron.remote
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize', 'scrollglue']);

main.controller('MainController', ['$scope', MainController]);
main.controller('TokenController', ['$scope', TokenController]);

function MainController($scope) {
  $scope.bot = {name: "TestBoat" }
  $scope.quick = "Hello!";
  $scope.settings = [
      {key: "Token", value: "Mk12345.token.istotallyreal"},
      {key: "Default Volume", value: "100", "format": "%"}
  ];
  $scope.channels = [
      {name: "General", id: 1, playing: {active: false, name: ""}, volume: 100},
      {name: "Music", id: 2, playing: {active: true, name: "Brainpower 72 Hour Remix"}, volume: 70}
  ]
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
