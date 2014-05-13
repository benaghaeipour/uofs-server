/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe*/

//beforeEach(function (done) {
//    var mongodb = require('mongodb'),
//        db;
//    mongodb.connect('mongodb://c9:c9@oceanic.mongohq.com:10015/dev', {}, function (err, dbconnection) {
//        if (err) { throw (err);}
//        console.log('Connected to dev DB in Spec');
//        db = dbconnection;
//        db.users.drop();
//        db.centers.drop();
//        console.log('done');
//        done();
//    });
//});

xdescribe('uofs-server', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

    it('should ignore favicon', function (done) {
        request(server)
            .get('/favicon.ico')
            .expect(200, done);
    });

    it('should redirect /uk and /us', function (done) {
        request(server)
            .get('/uk/something')
            .expect('Location', /static\.unitsofsound\.net\/uk\/something/)
            .expect(302, done);
        request(server)
            .get('/us/something')
            .expect('Location', /static\.unitsofsound\.net\/us\/something/)
            .expect(302, done);
    });

    it('should fail to login', function (done) {
        request(server)
            .post('/login')
            .send({username: 'no-one', pw1:'nothing'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect(401, done);
    });

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
                expect(res.body[0]._id).toMatch(/[a-f0-9]{24}/);
            })
            .expect(201, done);
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

    it('should 404 with no recording', function (done) {
        request(server)
            .get('/recordings/123456789/1/2/3/4')
            .expect(404, done);
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

    xit('should have one center', function (done) {
        request(server)
            .post('/center/find')
            .send({name: 'Manchester'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(function (res) {
                expect(res.body).toEqual(jasmine.any(Object));
                expect(res.body.name).toBe('Manchester');
            })
            .expect(200, done);
    });

    xit('should update a center', function (done) {
        request(server)
            .post('/center/update')
            .send({_id: 'a12321312321321321ab5555', blah:'blah'})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(201, done);
    });
});
