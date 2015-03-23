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

    it('should require auth', function (done) {
        request(app)
            .get('/admin')
            .set('Accept', 'text/html')
            .expect(401)
            .expect('WWW-Authenticate', 'Basic')
            .end(done);
    });

    it('should return the angular app', function (done) {
        request(app)
            .get('/admin')
            .set('Accept', 'text/html')
            .auth('chris@matheson.it', 'JjSlotnF49k8Qr1p3fPKmefCaC8Jpe/LoNrb5WSWtRI=')
            .expect(303)
            .end(done);
    });
});