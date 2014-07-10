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
            return mapping[centerType];
        };

        var centerList = Center.query(function (data) {
            $q.all(data.map(function (obj) {
                return Center.get(obj);
            })).then(function (listData) {
                $scope.list = listData;
            });
        });
    });