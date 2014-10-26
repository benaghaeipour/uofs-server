/*globals angular, alert, window*/
angular.module('admin', [])
    .config(function ($httpProvider) {
        $httpProvider.defaults.headers.common = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    })
    .controller('setup', function ($scope, $q, $http, $location) {
        var center = {};
        $http({
            method: 'GET',
            url: '/center/' + $location.$$absUrl.match(/center\/([a-f0-9]{24})\/welcome\/?$/)[1]
        }).success(function (res) {
            center = res;
        });

        $scope.users = [];

        $scope.send = function completeSetupProcess() {
            if (!$scope.form.$valid) {
                alert('Oppps, looks like a field might be invalid. Please try again.');
                return;
            }

            var actions = $scope.users.map(function (email) {
                return $http({
                    method: 'POST',
                    url:'/student/update',
                    data: {
                        username: email,
                        email: email,
                        center: center.name
                    }
                });
            });

            center.mainContact = $scope.users[0];

            actions.push($http({
                method: 'POST',
                url: '/center/' + center._id,
                data: center
            }));

            $q.all(actions).then(function setupComplete() {
                window.location.href = 'http://online.unitsofsound.com';
            }, function setupError() {
                alert('Oppps, something went wrong. Please contact units of sound helpline.');
            });
        };
    });