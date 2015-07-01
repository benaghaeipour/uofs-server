'use strict';

var route = require('express').Router();
var bodyParser = require('body-parser')({
    limit: 300000
});
var mongodb = require('mongodb');
var _ = require('lodash');
var adjNoun = require('adj-noun');
var DB = require('./db');
var defaultStudentRecord = require('./default-user.json');
var util = require('util');

function rejectExistingUsernames(req, res, next) {
    var query = {
        $or: []
    };

    if (req.body.username) {
        query.$or.push({
            username: req.body.username.toLowerCase(),
            pw1: req.body.pw1.toLowerCase()
        });
    }
    if (req.body.email) {
        query.$or.push({
            email: req.body.email.toLowerCase(),
            pw1: req.body.pw1.toLowerCase()
        });
    }

    console.info({
        student: 'checking for existing'
    });
    console.log({
        query: JSON.stringify(query)
    });

    DB.users.findOne(query, function (err, existing) {
        if (err) {
            return next(err);
        }
        if (existing) {
            console.info({
                student: 'allready exists'
            });
            res.status(409).end();
        } else {
            next();
        }
    });
}

function rejectMissingRequiredFields(req, res, next) {
    if (!req.body.username && !req.body.email) {
        console.log({
            student: 'create',
            rejected: 'missing username/email'
        });
        return res.status(400).end();
    }
    if (!req.body.pw1) {
        console.log({
            student: 'create',
            rejected: 'missing pw1'
        });
        return res.status(400).end();
    }
    if (!req.body.center) {
        console.log({
            student: 'create',
            rejected: 'missing center'
        });
        return res.status(400).end();
    }
    next();
}

route.post('/', bodyParser, rejectMissingRequiredFields, rejectExistingUsernames, function (req, res, next) {
    console.info({
        student: 'creds ok to create'
    });
    res.status(200).end();
});

route.post('/find', bodyParser, function (req, res, next) {
    var query = req.body;
    var options = {};
    if (query._id) {
        query._id = new mongodb.ObjectID(query._id);
    } else {
        //dont fetch syllabus's when doing big query
        options.fields = {
            'dictationSyllabus': 0,
            'autoSyllabus': 0,
            'spellingSyllabus': 0,
            'readingSyllabus': 0,
            'memorySyllabus': 0
        };
    }
    if (query.username) {
        query.username.toLowerCase();
    }
    if (query.pw1) {
        query.pw1.toLowerCase();
    }
    query.deleted = {
        $exists: false
    };

    DB.users.find(query, options).toArray(function (err, records) {
        if (err) {
            return next(err);
        }
        res.send(records);
    });
});

route.post('/delete[/]?', bodyParser, function (req, res, next) {
    var query = req.body;
    console.info({
        student: 'delete',
        id: query._id
    });
    query._id = new mongodb.ObjectID(query._id);

    DB.users.update(_.pick(query, '_id'), {
        $set: {
            deleted: new Date()
        }
    }, function (err, objects) {
        if (err) {
            return next(err);
        }

        res.status(202).end();
    });
});

function createStudent(req, res, next) {
    var query = req.body;

    if (query.username) {
        query.username = query.username.toLowerCase();
    }
    if (query.pw1) {
        query.pw1 = query.pw1.toLowerCase();
    }
    if (query.email) {
        query.email = query.email.toLowerCase();
    }

    console.log({
        student: 'create',
        reason: 'no-id'
    });
    _.defaults(query, {
        pw1: adjNoun().join('-')
    });

    var hasUsername = !! query.username;
    var hasPassword = !! query.pw1;
    var hasCenter = !! query.center;

    var hasRequiredFields = hasCenter && hasPassword && hasUsername;
    if (!hasRequiredFields) {
        console.info('student create missing', {
            hasUsername: hasUsername,
            hasPassword: hasPassword,
            hasCenter: hasCenter
        });
        return res.status(400).send();
    }

    //create new record
    console.info('student create :', _.pick(query, 'username', 'pw1', 'center'));
    DB.centers.findOne({
        name: query.center
    }, function (err, center) {
        if (center && center.defaultVoice && query.voiceDialect === undefined) {
            console.log('setting voiceDialect to centers:', center.defaultVoice);
            query.voiceDialect = center.defaultVoice;
        }

        _.defaults(query, defaultStudentRecord);
        DB.users.insert(query, function (err, insert) {
            if (err) {
                return next(err);
            }
            console.info('Student Created');
            res.status(201).json(insert.ops);
        });
    });
}

route.post('/update[/]?', bodyParser, function (req, res, next) {
    var query = req.body;

    if (query.username) {
        query.username = query.username.toLowerCase();
    }
    if (query.pw1) {
        query.pw1 = query.pw1.toLowerCase();
    }

    if (req.body._id) {
        console.log('student update _id:', query._id);
        //update record by matchin _id
        query._id = new mongodb.ObjectID(query._id);

        if (query.spellingSyllabus.length < 100) {
            console.warn('avoiding messing up spellingSyllabus for' + query._id);
            delete query.spellingSyllabus;
        }
        if (query.memorySyllabus.length < 100) {
            console.warn('avoiding messing up memorySyllabus for' + query._id);
            delete query.memorySyllabus;
        }
        if (query.dictationSyllabus.length < 100) {
            console.warn('avoiding messing up dictationSyllabus for' + query._id);
            delete query.dictationSyllabus;
        }
        if (query.readingSyllabus.length < 100) {
            console.warn('avoiding messing up readingSyllabus for' + query._id);
            delete query.readingSyllabus;
        }

        DB.users.update(_.pick(query, '_id'), {
            $set: _.omit(query, '_id')
        }, function (err, update) {
            if (err || update.result.n !== 1) {
                console.error('Update error : ', JSON.stringify(err));
                return next(err);
            }
            res.status(201).json(query);
        });
    } else {
        next();
    }
}, rejectMissingRequiredFields, rejectExistingUsernames, createStudent);


route.get('/:username', bodyParser, function (req, res, next) {
    var opts = {}
    if (req.query.short) {
        opts.fields = {
            'dictationSyllabus': 0,
            'autoSyllabus': 0,
            'spellingSyllabus': 0,
            'readingSyllabus': 0,
            'memorySyllabus': 0
        };
    }
    DB.users.findOne({
        username: req.params.username
    }, opts, function (err, existing) {
        if (err) {
            return next(err);
        }
        if (existing) {
            res.status(200).json(existing);
        } else {
            res.status(404).end();
        }
    });
});

module.exports = route;