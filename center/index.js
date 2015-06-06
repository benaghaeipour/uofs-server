'use strict';

var route = require('express').Router();
var bodyParser = require('body-parser')({limit: 300000});
var mongodb = require('mongodb');
var _ = require('lodash');
var DB = require('../db');
var async = require('async');
var auth = require('../auth');

route.use(bodyParser);

route.get('/(:id)?', function (req, res, next) {
    req.query.deleted = {$exists: false};
    if (req.params.id) {
        req.query._id = new mongodb.ObjectID(req.params.id);
        console.info(JSON.stringify({query: req.query, route: 'center', action: 'get'}));
        DB.centers.findOne(req.query, function (err, record) {
            if (err) {
                return next(err);
            }
            console.info(JSON.stringify({query: req.query, route: 'center', action: 'get'}));
            res.status(200).send(record);
        });
    } else {
        console.info(JSON.stringify({query: req.query, route: 'center', action: 'search'}));
        DB.centers.find(req.query).toArray(function (err, records) {
            if (err) {
                return next(err);
            }
            console.info(JSON.stringify({query: req.query, route: 'center', action: 'search'}));
            res.status(200).send(records);
        });
    }
});

route.put('/', function (req, res, next) {
    var query = {};
    _.defaults(query, req.body, {
        maxLicencedStudentsForThisCenter: 0,
        expiryDate: null,
        defaultVoice: 0,
        sourceNumber: 1
    });

    //bail if no email for user
    var hasValidMainContact = /.+@.+\..+/.test(query.purchaser);
    if (!hasValidMainContact) {
        console.info(JSON.stringify({query: query, route: 'center', action: 'create', result: 'rejected, invalid main contact'}));
        res.status(400).send();
        return;
    }

    console.info(JSON.stringify({query: query, route: 'center', action: 'create'}));

    DB.centers.insertOne(query, function (err, result) {
        if (err) {
            return next(err);
        }
        console.info(JSON.stringify({query: query, route: 'center', action: 'create', result: result.insertedId}));
//        emailer.sendCenterCreate(objects[0], function (err) {
//             if(err) {
//                 console.error('Failed to send notification of center creation', objects);
//             }
//        });
        res.status(201);
        res.send(result.ops[0]);
    });
});

route.post('/:id', function (req, res, next) {
    var query = req.body;
    if (!req.params.id) {
        return res.status(400).end();
    }

    DB.centers.update({_id: mongodb.ObjectID(req.params.id)}, _.omit(query, '_id'), {
        upsert: true,
        w: 1
    }, function (err, objects) {
        if (err) {
            return next(err);
        }
        console.info(JSON.stringify({query: objects, route: 'center', action: 'update'}));
        res.status(202).end();
    });
});

route.delete('/:id', function (req, res, next) {
    var query = req.body;
    if (!req.params.id) {
        return res.status(400).end();
    }

    DB.centers.remove({_id: mongodb.ObjectID(req.params.id)}, {
        upsert: true,
        w: 1
    }, function (err) {
        if (err) {
            return next(err);
        }
        console.info(JSON.stringify({query: req.params.id, route: 'center', action: 'delete'}));
        res.status(204).end();
    });
});

module.exports = route;