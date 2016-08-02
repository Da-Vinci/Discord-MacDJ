const electron = require('electron');
const remote = electron.remote
const ipcRenderer = electron.ipcRenderer;

const config = remote.app.config;

let main = angular.module('mainApp', ['ngSanitize', 'scrollglue']);

main.controller('MainController', ['$scope', MainController]);
main.controller('TokenController', ['$scope', TokenController]);

function MainController($scope) {
  $scope.title = "Discord Bot Client";
}

function TokenController($scope) {
  $scope.token = config.token || "";
  $scope.saveToken = saveToken;
  
  function saveToken() {
    ipcRenderer.send('token', $scope.token);
  }
}