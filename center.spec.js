/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('/center', function () {
    var request = require('supertest'),
        app = require('./app'),
        expect = require('expect');

    var CreadtedCenterId = '';

    beforeEach(function (done) {
        this.timeout(15000);
        app.listening ? done() : app.on('listening', done);
    });

    it('should bounce missing purchaser', function (done) {
        request(app)
            .put('/center')
            .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
            .send({
                name: 'Manchester',
                centerType: 'home'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(400, done);
    });

    it('should create a center', function (done) {
        request(app)
            .put('/center')
            .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
            .send({
                name: 'Manchester',
                centerType: 'home',
                purchaser: 'blah@blah.com'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                CreadtedCenterId = res.body._id;
                expect(CreadtedCenterId).toMatch(/[a-f0-9]{24}/);

                var center = res.body;
                expect(center.name).toBe('Manchester');
                expect(center.purchaser).toBe('blah@blah.com');
                expect(center.defaultVoice).toBe(0);
            })
            .expect(201, done);
    });

    it('should query center with name', function (done) {
        request(app)
            .get('/center')
            .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
            .query({name: 'Manchester'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(function (res) {

            expect(res.body.length).toBe(1);
            })
            .expect(200, done);
    });

    it('should get center by ID', function (done) {
        request(app)
            .get('/center/' + CreadtedCenterId)
            .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(function (res) {
                var center = res.body;
                expect(center).toBeAn(Object);
                expect(center.maxLicencedStudentsForThisCenter).toBe(0);
                expect(center.expiryDate).toBe(null);
                expect(center.purchaser).toMatch(/.+@.+\..+/);
                expect(center.defaultVoice).toBe(0);
                expect(center.sourceNumber).toBe(1);
            })
            .expect(200, done);
    });

    it('should update a center', function (done) {
        request(app)
            .post('/center/' + CreadtedCenterId)
            .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
            .send({
                name: 'Manchester',
                centerType: 'home',
                purchaser: 'nope@blah.com'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Cache-Control', /no/)
            .expect(function (res) {
                expect(res.body).toBeAn(Object);
                console.log(res.body);
//                expect(res.body.purchaser).toMatch(/nope/);
            })
            .expect(202, done);
    });

    xit('should remove center', function (done) {
        request(app)
            .delete('/center/' + CreadtedCenterId)
            .auth('fred', 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(200, done);
    });
});
