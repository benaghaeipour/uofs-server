'use strict';
/*globals mocha, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app = require('./app');
var expect = require('expect');
var request = require('supertest');
var proxyquire = require('proxyquire');

describe('/student', function () {
    var CreadtedUserId = '';

    beforeEach(function (done) {
        process.env.SYSADMIN_KEY = 'testing';
        this.timeout(15000);
        return app.listening ? done() : app.on('listening', done);
    });

    describe('/update', function () {

        it('should create a user', function (done) {
            request(app)
                .post('/student/update')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    username: 'scott',
                    email: 'scott@example.com',
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
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
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
                .expect(201)
                .expect('Content-Type', /application\/json/)
                .end(done);
        });

        it('should still have syllabus info', function (done) {
            request(app)
                .post('/student/find')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
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
        it('should not allow duplicate username/pw', function (done) {
            request(app)
                .post('/student/')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    username: 'scott',
                    center: 'blah',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(409)
                .end(done);
        });

        it('should not allow duplicate email/pw', function (done) {
            request(app)
                .post('/student/')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    email: 'scott@example.com',
                    center: 'blah',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(409)
                .end(done);
        });

        it('[lazy] should not allow duplicates', function (done) {
            request(app)
                .post('/student/update')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    username: 'scott',
                    center: 'blah',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(409)
                .end(done);
        });

        it('should respond OK to new username/pw combinations', function (done) {
            request(app)
                .post('/student/')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    username: 'not-here',
                    pw1: 'iii',
                    center: 'blah'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(200)
                .end(done);
        });

        it('should respond OK to new email/pw combinations', function (done) {
            request(app)
                .post('/student/')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    email: 'newuser@example.com',
                    pw1: 'iii',
                    center: 'blah'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(200)
                .end(done);
        });
    });

    describe('/find', function () {

        it('should now have one student', function (done) {
            request(app)
                .post('/student/find')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
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

    describe('/delete', function () {
        it('should remove student', function (done) {
            request(app)
                .post('/student/delete')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    _id: CreadtedUserId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(202, done);
        });
    });
});

describe('/users', function () {
    var route, mocks;

    beforeEach(function () {
        mocks = {
            db: {
                centers: {
                    findOne: function (query, cb) {
                        cb(null, { center: 'blah', defaultVoice: 2});
                    }
                },
                users: {
                    insert: function (query, cb) {
                        cb(null, {});
                    },
                    findOne: function (query, cb) {
                        cb(null, {});
                    }
                },
                '@noCallThru': true
            }
        };
        route = require('express')().use(proxyquire('./users', {
            './db': mocks.db
        }));
    });

    it('should use center defaultDialect for new user voice', function (done) {
        mocks.db.users.findOne = function (query, cb) { cb(null); };
        request(route)
            .post('/update')
            .send({ username: 'a-user', pw1: 'iii', center: 'blah' })
            .expect(201)
            .end(done);
    });

    it('should reject missing username', function (done) {
        request(route)
            .post('/update')
            .send({
                pw1: 'iii',
                center: 'blah'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should reject missing center', function (done) {
        request(route)
            .post('/update')
            .send({
                username: 'scott',
                pw1: 'iii'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should return scotts user', function (done) {
        mocks.db.users.findOne = function (query, opts, cb) { cb(null, {}); };
        request(route)
            .get('/scott')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(200)
            .end(done);
    });

    it('should reject voiceDialect values that are not a known dialect enum', function (done) {
        request(route)
            .post('/update')
            .send({
                username: 'scott',
                center: 'some center',
                pw1: 'iii',
                voiceDialect: 5
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should reject accountType values that are not a known dialect enum', function (done) {
        request(route)
            .post('/update')
            .send({
                username: 'scott',
                center: 'some center',
                pw1: 'iii',
                accountType: 5
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should reject readingSyllabus with less than 148 lessons', function (done) {
        var syllabus = [];
        syllabus[190] = null;

        request(route)
            .post('/update')
            .send({
                username: 'scott',
                center: 'some center',
                pw1: 'iii',
                readingSyllabus: syllabus
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should reject spellingSyllabus with less than 148 lessons', function (done) {
        var syllabus = [];
        syllabus[140] = null;

        request(route)
            .post('/update')
            .send({
                username: 'scott',
                center: 'some center',
                pw1: 'iii',
                spellingSyllabus: syllabus
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should reject memorySyllabus with less than 148 lessons', function (done) {
        var syllabus = [];
        syllabus[140] = null;

        request(route)
            .post('/update')
            .send({
                username: 'scott',
                center: 'some center',
                pw1: 'iii',
                memorySyllabus: syllabus
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });

    it('should reject dictationSyllabus with less than 148 lessons', function (done) {
        var syllabus = [];
        syllabus[140] = null;

        request(route)
            .post('/update')
            .send({
                username: 'scott',
                center: 'some center',
                pw1: 'iii',
                dictationSyllabus: syllabus
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400)
            .end(done);
    });
});
