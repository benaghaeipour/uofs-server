/*jshint node:true*/
/*globals mocha, expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var shouldClearDB = true;

beforeEach(function (done) {
    this.timeout = 5000;

    if (shouldClearDB) {
        var mongodb = require('mongodb');
        mongodb.connect('mongodb://c9:c9@oceanic.mongohq.com:10015/dev', {}, function (err, DB) {
            DB.dropCollection('users', function () {
                DB.dropCollection('centers', function () {
                    console.log('done clearing down db');
                    shouldClearDB = false;
                    done();
                });
            });
        });
    } else {
        done();
    }
});