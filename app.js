/*jslint node:true, nomen:true */
/*globals console, process*/
'use strict';

// *******************************************************
//          Application includes
var express = require('express'),
    auth = require('./auth'),
    DB = require('./db'),
    mongodb = require('mongodb'),
    adjNoun = require('adj-noun'),
    _ = require('lodash'),
    emailer = require('./emailer');

// *******************************************************
//          Global Variables
var app = express();

var pkg = require('./package.json');

// set defaults to those needed for local dev
_.defaults(process.env, {
    NODE_ENV: 'development',
    SYSADMIN_KEY: 'test',
    PORT: 5000
});

// *******************************************************
//          expose 'app' for testing
module.exports = app;

// *******************************************************
//          Server Configuration

console.info('Configuring Application for NODE_ENV: ' + app.get('env'));
console.info('Configuring for DB : ' + process.env.DB_URI);

var bodyParser = require('body-parser')({limit: 300000});
var compress = require('compression');
var errorhandler = require('errorhandler');
var timeout = require('connect-timeout');
var methodOverride = require('method-override');

app.use(compress());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function (req, res, next) {
    res.set('NODE_ENV', process.env.NODE_ENV);
    res.set('Cache-Control', 'no-cache');
    next();
});

adjNoun.seed(401175);

app.use(timeout());
app.use(errorhandler({
    dumpExceptions: true,
    showStack: true
}));

// *******************************************************
//          Some standrad routes etc

app.get('/favicon.ico', function (req, res, next) {
    //no favicon avaliable, but dont want 404 errors
    res.status(200);
    res.send();
});

app.get('/healthcheck', function (req, res) {
    res.send(200);
});

app.get('/crossdomain.xml', function (req, res, next) {
    //no favicon avaliable, but dont want 404 errors
    res.set('Cache-Control', 'public');
    res.status(200);
    res.send('<?xml version="1.0"?>' +
        '<!DOCTYPE cross-domain-policy SYSTEM' +
        '"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">' +
        '<cross-domain-policy>' +
        '<site-control permitted-cross-domain-policies="all"/>' +
        '<allow-access-from domain="*" secure="false"/>' +
        '<allow-http-request-headers-from domain="*" headers="*" secure="false"/>' +
        '</cross-domain-policy>');
});

app.route('/login/reset')
    .get(function (req, res, next) {

        if (!req.query.email) {
            return next(new Error('Password reset requires an email parameter'));
        }

        var tempPassword = adjNoun().join('-');

        console.log('reseting password for', {username: req.query.email});
        DB.users.update({$or: [{username: req.query.email}, {email: req.query.email}]}, {
            $set: {pw1: tempPassword}
        }, {
            upsert: false
        }, function (err, update) {
            if (err) { return next(err); }
            if (update.result.n === 0) {
                return res.status(404).end();
            }

            emailer.sendPasswordReset({
                username: req.query.email,
                pw1: tempPassword
            }, function (err) {
                if (err) {
                    console.error('Failed email sending for', req.query.email);
                    return next(err);
                }
                res.status(200).end();
            });
        });
    });

// *******************************************************
//          Admin Views

app.use(auth);

app.use('/stats', require('./stats'));

app.use('/admin', require('serve-static')('admin'));
app.get('/admin/edit/[a-f0-9]{24}', function (req, res, next) {
    res.sendFile(process.cwd() + '/admin/edit/index.html');
});

// *******************************************************
//          Login endpoint

/**
 * Does a search with request object whcih should only return one or none docs
 *
 * check that req includes user, center & pass
 */
function sendFullUserObject(req, res, next) {
    console.warn('[depreciated] POST /login');
    DB.users.findOne({
        username: req.user.username,
        pw1: req.user.pw1,
        deleted: {
            $exists: false
        }
    }, function (err, fullUserObject) {
        if (err) {
            return next ? next(err) : null;
        }
        if (res.headersSent) {
            console.error({req: 'headers allready sent'});
            return res.end();
        }
        res.status(200).jsonp(fullUserObject);
    });
}

app.get('/login', bodyParser, sendFullUserObject);
app.post('/login', bodyParser, sendFullUserObject);

// *******************************************************
//          Student endpoints

app.use('/users/:username/report', require('./report'));
app.use('/users/default', function (req, res) {
  res.status(200).jsonp(require('./default-user.json'));
});
app.use('/users/example', function (req, res) {
  res.status(200).jsonp(require('./example-user.json'));
});
app.use('/users', require('./users'));
app.use('/student', require('./users'));
app.use('/center', require('./center'));
app.use('/centers', require('./center'));

// *******************************************************
//          Start of application doing things

// https://github.com/mongodb/node-mongodb-native#documentation

var options = {};
options.autoreconnect = true;
options.safe = true;

mongodb.connect(process.env.DB_URI, options, function (err, dbconnection) {
    if (err) {
        console.error('error opening database');
        throw (err);
    }
    DB.connection = dbconnection; //make the db globally avaliable

    dbconnection.on('close', function () {
        console.warn('DB-closed');
    });
    dbconnection.on('error', function () {
        console.error('DB-error');
    });
    dbconnection.on('reconnect', function () {
        console.info('DB-reconnect');
    });
    dbconnection.on('timeout', function () {
        console.warn('DB-timeout');
    });

    dbconnection.collection('users', function (err, collection) {
        if (err) {
            console.error('cannot open users collection');
            throw (err);
        }
        DB.users = collection;
    });

    dbconnection.collection('centers', function (err, collection) {
        if (err) {
            console.error('cannot open centers collection');
            throw (err);
        }
        DB.centers = collection;
    });

    app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80).once('listening', function () {
        app.listening = true;
        app.emit('listening');
        console.info('listening on ' + process.env.PORT);
    });
});

process.on('uncaughtexception', function () {
    console.fatal('UNCAUGHT EXCEPTION - should not');
    process.exit(1);
});

process.on('SIGINT', function () {
    DB.connection.close();
    console.log('bye');
    process.exit(0);
});
