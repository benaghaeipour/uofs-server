/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('route - admin/', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000',
        expect = require('expect');

    it('should require auth', function (done) {
        request(server)
            .get('/admin')
            .expect('WWW-Authenticate', 'Basic')
            .expect(401, done);
    });
});