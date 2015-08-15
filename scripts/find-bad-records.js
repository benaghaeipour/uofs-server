'use strict';
var mongodb = require('mongodb');
mongodb.connect(process.env.DB_URI, function (err, dbconnection) {
    if (err) {
        console.error('error opening database');
        throw (err);
    }

    dbconnection.collection('users', function (err, users) {
        if (err) {
            console.error('cannot open users collection');
            throw (err);
        }
        users.mapReduce(function map() {
            if (this.username === 'firstuser') {
                emit('firsts', this.username);
            }
            emit('all', this.username);
        }, function reduce(k,vals) {
            return k + ':' + vals.join(',');
        }, {
            out: {inline: 1}
        }, function cb(err, results) {
            console.log(err, results);
            dbconnection.close();
        });
    });
});