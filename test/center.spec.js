/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('/center', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000',
        expect = require('expect.js');

    var CreadtedCenterId = '';

    it('should create a center', function (done) {
        request(server)
            .put('/center')
            .send({
                name: 'Manchester',
                centerType: 'home'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                CreadtedCenterId = res.body._id;
                expect(CreadtedCenterId).to.match(/[a-f0-9]{24}/);
            })
            .expect(201, done);
    });

    it('should query center with name', function (done) {
        request(server)
            .get('/center')
            .query({name: 'Manchester'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(function (res) {
                expect(res.body).to.be.an('array');
                expect(res.body.length).to.be(1);
            })
            .expect(200, done);
    });

    it('should get center by ID', function (done) {
        request(server)
            .get('/center/' + CreadtedCenterId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(function (res) {
                expect(res.body).to.be.an('object');
            })
            .expect(200, done);
    });

    it('should update a center', function (done) {
        request(server)
            .post('/center/' + CreadtedCenterId)
            .send({blah:'blah'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Cache-Control', /no/)
            .expect(202, done);
    });

    xit('should remove center', function (done) {
        request(server)
            .delete('/center/' + CreadtedCenterId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(200, done);
    });
});
