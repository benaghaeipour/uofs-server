/*globals angular*/
angular.module('admin', [])
    .config(function ($httpProvider) {
        $httpProvider.defaults.headers.common = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    })
    .controller('centers', function ($scope, $http) {
        $http.get('/center').finally(function (data) {
            $scope.centerlist = data;
        });
    });