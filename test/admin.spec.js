/*jslint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/
'use strict';

var crypto = require('crypto');

describe('route - admin/', function () {
    var request = require('supertest'),
        expect = require('expect'),
        app = require('../app');

    beforeEach(function (done) {
        this.timeout(15000);
        return app.listening ? done() : app.on('listening', done);
    });

    beforeEach(function (done) {
        console.log('creating things');
        request(app)
            .post('/student/updtae')
            .send({
                username: 'an-actual-user',
                center: 'blah',
                pw1: 'correct-password'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function () {
                console.log('successfully set up the user');
                done();
            });
    });

    it('should require auth', function (done) {
        request(app)
            .get('/admin')
            .expect(401)
            .expect('WWW-Authenticate', 'Basic')
            .end(done);
    });

    it('should 404 an unknown user', function (done) {
        request(app)
            .get('/admin')
            .auth('no-one-special', 'dont-even-care')
            .expect(404)
            .end(done);
    });

    xit('should 401 when wrong password', function (done) {
        request(app)
            .get('/admin')
            .auth('an-actual-user', 'wrong-password')
            .expect(401)
            .end(done);
    });

    it('should return the angular app', function (done) {
        request(app)
            .get('/admin')
            .auth('chris@matheson.it', 'JjSlotnF49k8Qr1p3fPKmefCaC8Jpe/LoNrb5WSWtRI=')
            .expect(303)
            .end(done);
    });
});