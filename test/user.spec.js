/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app = require('../app');;

describe('/student', function () {
    var request = require('supertest'),
        expect = require('expect');

    var CreadtedUserId = '';

    beforeEach(function (done) {
        this.timeout(15000);
        app.listening ? done() : app.on('listening', done);
    });

    describe('/update', function () {

        it('should reject missing username', function (done) {
            request(app)
                .post('/student/update')
                .send({
                    pw1: 'iii',
                    center: 'blah'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(400, done);
        });

        xit('should reject missing password', function (done) {
            request(app)
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
            request(app)
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
            request(app)
                .post('/student/update')
                .send({
                    username: 'scott',
                    center: 'blah',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(201)
                .expect('Content-Type', /application\/json/)
                .expect(function (res) {
                    var CreadtedUser = res.body[0];
                    CreadtedUserId = CreadtedUser._id;
                    expect(CreadtedUser._id).toMatch(/[a-f0-9]{24}/);
                    expect(CreadtedUser.spellingSyllabus.length).toBe(150);
                    expect(CreadtedUser.memorySyllabus.length).toBe(150);
                    expect(CreadtedUser.dictationSyllabus.length).toBe(150);
                    expect(CreadtedUser.readingSyllabus.length).toBe(299);
                    expect(CreadtedUser.voiceDialect).toBe(0);
                }).end(done);
        });

        it('should not destroy syllabus', function (done) {
            request(app)
                .post('/student/update')
                .send({
                    _id: CreadtedUserId,
                    username: 'scott',
                    center: 'blah',
                    pw1: 'iii',
                    dictationSyllabus: [],
                    spellingSyllabus: [],
                    readingSyllabus: [],
                    memorySyllabus: []
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(201, done)
                .expect('Content-Type', /application\/json/)
                .end(done);
        });

        it('should still have syllabus info', function (done) {
            request(app)
                .post('/student/find')
                .send({
                    _id: CreadtedUserId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /application\/json/)
                .expect(function (res) {
                    var CreadtedUser = res.body[0];
                    CreadtedUserId = CreadtedUser._id;
                    expect(CreadtedUser._id).toMatch(/[a-f0-9]{24}/);
                    expect(CreadtedUser.spellingSyllabus.length).toBe(150);
                    expect(CreadtedUser.memorySyllabus.length).toBe(150);
                    expect(CreadtedUser.dictationSyllabus.length).toBe(150);
                    expect(CreadtedUser.readingSyllabus.length).toBe(299);
                    expect(CreadtedUser.voiceDialect).toBe(0);
                })
                .end(done);
        });
    });

    describe('creation', function () {
        it('should not allow duplicates', function (done) {
            request(app)
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
            request(app)
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
            request(app)
                .post('/student/find')
                .send({})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /application\/json/)
                .expect(function (res) {
                    expect(res.body).toBeAn(Array);
                    expect(res.body.length).toBeGreaterThan(0);
                })
                .end(done);
        });
    });

    describe('/login', function () {
        it('should login', function (done) {
            request(app)
                .post('/login')
                .send({pw1:"iii",username:"scott"})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /application\/json/)
                .expect(function (res) {
                    expect(res.body._id).toMatch(/[a-f0-9]{24}/);
                })
                .end(done);
        });
    });

    describe('/delete', function () {
        it('should fail to login', function (done) {
            request(app)
                .post('/login')
                .send({username: 'no-one', pw1:'nothing'})
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(401, done);
        });

         it('should remove student', function (done) {
            request(app)
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
