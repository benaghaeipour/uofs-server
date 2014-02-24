/*jshint node:true*/
/*globals mocha, expect, it, describe*/
describe('uofs-server', function () {
    var request = require('supertest'),
        server = require('../app'),
        expect = request('expect.js');

    it('should pass', function () {
        request(server)
            .get('/favicon.ico')
            .expect(200);
    });
});