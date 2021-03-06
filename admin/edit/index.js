'use strict';
/*globals angular*/
angular.module('editcenter', [])
    .config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    })
    .value('eCenterTypes', ['home', 'school'])
    .controller('editcenter', function ($scope, $http, $location, $window, eCenterTypes) {

        $scope.iconTypeForCenterType = function (centerType) {
            var mapping = {
                school: 'fa-building',
                home: 'fa-home'
            };
            return mapping[centerType];
        };

        function incCenterType() {

            var currentOptionNumber = eCenterTypes.indexOf($scope.center.centerType);
            var isLastOption = currentOptionNumber === (eCenterTypes.length - 1);

            if (isLastOption) {
                $scope.center.centerType = eCenterTypes[0];
            } else {
                currentOptionNumber++;
                $scope.center.centerType = eCenterTypes[currentOptionNumber];
            }
        }

        function sendSaveCommand() {
            $http({
                method: 'POST',
                url: '/center/' + centerGuid,
                data: $scope.center
            }).then(function () {
                $window.location.href = '..';
            });
        }

        function sendDeleteCommand() {
            $http({
                method: 'DELETE',
                url: '/center/' + centerGuid
            }).then(function () {
                $window.location.href = '..';
            });
        }

        $scope.incCenterType = incCenterType;
        $scope.center = {
            centerType: eCenterTypes[0]
        };
        $scope.submit = sendSaveCommand;
        $scope.delete = sendDeleteCommand;

        var centerGuid = $location.path().match(/edit\/([a-f0-9]{24})\/?$/)[1];
//        var centerGuid = '';
        $http({
            method: 'GET',
            url: '/center/' + centerGuid
        }).then(function (res) {
            $scope.center = res.data;
            return res;
        }).then(function (res) {
            $http({
                method: 'POST',
                url: '/student/find',
                data: {
                    center: res.data.name
                }
            }).then(function (res) {
                if (res.data.length !== 0) {
                    $scope.userList = res.data;
                }
            });
        });

        $scope.possibleNewUser = {};
        $scope.createUser = function () {
            if ($scope.creatingUser) {
                return;
            }
            $scope.creatingUser = $http({
                method: 'POST',
                url: '/student/update',
                data: {
                    center: $scope.center.name,
                    username: $scope.possibleNewUser.username,
                    email: $scope.possibleNewUser.email,
                    pw1: 'changeme'
                }
            }).then(function successfullyCreatedUser() {
                $scope.userList.push($scope.possibleNewUser);
                $scope.possibleNewUser = {};
            }).catch(function problemCreatingUser() {
                $scope.possibleNewUser.failed = true;
            }).finally(function finishedTryingToCreateUser() {
                $scope.creatingUser = null;
            });
        };
    });