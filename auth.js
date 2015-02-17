/*jslint node:true*/
'use strict';

var crypto = require('crypto');
var db = require('./db');

function generateUserToken(user) {
    var hash = crypto.createHmac('sha256', process.env.SYSADMIN_KEY);
    return hash.update(user).digest('base64');
}

function auth(req, res, next) {

    if (req.user.pass === generateUserToken(req.user.name)) {
        return next();
    }

    db.users.findOne({
        username: req.user.name,
        deleted: {
            $exists: false
        }
    }, {
        limit: 1,
        fields: {
            'dictationSyllabus': 0,
            'autoSyllabus': 0,
            'spellingSyllabus': 0,
            'readingSyllabus': 0,
            'memorySyllabus': 0
        }
    }, function (err, results) {
        if (err) {
            return next ? next(err) : null;
        }
        if (results.length === 0) {
            res.status(404);
            return res.end();
        }
        var studentRecord = results[0];
        if (studentRecord.pw1 === req.user.pass) {
            req.user = studentRecord;
            return next ? next() : null;
        } else {
            console.log('wrong pw1');
            res.status(401);
            return res.end();
        }
    });
}

module.exports = auth;