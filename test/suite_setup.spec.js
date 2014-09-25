/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach, before, after*/


before(function (done) {
    this.timeout = 5000;

    var mongodb = require('mongodb');
    mongodb.connect(process.env.DB_URI, {}, function (err, DB) {
        DB.dropCollection('users', function () {
            DB.dropCollection('centers', function () {
                console.log('done clearing down db');
                done();
            });
        });
    });
});

after(function (done) {
    var request = require('supertest');

        request('http://localhost:5000')
            .post('/student/update')
            .send({
                username: 'scott',
                center: 'Manchester',
                pw1: 'iii'
            })
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json');
});

//before(function (done) {
//    this.timeout = 5000;
//
//    var serverProcess;
//    serverProcess = require('../app.js');
//    serverProcess.on('listening', function () {
//        console.log('app is listening');
//        done();
//    });
//});
