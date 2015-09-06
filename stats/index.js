'use strict';
var route = require('express').Router();
var db = require('../db');

var duplicateUserNames = function () {
  return new Promise(function (resolve, reject) {
    db.users.aggregate([
      { $match: {deleted : { $exists : false } } },
      { $group: {_id : "$username", center: {$push:"$center"}, total : { $sum : 1 } } },
      { $match: {total : { $gte : 2 } } },
      { $sort:  {total:1 }}
    ], function cb(err, results) {
        if (err) { return reject(err); }
        resolve(results);
    });
  });
};

var studentCount = function () {
  return new Promise(function (resolve, reject) {
    db.users.count({
      accountType: 1,
      deleted: {$exists: false},
    }, function cb(err, results) {
        if (err) { return reject(err); }
        resolve(results);
    });
  });
};

var teacherCount = function () {
  return new Promise(function (resolve, reject) {
    db.users.count({
      accountType: 0,
      deleted: {$exists: false},
    }, function cb(err, results) {
        if (err) { return reject(err); }
        resolve(results);
    });
  });
};

var centerCount = function () {
  return new Promise(function (resolve, reject) {
    db.centers.count({
    }, function cb(err, results) {
        if (err) { return reject(err); }
        resolve(results);
    });
  });
};

route.get('/data', function (req, res, next) {
  Promise.all([duplicateUserNames(), studentCount(), teacherCount(), centerCount()])
    .then(function (results) {
      res.status(200).jsonp({
        duplicateUserNames: results[0],
        studentCount: results[1],
        teacherCount: results[2],
        centerCount: results[3]
      });
    })
    .catch(next);
});

route.get('/*', require('serve-static')(__dirname));

module.exports = route;
