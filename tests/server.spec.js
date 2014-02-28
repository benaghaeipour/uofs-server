/*jshint node:true*/
/*globals mocha, expect, it, xit, describe*/
describe('uofs-server', function () {
    var request = require('supertest'),
        server = require('../app');

    it('should ignore favicon', function (done) {
        request(server)
            .get('/favicon.ico')
            .expect(200, done);
    });

    it('should redirect /uk and /us', function (done) {
        request(server)
            .get('/uk/something')
            .expect(301, done);
        request(server)
            .get('/us/something')
            .expect(301, done);
    });

    xit('should login', function (done) {
        request(server)
            .post('/login', {username: 'no-one', pw1:'nothing'})
            .expect(200, done);
    });
});