/*jshint node:true*/
/*globals mocha, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app,
    request = require('supertest'),
    server = 'http://localhost:5000',
    expect = require('expect.js');

describe('/login', function () {

    //re-enable when ive figured out how to do better tests
    xit('should reset password', function (done) {
        request(server)
            .get('/login/reset?email=nope@blah.com')
            .expect(200, done);
    });

    it('should require email', function (done) {
        request(server)
            .get('/login/reset')
            .expect(500, done);
    });

    it('should 404 when no user is found', function (done) {
        request(server)
            .get('/login/reset?email=does-not-exists@nowhere.com')
            .expect(404, done);
    });
});