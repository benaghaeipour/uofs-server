/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

describe('uofs-server', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000',
        expect = require('expect.js');

    var CreadtedCenterId = '';

    it('should create a center', function (done) {
        request(server)
            .put('/center')
            .send({
                name: 'Manchester'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                CreadtedCenterId = res.body[0]._id;
                expect(CreadtedCenterId).to.match(/[a-f0-9]{24}/);
            })
            .expect(201, done);
    });

    it('should find center by name', function (done) {
        request(server)
            .post('/center/find')
            .send({
                name: 'Manchester',
                centerType: 'home'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body).to.be.an(Object);
                expect(res.body._id).to.match(/[a-f0-9]{24}/);
                expect(res.body.name).to.be('Manchester');
            })
            .expect(200, done);
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

    xit('should find center by ID', function (done) {
        request(server)
            .post('/center/find')
            .send({_id: CreadtedCenterId})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(function (res) {
                expect(res.body).to.be.an('object');
                expect(res.body._id).to.eql(CreadtedCenterId);
                expect(res.body.name).to.be('Manchester');
            })
            .expect(200, done);
    });

    xit('should query center with ID', function (done) {
        request(server)
            .get('/center')
            .query({_id: CreadtedCenterId})
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

    xit('should update a center', function (done) {
        request(server)
            .post('/center/update')
            .send({_id: CreadtedCenterId, blah:'blah'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(201, done);
    });

    xit('[new] should update a center', function (done) {
        request(server)
            .post('/center')
            .send({_id: CreadtedCenterId, blah:'blah'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect('Cache-Control', /no/)
            .expect(201, done);
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
