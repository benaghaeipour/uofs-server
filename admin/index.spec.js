/*globals describe, module, inject, beforeEach, it*/
describe('centers', function () {

    beforeEach(module('admin'));

    it('should get list of centers', inject(function ($controller, $rootScope, $httpBackend) {
        $controller('centers', $rootScope);
    }));
});
