/*jslint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach, before, after*/
'use strict';

function clearDown(done) {
    var mongodb = require('mongodb');
    mongodb.connect(process.env.DB_URI, {}, function (err, DB) {
        DB.dropCollection('users', function () {
            DB.dropCollection('centers', function () {
                console.log('done clearing down db');
                DB.close();
                done();
            });
        });
    });
}

before(function (done) {
    process.env.SYSADMIN_KEY = 'test';
    this.timeout(15000);
    clearDown(done);
});

//after(function (done) {
//    this.timeout(15000);
//    var request = require('supertest');
//
//    request(process.env.DB_URI)
//        .post('/student/update')
//        .send({
//            username: 'scott',
//            center: 'Manchester',
//            pw1: 'iii'
//        })
//        .set('Accept', 'application/json')
//        .set('Content-Type', 'application/json')
//        .expect(201, done);
//});

module.exports = {
    clearDB: clearDown
};