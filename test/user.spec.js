/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app;

describe('/student', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000',
        expect = require('expect.js');

    var CreadtedUserId = '';

    describe('/update', function () {

        it('should reject missing username', function (done) {
            request(server)
                .post('/student/update')
                .send({
                    pw1: 'iii',
                    center: 'blah'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(400, done);
        });

        it('should reject missing password', function (done) {
            request(server)
                .post('/student/update')
                .send({
                    username: 'scott',
                    center: 'blah'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(400, done);
        });

        it('should reject missing center', function (done) {
            request(server)
                .post('/student/update')
                .send({
                    username: 'scott',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(400, done);
        });

        it('should create a user', function (done) {
            request(server)
                .post('/student/update')
                .send({
                    username: 'scott',
                    center: 'blah',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /application\/json/)
                .expect(function (res) {
                    var CreadtedUser = res.body[0];
                    CreadtedUserId = CreadtedUser._id;
                    expect(CreadtedUser._id).to.match(/[a-f0-9]{24}/);
                    expect(CreadtedUser.spellingSyllabus.length).to.be(150);
                    expect(CreadtedUser.memorySyllabus.length).to.be(150);
                    expect(CreadtedUser.dictationSyllabus.length).to.be(150);
                    expect(CreadtedUser.readingSyllabus.length).to.be(299);
                    expect(CreadtedUser.voiceDialect).to.be(2);
                })
                .expect(201, done);
        });
    });

    describe('creation', function () {
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
    });

    describe('/find', function () {

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
    });

    describe('/login', function () {
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
    });

    describe('/delete', function () {
        it('should fail to login', function (done) {
            request(server)
                .post('/login')
                .send({username: 'no-one', pw1:'nothing'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(401, done);
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

});
