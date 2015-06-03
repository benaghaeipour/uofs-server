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
    if (!req.is('json')) {
        res.set({'WWW-Authenticate': 'Basic'});
    }
    res.status(401);
    return res.end();
}

function auth(req, res, next) {
    req.user = decodeBasicAuth(req);
    if (!req.user) {
        console.info({login: 'fail', reason: 'Could not decode auth:user'});
        return rejectAndPromptForPassword(req, res);
    }

    if (req.user.pass === generateUserToken(req.user.name)) {
        console.info({login: 'success', type: 'token'});
        return next();
    }

    db.users.findOne({
        username: req.user.name,
        pw1: req.user.pass,
        deleted: {
            $exists: false
        }
    }, {
        fields: {
            dictationSyllabus: 0,
            autoSyllabus: 0,
            spellingSyllabus: 0,
            readingSyllabus: 0,
            memorySyllabus: 0
        }
    }, function (err, result) {
        if (err) {
            return next ? next(err) : null;
        }
        if (!result) {
            return rejectAndPromptForPassword(req, res);
        }
        req.user = result;
        return next ? next() : null;
    });
}

module.exports = auth;