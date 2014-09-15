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
                home :'fa-home'
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

        $scope.incCenterType = incCenterType;
        $scope.center = {
            centerType: eCenterTypes[0]
        };
        $scope.submit = sendSaveCommand;

        var centerGuid = $location.path().match(/edit\/([a-f0-9]{24})\/?$/)[1];
        $http({
            method: 'GET',
            url: '/center/' + centerGuid
        }).then(function (res) {
            $scope.center = res.data;
        });
    });