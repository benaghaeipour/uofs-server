/*globals describe, module, inject, beforeEach, it, beforeEach, afterEach, expect*/
xdescribe('centers', function () {

    beforeEach(module('admin'));
    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.verifyNoOutstandingExpectation();
    }));

    it('should get list of centers', inject(function ($controller, $rootScope, $httpBackend) {
        $controller('centers', {
            $scope: $rootScope
        });

        $httpBackend.expectGET('/center').respond([{_id:'some-long-id'}]);
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
