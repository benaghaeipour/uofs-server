/*jslint node:true nomen:true */
/*globals console, process*/
// *******************************************************
// expressjs template
//
// assumes: npm install express
//
// assumes these subfolders:
//   www/
//   tmp/
//


// *******************************************************
//          Application includes
var net = require('net'),
    http = require('http'),
    fs = require('fs'),
    auth = require('basic-auth'),
    express = require('express'),
    mongodb = require('mongodb'),
    adjNoun = require('adj-noun'),
    _ = require('lodash'),
    mustache = require('mustache'),
    async = require('async'),
    request = require('superagent'),
    emailer = require('./emailer'),
    proxy = require('http-proxy').createProxyServer();

// *******************************************************
//          Global Variables
var DB = null,
    app = express();

var pkg = require('./package.json');

// set defaults to those needed for local dev
_.defaults(process.env, {
    NODE_ENV: 'local'
}, pkg.env);

app.set('env', process.env.NODE_ENV);

process.env.PORT = process.env.PORT || 5000;

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

app.use(function (req, res, next) {
    req.user = auth(req) || {name: 'unknown', pass: 'unknown'};
    return next();
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

app.get('/u[k,s]/*', function (req, res, next) {
    res.redirect(302, 'http://static.unitsofsound.net' + req.path);
});

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
    res.send('' +
        '<?xml version="1.0"?>' +
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
    var authed = req.user.name === process.env.ADMIN_USER && req.user.pass === process.env.ADMIN_PASS;
    if (!authed) {
        res.set({'WWW-Authenticate': 'Basic'});
        res.status(401).end();//something
    } else {
        next();
    }
});
app.use('/admin', require('serve-static')('admin'));

app.get('/admin/edit/[a-f0-9]{24}', function (req, res, next) {
    res.sendFile(process.cwd() + '/admin/edit/index.html');
});

app.get('/admin/setup/[a-f0-9]{24}', function (req, res, next) {
    res.sendFile(process.cwd() + '/admin/setup/index.html');
});

// *******************************************************
//          Tools Area

app.use('/tools', function (req, res, next) {
    var user = auth(req) || {},
        authed = false;

    _.defaults(user, {user: '', pass: ''});
    authed = user.pass === 'dyslexiaactionuser';

    if (!authed) {
        res.set({'WWW-Authenticate': 'Basic'});
        res.status(401).end();
    } else {
        next();
    }
});
app.use('/tools', require('serve-static')('tools'));

app.use('/setup', require('serve-static')('setup'));

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
        DB.users.update({$or:[{username: req.query.email}, {email: req.query.email}]}, {
            $set: {pw1: tempPassword}
        }, {
            upsert: false
        }, function (err, objects) {
            if (err) { return next(err);}
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

app.route('/student')
    .post(bodyParser, function (req, res, next) {
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
                console.info('Student creds ok to create');
                res.status(200).end();
            }
        });
    });

/**
 * Does a find on the DB from the posted object
 */
app.post('/student/find[/]?', bodyParser, function (req, res, next) {
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

    console.info('Student lookup : ', JSON.stringify(query));

    DB.users.find(query, options).toArray(function (err, records) {
        if (err) {
            return next(err);
        }
        console.log('Returning : ', JSON.stringify(records));
        res.send(records);
    });
});

/**
 * Deletes the object found by the post data. (only if 1 is found)
 */
app.post('/student/delete[/]?', bodyParser, function (req, res, next) {
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

var defaultStudentRecord = require('./default-user.json');

/**
 * Create SR if _id == null
 * Update SR if _id == something
 */
app.post('/student/update[/]?', bodyParser, function (req, res, next) {
    var query = req.body;

    if (query.username) {
        query.username = query.username.toLowerCase();
    }
    if (query.pw1) {
        query.pw1 = query.pw1.toLowerCase();
    }

    if (!query._id) {
        console.log('student create bcause no _id');
        _.defaults(query, {pw1: adjNoun().join('-')}, defaultStudentRecord);

        var hasUsername = !!query.username;
        var hasPassword = !!query.pw1;
        var hasCenter = !!query.center;

        var hasRequiredFields = hasCenter && hasPassword && hasUsername;
        if (!hasRequiredFields) {
            console.info('student create missing', {hasUsername:hasUsername, hasPassword:hasPassword, hasCenter:hasCenter});
            return res.status(400).send();
        }

        //create new record
        console.info('student create :', _.pick(query, 'username', 'pw1', 'center'));
        DB.users.insert(query, function (err, objects) {
            if (err) {
                return next(err);
            }
            console.info('Student Created');
//            emailer.sendPasswordReset(objects[0]);
            res.status(201).json(objects);
        });
    } else {
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
    }
});


// *******************************************************
//          Center endpoints

app.route('/center/:id/welcome')
    .get(function(req, res, next) {
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
                console.log('Returning : '+ JSON.stringify(record));
                res.status(200).send(record);
            });
        } else {
            console.info('Center query : ', JSON.stringify(req.query));
            DB.centers.find(req.query).toArray(function (err, objects) {
                if (err) {
                    return next(err);
                }
                console.log('Returning : '+ JSON.stringify(objects));
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
            upsert:true,
            w:1
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
            upsert:true,
            w:1
        }, function (err) {
            if (err) {
                return next(err);
            }
            console.info('Center deleted : ', req.params.id);
            res.status(204).end();
        });
    });



// *******************************************************
//          Recordings enpoints

/**
 * Returns a file from GrdFS
 */
app.get('/recordings/:filename', function (req, res, next) {
    console.log('request for ' + req.params.filename);
    var storedRec = new mongodb.GridStore(DB, req.params.filename, 'r');
    storedRec.open(function (err, gs) {
        if (err) {
            return res.status(404).end();
        }

        //file opened, can now do things with it
        // Create a stream to the file
        console.log('request for existing recording');
        var stream = gs.stream(true);
        stream.pipe(res);
    });
});

/**
 * REST interface /<student id>/<lesson>/<page>/<block>/<word>/
 *
 * if the request gets to this function it has passed all verification and can
 * be acted upon
 *
 * saves post data sent to /recordings/123456/4/3/2/1/ to a file named /recordings/123456/4/3/2/1/
 * in the GridFS mongodb
 *
 * https://github.com/mongodb/node-mongodb-native/blob/master/docs/gridfs.md
 */
app.post('/recordings/:filename', function (req, res, next) {
    console.log('sending recording to mongo filename=' + req.params.filename);
    var newRecording = new mongodb.GridStore(DB, req.params.filename, 'w', {
        "content_type": "binary/octet-stream",
        "chunk_size": 1024 * 4
    });

    newRecording.open(function (err, gridStore) {
        if (err) {
            console.error('could not open Gridstore item filename=' + req.params.filename);
            return next(err);
        }
        req.pipe(gridStore);
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
    DB = dbconnection; //make the db globally avaliable

    DB.collection('users', function (err, collection) {
        if (err) {
            console.error('cannot open users collection');
            throw (err);
        }
        DB.users = collection;
    });

    DB.collection('centers', function (err, collection) {
        if (err) {
            console.error('cannot open centers collection');
            throw (err);
        }
        DB.centers = collection;
    });

    app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80).once('listening', function() {
        console.info('listening on ' + process.env.PORT);
    });
});

process.on('uncaughtexception', function () {
    console.fatal('UNCAUGHT EXCEPTION -  should not');
    process.exit(1);
});

process.on('SIGHUP', function () {
    DB.close();
    app.close();
    console.log('bye');
});
