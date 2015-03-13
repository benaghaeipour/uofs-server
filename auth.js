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
    }, function (err, result) {
        if (err) {
            return next ? next(err) : null;
        }
        if (!result || result.length === 0) {
            return rejectAndPromptForPassword(req, res);
        }
        console.log(result);
        if (result.pw1 === req.user.pass) {
            req.user = result;
            return next ? next() : null;
        } else {
            return rejectAndPromptForPassword(req, res);
        }
    });
}

module.exports = auth;