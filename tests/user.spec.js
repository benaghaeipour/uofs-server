/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

//var app;
//
//beforeEach(function (done) {
//    app = require('../app');
//    setTimeout(done, 5000);
//});
//
//afterEach(function () {
//    app.close();
//});

describe('uofs-server', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

    it('should fail to login', function (done) {
        request(server)
            .post('/login')
            .send({username: 'no-one', pw1:'nothing'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(401, done);
    });

    var CreadtedUserId = '';

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
                CreadtedUserId = res.body[0]._id;
                expect(CreadtedUserId).toMatch(/[a-f0-9]{24}/);
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
                expect(res.body.length).toBeGreaterThan(0);
            })
            .expect(200, done);
    });

    it('should login', function (done) {
        request(server)
            .post('/login')
            .send({pw1:"testPass",username:"testUser"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body._id).toMatch(/[a-f0-9]{24}/);
            })
            .expect(200, done);
    });

    it('should remove student', function (done) {
        request(server)
            .post('/student/delete')
            .send({
                _id: CreadtedUserId
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(202, done);
    });
});
