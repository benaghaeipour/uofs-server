/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe*/
describe('uofs-server', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

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

    it('should fail to login', function (done) {
        request(server)
            .post('/login')
            .send({username: 'no-one', pw1:'nothing'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(401, done);
    });

    it('should login', function (done) {
        request(server)
            .post('/login')
            .send({"center":null,"pw1":"iii","username":"scott4"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body._id).toMatch(/[a-f0-9]{24}/);
            })
            .expect(200, done);
    });

    it('should 404 with no recording', function (done) {
        request(server)
            .get('/recordings/123456789/1/2/3/4')
            .expect(404, done);
    });

    it('should create a user', function (done) {
        request(server)
            .post('/student/update')
            .send({
                username: 'testUser',
                pw1: 'testPass'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body[0]._id).toMatch(/[a-f0-9]{24}/);
            })
            .expect(201, done);
    });

    it('should now have one student', function (done) {
        request(server)
            .post('/student/find')
            .send({})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body).toEqual(jasmine.any(Array));
            })
            .expect(200, done);
    });
});
