/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe*/
describe('uofs-server', function () {
    var request = require('supertest'),
        server = 'http://localhost:5000';

//    it('should force https', function (done) {
//        request(server)
//            .get('/ index.html')
//            .expect(301)
//            .expect('Location', /static\.unitsofsound\.net\/uk/, done);
//    });

    it('should ignore favicon', function (done) {
        request(server)
            .get('/favicon.ico')
            .expect(200, done);
    });

    it('should redirect /uk and /us', function (done) {
        request(server)
            .get('/uk/something')
            .expect('Location', /static\.unitsofsound\.net\/uk\/something/)
            .expect(301, done);
        request(server)
            .get('/us/something')
            .expect('Location', /static\.unitsofsound\.net\/us\/something/)
            .expect(301, done);
    });

    it('should login', function (done) {
        request(server)
            .post('/login', {username: 'no-one', pw1:'nothing'})
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    iit('should login', function (done) {
        request(server)
            .post('/login', {"center":null,"syllabusTypeReading":false,"pw1":"iii","passwordHint":null,"accountType":0,"readingSyllabus":[],"overlapReading":true,"_id":null,"nextSkillToWorkOn":1,"aPage":false,"syllabusTypeMemDic":false,"recording":true,"syllabusTypeSpelling":false,"placementReading":true,"memorySyllabus":[],"placementSpelling":true,"studentEmail":null,"username":"scott4","syllabusAutoReadAndSpell":false,"dictationSyllabus":[],"screenTutor":"ON","yearGroup":0,"loginLock":false,"spellingSyllabus":[],"workAreaColour":16777215,"syllabusAutoAll":true,"studentLock":false,"MainBackgroubdColour":16777215,"voiceDialect":1,"skillPlan":null,"surname":null,"autoSkills":true,"firstName":null,"soundLevel":0.5})
            .set('Accept', 'application/json')
            .expect(200, done);
    });

    it('should create a user', function (done) {
        request(server)
            .post('/student/update', {
                username: 'testUser',
                pw1: 'testPass'
            })
            .set('Accept', 'application/json')
            .expect(201, done);
    });

    xit('should now have one student', function (done) {
        request(server)
            .post('/student/find', { username: true})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, function (res) {
                expect(res).toBe(jasmine.any(Array));
                done();
            });
    });
});
