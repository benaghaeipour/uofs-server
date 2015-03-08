/*jslint node:true, nomen:true */
/*globals console, process*/
'use strict';

// *******************************************************
//          Application includes
var net = require('net'),
    http = require('http'),
    fs = require('fs'),
    decodeBasicAuth = require('basic-auth'),
    auth = require('./auth'),
    express = require('express'),
    mongodb = require('mongodb'),
    DB = require('./db'),
    adjNoun = require('adj-noun'),
    _ = require('lodash'),
    mustache = require('mustache'),
    async = require('async'),
    request = require('superagent'),
    emailer = require('./emailer'),
    proxy = require('http-proxy').createProxyServer();

// *******************************************************
//          Global Variables
var app = express();

var pkg = require('./package.json');

// set defaults to those needed for local dev
_.defaults(process.env, {
    NODE_ENV: 'development',
    SYSADMIN_KEY: 'test'
});

app.set('env', process.env.NODE_ENV);

process.env.PORT = process.env.PORT || 5000;
process.env.SYSADMIN_KEY = process.env.SYSADMIN_KEY || 'testing';

// *******************************************************
//          expose 'app' for testing
module.exports = app;

// *******************************************************
//          Server Configuration

console.info('Configuring Application for NODE_ENV: ' + app.get('env'));
console.info('Configuring for DB : ' + process.env.DB_URI);

app.set('view engine', 'html');

var morgan = require('morgan');
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

switch (process.env.NODE_ENV) {
case 'production':
    app.use(timeout());
    break;
default:
    break;
}
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

// *******************************************************
//          Admin Views

app.use('/admin', function (req, res, next) {
    console.log('auth started');
    return next();
}, auth, function (req, res, next) {
    console.log('auth passed');
    return next();
});
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
app.post('/login[/]?', bodyParser, function (req, res, next) {
    //sanitize
    var query = _.extend({
        username: "",
        pw1: "",
        deleted: {
            $exists: false
        }
    }, _.pick(req.body, 'username', 'pw1'));
    query.username.toLowerCase();
    query.pw1.toLowerCase();

    DB.users.findOne(query, {
        limit: 1
    }, function (err, studentRecord) {
        if (err) {
            return next(err);
        }

        if (studentRecord) {
            console.info('Login Sucess : ', studentRecord.username, studentRecord._id);
            res.send(studentRecord);
        } else {
            console.warn('Login Failed : ', JSON.stringify(query));
            res.status(401).end();
        }
    });
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
        }, function (err, objects) {
            if (err) { return next(err); }
            if (objects === 0) {
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
//          Student endpoints

app.use('/student', require('./users'));
app.use('/user', require('./users'));

// *******************************************************
//          Center endpoints

app.route('/center/:id/welcome')
    .get(function (req, res, next) {
        async.parallel({
            sorry: function (cb) {
                request.get('https://www.google.co.uk/404').end(function (html) {
                    console.log('got sorry');
                    cb(null, html);
                });
            },
            template: function (cb) {
                request.get('http://help.unitsofsound.net/?document=center-welcome')
                    .redirects(2)
                    .end(function (html) {
                        console.log('got template');
                        cb(null, html);
                    });
            },
            center: function (cb) {
                DB.centers.findOne({_id: new mongodb.ObjectID(req.params.id)}, cb);
            }
        }, function (err, results) {
            var didntFindCenter = !results.center;
            var centerHasNoPurchaser = results.center && !results.center.purchaser;
            if (err || didntFindCenter || centerHasNoPurchaser) {
                console.log('rendering sorry foundCenter: ', didntFindCenter, ' hasContact: ', centerHasNoPurchaser);
                res.status(200).end(results.sorry.text);
            } else {
                console.log('rendering template with ', results.center);
                res.status(200).end(mustache.render(results.template.text, results.center));
            }
        });
    });

app.route('/center[/]?(:id)?')
    .all(bodyParser, function (req, res, next) {
        if (req.params.id) {
            req.params.id = new mongodb.ObjectID(req.params.id);
        }
        next();
    })
    .get(function (req, res, next) {
        req.query.deleted = {$exists: false};
        if (req.params.id) {
            req.query._id = req.params.id;
            console.info('Center query : ', JSON.stringify(req.query));
            DB.centers.findOne(req.query, function (err, record) {
                if (err) {
                    return next(err);
                }
                console.log('Returning : ', JSON.stringify(record));
                res.status(200).send(record);
            });
        } else {
            console.info('Center query : ', JSON.stringify(req.query));
            DB.centers.find(req.query).toArray(function (err, objects) {
                if (err) {
                    return next(err);
                }
                console.log('Returning : ', JSON.stringify(objects));
                res.status(200).send(objects);
            });
        }
    })
    .put(function (req, res, next) {
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
            res.status(400).send();
            return;
        }

        console.info('Center create');
        console.log('Center create', query);

        DB.centers.insert(query, function (err, objects) {
            if (err) {
                return next(err);
            }
            console.info('Center Created : ', JSON.stringify(objects));
            // emailer.sendCenterCreate(objects[0], function (err) {
            //     if(err) {
            //         console.error('Failed to send notification of center creation', objects);
            //     }
            // });
            res.status(201);
            res.send(objects[0]);
        });
    })
    .post(function (req, res, next) {
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
            console.info('Center update : ', JSON.stringify(objects));
            res.status(202).end();
        });
    })
    .delete(function (req, res, next) {
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
            console.info('Center deleted : ', req.params.id);
            res.status(204).end();
        });
    });


// *******************************************************
//          Debug enpoints

/**
 * dump will just dump req data to console.
 */
app.all('/dev/dump[/]?', function (req, res, next) {
    console.log('Params : ', req.params);
    console.log('Query : ', req.query);
    console.log('Method : ', req.method);
    console.log('_method : ', req._method);
    console.log('headers : ', JSON.stringify(req.headers));
    console.log('Data : \n');

    res.status(200).end();
});

//app.all('/dev/crash[/]?', function(req, res, next) {
//    console.error('This is a triggerd crash');
//    console.crit('This is a triggerd crash');
//    res.send('crashing app in 500ms');
//    setTimeout(function() {
//       throw new Error('this crash was triggered');
//    }, 500);
//});


// *******************************************************
//          Compose.io proxy

app.use('/mongo/:uri', function (req, res) {
    req.headers.Authorization = 'Bearer ' + process.env.COMPOSE_API_TOKEN;
    req.headers['Accept-Version'] = '2014-06';
    proxy.web(req, res, {
        target: 'https://api.compose.io/deployments/chris-matheson-it/online/mongodb/online/collections/' + req.param.uri
    });
});

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
