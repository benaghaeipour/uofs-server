/*jshint node:true*/
/*globals mocha, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app,
    request = require('supertest'),
    server = 'http://localhost:5000',
    expect = require('expect.js');

describe('/login', function () {

    it('should reset password', function (done) {
        request(server)
            .get('/login/reset?email=nope@blah.com')
            .expect(200, done);
    });

    it('should require email', function (done) {
        request(server)
            .get('/login/reset')
            .expect(500, done);
    });
});