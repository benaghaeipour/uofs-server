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

    it('should redirect /us', function (done) {
        request(server)
            .get('/us/something')
            .expect('Location', /static\.unitsofsound\.net\/us\/something/)
            .expect(302, done);
    });

    it('should redirect /uk', function (done) {
        request(server)
            .get('/uk/something')
            .expect('Location', /static\.unitsofsound\.net\/uk\/something/)
            .expect(302, done);
    });
});
