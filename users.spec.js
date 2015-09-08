'use strict';
/*globals it, describe, beforeEach*/

var app = require('./app');
var expect = require('expect');
var request = require('supertest');
var proxyquire = require('proxyquire');
var db = require('./db');
var adjNoun = require('adj-noun');

function seedDB(done) {
  console.log('creating a bunch of legacy data');
  db.users.insertMany([
    {username: 'existing-deleted', email: 'unique2@Example.com', center: 'Manchester', pw1: 'unique2', deleted: 'some-date'},
    {username: 'existing-dup-username-and-pass', email: 'unique3@Example.com', center: 'Manchester', pw1: 'dup-pass'},
    {username: 'existing-dup-username-and-pass', email: 'unique4@Example.com', center: 'Manchester', pw1: 'dup-pass'},
    {username: 'unique1', email: 'dup-email@Example.com', center: 'Manchester', pw1: 'unique3'},
    {username: 'unique2', email: 'dup-email@Example.com', center: 'Manchester', pw1: 'unique4'},
    {username: 'dup-with-prev-deleted', email: 'unique5@Example.com', center: 'Manchester', pw1: 'unique5', deleted: 'some-date'},
    {username: 'dup-with-prev-deleted', email: 'unique6@Example.com', center: 'Manchester', pw1: 'unique6'},
    {username: 'existing-dup-username', email: 'unique7@Example.com', center: 'Manchester', pw1: 'unique7'},
    {username: 'existing-dup-username', email: 'unique8@Example.com', center: 'Manchester', pw1: 'unique8'},
    {username: 'unique3', email: 'existing@Example.com', center: 'Manchester', pw1: 'unique9'},
  ], done);
}

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
                    email: 'scott@Example.com',
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
                .expect(400)
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

    describe('/:username', function () {
      it('should find an existing user by username', function (done) {
        db.users.insert({
          username: 'existing',
          email: adjNoun().join('') + '@Example.com',
          center: 'Manchester',
          pw1: adjNoun()
        }, function (err) {
          if (err) { return done(err); }
          request(app)
              .get('/users/existing')
              .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(200, done);
        });
      });

      it('should find an existing user by email', function (done) {
        db.users.insert({
          username: adjNoun(),
          email: 'existing-email@example.com',
          center: 'Manchester',
          pw1: adjNoun()
        }, function (err) {
          if (err) { return done(err); }
          request(app)
              .get('/users/existing-email@Example.com')
              .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(200, done);
        });
      });

      it('should return the non deleted user', function (done) {
        db.users.insertMany([{
          username: 'dup-with-prev-deleted',
          email: 'wrong@Example.com',
          center: 'Manchester',
          pw1: adjNoun(),
          deleted: 'some-date'
        }, {
          username: 'dup-with-prev-deleted',
          email: 'correct@Example.com',
          center: 'Manchester',
          pw1: adjNoun()
        }], function (err) {
          if (err) { return done(err); }
          request(app)
              .get('/users/dup-with-prev-deleted')
              .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(200)
              .expect(/correct/, done);
        });
      });

      it('should return me', function (done) {
        db.users.insertMany([{
          username: 'dup-user',
          email: 'wrong@Example.com',
          center: 'Manchester',
          pw1: 'first-password'
        }, {
          username: 'dup-user',
          email: 'correct@Example.com',
          center: 'Manchester',
          pw1: 'second-password'
        }], function (err) {
          if (err) { return done(err); }
          request(app)
              .get('/users/dup-user')
              .auth('dup-user', 'second-password')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(200)
              .expect(/second-password/, done);
        });
      });

      it('should not find username', function (done) {
          request(app)
              .get('/student/not-there-at-all')
              .auth('scott', 'iii')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(404, done);
      });

      it('should not find email', function (done) {
          request(app)
              .get('/student/not-there-at-all@blah.com')
              .auth('scott', 'iii')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(404, done);
      });

      it('should not find partial student name', function (done) {
          request(app)
              .get('/student/sco')
              .auth('scott', 'iii')
              .set('Accept', 'application/json')
              .set('Content-Type', 'application/json')
              .expect(404, done);
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

    xit('should return scotts user', function (done) {
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
