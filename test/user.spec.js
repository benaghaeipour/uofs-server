/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app;

describe('/user', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000',
        expect = require('expect.js');

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
                username: 'scott',
                accountType: 0,  //so that when we use this external to tests it will be a "teacher"
                pw1: 'iii'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                CreadtedUserId = res.body[0]._id;
                expect(CreadtedUserId).to.match(/[a-f0-9]{24}/);
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
                expect(res.body).to.be.an('array');
                expect(res.body.length).to.be.greaterThan(0);
            })
            .expect(200, done);
    });

    it('should not allow duplicates', function (done) {
        request(server)
            .post('/student/')
            .send({
                username: 'scott',
                pw1: 'iii'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(409, done);
    });

    it('should respond OK to new username/pw combinations', function (done) {
        request(server)
            .post('/student/')
            .send({
                username: 'not-here',
                pw1: 'iii'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(200, done);
    });

    it('should login', function (done) {
        request(server)
            .post('/login')
            .send({pw1:"iii",username:"scott"})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body._id).to.match(/[a-f0-9]{24}/);
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
