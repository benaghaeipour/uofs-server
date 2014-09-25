/*globals describe, module, inject, beforeEach, it, beforeEach, afterEach, expect*/
describe('centers', function () {

    beforeEach(module('admin'));
    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.verifyNoOutstandingExpectation();
    }));

    it('should get list of centers', inject(function ($controller, $rootScope, $httpBackend) {
        $controller('centers', {
            $scope: $rootScope
        });

        $httpBackend.expectGET('/center').respond([]);
    }));

    it('should get center details', inject(function ($controller, $rootScope, $httpBackend) {
        $httpBackend.whenGET('/center').respond([{_id:'some-long-id'}]);

        $controller('centers', {
            $scope: $rootScope
        });

        $httpBackend.expectGET('/center/some-long-id').respond(200);
        $httpBackend.flush();
    }));

    it('iconTypeForCenterType', inject(function ($controller, $rootScope, $httpBackend) {
        $httpBackend.whenGET('/center').respond([]);
        $controller('centers', {
            $scope: $rootScope
        });

        expect($rootScope.iconTypeForCenterType('home')).toBe('fa-home');
        expect($rootScope.iconTypeForCenterType('school')).toBe('fa-building');
    }));
});
