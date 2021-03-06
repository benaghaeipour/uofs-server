/*globals angular*/
angular.module('newcenter', [])
    .value('eCenterTypes', ['home', 'school'])
    .controller('newcenter', function ($scope, $http, $window, eCenterTypes) {

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

        function sendCreateCommand() {
            $http({
                method: 'PUT',
                url: '/center',
                data: $scope.center
            })
            .then(function () {
                $window.location.href = '..';
            });
        }

        $scope.incCenterType = incCenterType;
        $scope.center = {
            centerType: eCenterTypes[0]
        };
        $scope.submit = sendCreateCommand;
    });