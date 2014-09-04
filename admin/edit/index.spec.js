/*globals describe, module, inject, beforeEach, afterEach, it, expect*/
describe('edit center', function () {
    beforeEach(module('editcenter'));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.verifyNoOutstandingExpectation();
    }));

    it('should send POST', inject(function ($controller, $rootScope, $httpBackend) {
        $controller('newcenter', {
            $scope: $rootScope
        });

        $rootScope.center = {
            name: 'London',
            centerType: 'home'
        };
        $rootScope.submit();

        $httpBackend.expectPOST('/center', {
            name: 'London',
            centerType: 'home'
        }).respond(202);
    }));

    it('should have centerType home', inject(function ($controller, $rootScope) {
        $controller('newcenter', {
            $scope: $rootScope
        });

        expect($rootScope.center.centerType).toBe('home');
    }));

    it('should inciment centerType', inject(function ($controller, $rootScope) {
        $controller('newcenter', {
            $scope: $rootScope
        });

        expect($rootScope.center.centerType).toBe('home');
        $rootScope.incCenterType();
        expect($rootScope.center.centerType).toBe('school');
        $rootScope.incCenterType();
        expect($rootScope.center.centerType).toBe('home');
    }));
});