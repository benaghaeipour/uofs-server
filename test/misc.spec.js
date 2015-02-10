/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('/', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

    it('should ignore favicon', function (done) {
        request(server)
            .get('/favicon.ico')
            .expect(200, done);
    });
});
