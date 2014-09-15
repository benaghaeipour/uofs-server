/*globals angular*/
angular.module('editcenter', [])
    .value('eCenterTypes', ['home', 'school'])
    .controller('editcenter', function ($scope, $http, $location, eCenterTypes) {


//        var centerGuid = '54170fba86391f3662fa2ebb';

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
            });
        }

        $scope.incCenterType = incCenterType;
        $scope.center = {
            centerType: eCenterTypes[0]
        };
        $scope.submit = sendSaveCommand;

        var centerGuid = $location.absUrl().match(/edit\/([a-f0-9]{24})\/?$/)[1];
        $http({
            method: 'GET',
            url: '/center/' + centerGuid
        }).then(function (res) {
            $scope.center = res.data;
        });
    });