/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach, before, after*/


before(function (done) {
    this.timeout = 5000;

    var mongodb = require('mongodb');
    mongodb.connect('mongodb://c9:c9@oceanic.mongohq.com:10015/dev', {}, function (err, DB) {
        DB.dropCollection('users', function () {
            DB.dropCollection('centers', function () {
                console.log('done clearing down db');
                done();
            });
        });
    });
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
