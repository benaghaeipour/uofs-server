'use strict';
/*globals mocha, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var app = require('../app');
var expect = require('expect');
var request = require('supertest');
var proxyquire = require('proxyquire');

describe('/student', function () {
    var CreadtedUserId = '';

    beforeEach(function (done) {
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
        it('should not allow duplicates', function (done) {
            request(app)
                .post('/student/')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
                .send({
                    username: 'scott',
                    pw1: 'iii'
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect(409, done);
        });

        it('[lazy] should not allow duplicates', function (done) {
            request(app)
                .post('/student/update')
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
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
                .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
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
                    findOne: function (query, opts, cb) {
                        cb(null, { center: 'blah', defaultVoice: 2});
                    }
                },
                users: {
                    insert: function (query, cb) {
                        cb(null, {});
                    },
                    find: function (query) {
                        return {
                            toArray: function (cb) {
                                cb(null, []);
                            }
                        };
                    }
                },
                '@noCallThru': true
            }
        };
        route = require('express')().use(proxyquire('../users', {
            './db': mocks.db
        }));
    });

    it('should use center defaultDialect for new user voice', function (done) {
        request(route)
            .post('/update')
            .send({ username: 'a-user', pw1: 'iii', center: 'blah' })
            .expect(200, function () {
                done();
            });
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
            .expect(400, done);
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
            .expect(400, done);
    });
});
