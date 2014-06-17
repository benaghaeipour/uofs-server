/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var recordingSamples = '';

beforeEach(function () {
    //create 400k of "sound" data

    while (recordingSamples.length < 400000) {
        recordingSamples += require('uuid')();
    }
});

describe('recording endpoint', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

    it('should 404 when there is no sound data', function (done) {
        request(server)
            .get('/recordings/123456789/1/2/3/52')
            .expect('Cache-Control', /no/)
            .expect(404, done);
    });

    xit('should save uploaded data', function (done) {
        request(server)
            .post('/recordings/123456789/1/2/3/4')
            .send('recordingSamples')
            .expect(201, done);
    });

    xit('should return uploaded data', function (done) {
        request(server)
            .get('/recordings/123456789/1/2/3/4')
            .expect('Cache-Control', /no/)
            .expect(200, 'recordingSamples', done);
    });
});
