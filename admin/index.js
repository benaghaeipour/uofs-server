/*globals angular*/
angular.module('admin', ['ngResource'])
    .config(function ($httpProvider) {
        $httpProvider.defaults.headers.common = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    })
    .controller('centers', function ($scope, $resource, $q) {
        var Center = $resource('/center/:_id');

        $scope.iconTypeForCenterType = function (centerType) {
            var mapping = {
                school: 'fa-building',
                home :'fa-home'
            };
            return mapping[centerType] || 'fa-question-circle';
        };

        var centerList = Center.query(function (data) {
            $scope.list = data;
        });
    });