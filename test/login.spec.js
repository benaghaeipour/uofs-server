/*jshint node:true*/
/*globals mocha, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app = require('../app'),
    request = require('supertest'),
    expect = require('expect');

describe('/login', function () {

    beforeEach(function (done) {
        this.timeout(15000);
        app.listening ? done() : app.on('listening', done);
    });

    //re-enable when ive figured out how to do better tests
    xit('should reset password', function (done) {
        request(app)
            .get('/login/reset?email=nope@blah.com')
            .expect(200, done);
    });

    it('should require email', function (done) {
        request(app)
            .get('/login/reset')
            .expect(500, done);
    });

    it('should 404 when no user is found', function (done) {
        request(app)
            .get('/login/reset?email=does-not-exists@nowhere.com')
            .expect(404, done);
    });
});