'use strict';
var mongodb = require('mongodb');
var online = 'mongodb://readonly:readonly@candidate.12.mongolayer.com:11071/online';
var dev = process.env.DB_URI;

mongodb.connect(online, function (err, dbconnection) {
    if (err) {
        console.error('error opening database');
        throw (err);
    }

    dbconnection.collection('users', function (err, users) {
        if (err) {
            console.error('cannot open users collection');
            throw (err);
        }
        users.aggregate([
          { $match: {deleted : { $exists : false } } },
          { $group: {_id : "$username", center: {$push:"$center"}, total : { $sum : 1 } } },
          { $match: {total : { $gte : 2 } } },
          { $sort:  {total:1 }}
        ], function cb(err, results) {
            console.log(err, results);

            console.log('\n\nTotal Usernames with problems:', results.length);
            console.log('Affected user count:', results.reduce(function (prev, cur) {
              return prev + cur.total;
            }, 0));
            dbconnection.close();
        });
    });
});
