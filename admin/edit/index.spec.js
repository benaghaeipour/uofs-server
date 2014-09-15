/*globals describe, module, inject, beforeEach, afterEach, it, expect*/
describe('edit center', function () {
    beforeEach(module('editcenter'));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.verifyNoOutstandingExpectation();
    }));

    it('should send POST', inject(function ($controller, $rootScope, $httpBackend, $location) {
        $location.url('/edit/aaaaaaaaaaaaaaaaaaaaaaaa');
        $httpBackend.whenGET('/center/aaaaaaaaaaaaaaaaaaaaaaaa').respond({
            name: 'London',
            centerType: 'home'
        });

        $controller('editcenter', {
            $scope: $rootScope
        });

        $rootScope.center = {
            name: 'London',
            centerType: 'school'
        };
        $rootScope.submit();

        $httpBackend.expectPOST('/center/aaaaaaaaaaaaaaaaaaaaaaaa', {
            name: 'London',
            centerType: 'school'
        }).respond(202);
    }));

    it('should load center ', inject(function ($controller, $rootScope, $httpBackend, $location) {
        $location.url('/edit/aaaaaaaaaaaaaaaaaaaaaaaa');
        $controller('editcenter', {
            $scope: $rootScope
        });

        $httpBackend.expectGET('/center/aaaaaaaaaaaaaaaaaaaaaaaa').respond({
            name: 'London',
            centerType: 'home'
        });

        expect($location.url()).toMatch(/aaaaaaaaaaaaaaaaaaaaaaaa/);
    }));

    it('should inciment centerType', inject(function ($controller, $rootScope, $httpBackend, $location) {
        $location.url('/edit/aaaaaaaaaaaaaaaaaaaaaaaa');
        $httpBackend.whenGET('/center/aaaaaaaaaaaaaaaaaaaaaaaa').respond({
            name: 'London',
            centerType: 'home'
        });

        $controller('editcenter', {
            $scope: $rootScope
        });

        expect($rootScope.center.centerType).toBe('home');
        $rootScope.incCenterType();
        expect($rootScope.center.centerType).toBe('school');
        $rootScope.incCenterType();
        expect($rootScope.center.centerType).toBe('home');
    }));

    it('should save updates', inject(function ($controller, $rootScope, $httpBackend, $location) {
        $location.url('/edit/aaaaaaaaaaaaaaaaaaaaaaaa');
        $httpBackend.whenGET('/center/aaaaaaaaaaaaaaaaaaaaaaaa').respond({
            name: 'London',
            centerType: 'home'
        });
        $httpBackend.expectPOST('/center/aaaaaaaaaaaaaaaaaaaaaaaa').respond({
            name: 'New York',
            centerType: 'home'
        });

        $controller('editcenter', {
            $scope: $rootScope
        });

        $rootScope.center.name = 'New York';
        $rootScope.submit();

    }));
});