'use strict';

var route = require('express').Router();
var bodyParser = require('body-parser')({limit: 300000});
var mongodb = require('mongodb');
var _ = require('lodash');
var adjNoun = require('adj-noun');
var DB = require('./db');
var defaultStudentRecord = require('./default-user.json');
var util = require('util');

function formatUser(user) {
    var cleaner = _.clone(user);
    cleaner.readingSyllabus = cleaner.readingSyllabus ? cleaner.readingSyllabus.length : undefined;
    cleaner.spellingSyllabus = cleaner.spellingSyllabus ? cleaner.spellingSyllabus.length : undefined;
    cleaner.memorySyllabus = cleaner.memorySyllabus ? cleaner.memorySyllabus.length : undefined;
    cleaner.dictationSyllabus = cleaner.dictationSyllabus ? cleaner.dictationSyllabus.length : undefined;
    return cleaner;
}

function rejectExistingUsernames(req, res, next) {
    var query = req.body;
    var options = {};
    if (query.username) {
        query.username.toLowerCase();
    }
    if (query.pw1) {
        query.pw1.toLowerCase();
    }
    console.log('Create student : ', JSON.stringify(query));
    console.info('Create student req ');

    DB.users.find(query, options).toArray(function (err, records) {
        if (err) {
            return next(err);
        }
        if (records.length) {
            console.info('Student allready exists');
            console.log('Student allready exists : ', JSON.stringify(_.pluck(records, 'username', 'pw1')));
            res.status(409).end();
        } else {
            next();
        }
    });
}

route.post('/', bodyParser, rejectExistingUsernames, function (req, res, next) {
    console.info('Student creds ok to create');
    res.status(200).end();
});

route.post('/find[/]?', bodyParser, function (req, res, next) {
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

    console.info('Student lookup : ', formatUser(query));

    DB.users.find(query, options).toArray(function (err, records) {
        if (err) {
            return next(err);
        }
        console.log('Returning : ', records.map(formatUser));
        res.send(records);
    });
});

route.post('/delete[/]?', bodyParser, function (req, res, next) {
    var query = req.body;
    console.info('Student Deleted : ', query._id);
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

    console.log('student create bcause no _id');
    _.defaults(query, {pw1: adjNoun().join('-')});

    var hasUsername = !!query.username;
    var hasPassword = !!query.pw1;
    var hasCenter = !!query.center;

    var hasRequiredFields = hasCenter && hasPassword && hasUsername;
    if (!hasRequiredFields) {
        console.info('student create missing', {hasUsername: hasUsername, hasPassword: hasPassword, hasCenter: hasCenter});
        return res.status(400).send();
    }

    //create new record
    console.info('student create :', _.pick(query, 'username', 'pw1', 'center'));
    DB.centers.findOne({name: query.center}, function (err, center) {
        if (center && center.defaultVoice && query.voiceDialect === undefined) {
            console.log('setting voiceDialect to centers:', center.defaultVoice);
            query.voiceDialect = center.defaultVoice;
        }

        _.defaults(query, defaultStudentRecord);
        DB.users.insert(query, function (err, objects) {
            if (err) {
                return next(err);
            }
            console.info('Student Created');
//            emailer.sendPasswordReset(objects[0]);
            res.status(201).json(objects);
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

        console.info('Student Updated : ', query._id);
        // console.log('Update query : ', JSON.stringify(query));

        DB.users.update(_.pick(query, '_id'), {
            $set: _.omit(query, '_id')
        }, function (err, objects) {
            if (err) {
                console.error('Update error : ', JSON.stringify(err));
                return next(err);
            }
            res.status(201).json(objects);
        });
    } else {
        next();
    }
}, rejectExistingUsernames, createStudent);

module.exports = route;