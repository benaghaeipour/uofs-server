/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('route - admin/', function () {
    var request = require('supertest'),
        expect = require('expect'),
        app = require('../app');

    beforeEach(function (done) {
        this.timeout(15000);
        app.listening ? done() : app.on('listening', done);
    });

    it('should require auth', function (done) {
        request(app)
            .get('/admin')
            .expect('WWW-Authenticate', 'Basic')
            .expect(401, done);
    });
});