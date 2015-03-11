/*jslint node:true*/
'use strict';

var crypto = require('crypto');
var db = require('./db');
var decodeBasicAuth = require('basic-auth');

function generateUserToken(user) {
    var hash = crypto.createHmac('sha256', process.env.SYSADMIN_KEY);
    return hash.update(user).digest('base64');
}

function rejectAndPromptForPassword(req, res) {
    res.set({'WWW-Authenticate': 'Basic'});
    res.status(401);
    return res.end();
}

function auth(req, res, next) {
    req.user = decodeBasicAuth(req);
    if (!req.user) {
        return rejectAndPromptForPassword(req, res);
    }

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
        if (!results || results.length === 0) {
            return rejectAndPromptForPassword(req, res);
        }
        var studentRecord = results[0];
        if (studentRecord.pw1 === req.user.pass) {
            req.user = studentRecord;
            return next ? next() : null;
        } else {
            return rejectAndPromptForPassword(req, res);
        }
    });
}

module.exports = auth;