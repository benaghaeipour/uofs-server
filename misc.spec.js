/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('/', function () {
    var request = require('supertest'),
        app = require('./app');

    beforeEach(function (done) {
        this.timeout(15000);
        app.listening ? done() : app.on('listening', done);
    });

    it('should ignore favicon', function (done) {
        request(app)
            .get('/favicon.ico')
            .expect(200, done);
    });
});
