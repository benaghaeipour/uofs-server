/*jshint node:true*/
/*globals mocha, expect, it, xit, describe*/
describe('uofs-server', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

//    it('should force https', function (done) {
//        request(server)
//            .get('/ index.html')
//            .expect(301)
//            .expect('Location', /static\.unitsofsound\.net\/uk/, done);
//    });

    it('should ignore favicon', function (done) {
        request(server)
            .get('/favicon.ico')
            .expect(200, done);
    });

    it('should redirect /uk and /us', function (done) {
        request(server)
            .get('/uk/something')
            .expect('Location', /static\.unitsofsound\.net\/uk\/something/)
            .expect(301, done);
        request(server)
            .get('/us/something')
            .expect('Location', /static\.unitsofsound\.net\/us\/something/)
            .expect(301, done);
    });

    it('should login', function (done) {
        request(server)
            .post('/login', {username: 'no-one', pw1:'nothing'})
            .set('Accept', 'application/json')
            .expect(401, done);
    });
});
