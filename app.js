/*jslint node:true*/
/*jshint multistr:true */
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
    https = require('https'),
    fs = require('fs'),
    auth = require('basic-auth'),
    express = require('express'),
    mongodb = require('mongodb'),
    _ = require('lodash'),
    logentries = require('node-logentries');

// *******************************************************
//          Global Variables
var DB = null,
    app = express();

var pkg = require('./package.json');

// set defaults to those needed for local dev
app.set('env', (process.env.NODE_ENV || 'local'));
process.env.LOG_TOKEN = process.env.LOG_TOKEN || 'local';
process.env.DB_URI = process.env.DB_URI || pkg.env.DB_URI;
process.env.PORT = process.env.PORT || 5000;

var log = logentries.logger({
    token: process.env.LOG_TOKEN,
    timestamp: false,
    levels: {
        debug:0,
        info:1,
        warn:2,
        error:3,
        fatal:4
    }
});

// *******************************************************
//          expose 'app' for testing
module.exports = app;

// *******************************************************
//          Server Configuration

log.info('Configuring Application for NODE_ENV: ' + app.get('env'));
log.info('Configuring for DB : ' + process.env.DB_URI);
log.info('Configuring for LE : ' + process.env.LOG_TOKEN);

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

var morgan = require('morgan');
var bodyParser = require('body-parser')({limit:300000});
var compress = require('compression');
var errorhandler = require('errorhandler');
var timeout = require('connect-timeout');

app.use(morgan({
    format: process.env.LOG_TOKEN + ' :req[x-forwarded-for] [req] :method :url [res] :status :res[content-length] b res_time=:response-time ms',
    stream: new net.Socket().connect(80, 'api.logentries.com'),
    skip: function (req) {
        return !req.path.match(/^healthcheck/);
    }
}));

app.use(compress());
app.use(function(req, res, next){
    res.set('NODE_ENV', process.env.NODE_ENV);
    res.set('Cache-Control', 'no-cache');
    next();
});

switch(process.env.NODE_ENV) {
    case 'production':
        log.level('debug');
        app.use(timeout());
        break;
    default:
        log.on('log', function (logline) {
            console.log(logline);
        });
        app.use(errorhandler({
            dumpExceptions: true,
            showStack: false
        }));
        log.level('debug');
        log.debug('Setting up debug level logging');
        break;
}

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
    var user = auth(req) || {},
        authed = false;

    _.defaults(user, {user: '', pass: ''});
    authed = user.name === process.env.ADMIN_USER && user.pass === process.env.ADMIN_PASS;

    if (!authed) {
        res.set({'WWW-Authenticate': 'Basic'});
        res.send(401);//something
    } else {
        next();
    }
});
app.use('/admin', require('serve-static')('admin'));

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
            log.info('Login Sucess : ', studentRecord.username, studentRecord._id);
            res.send(studentRecord);
        } else {
            log.warn('Login Failed : ', JSON.stringify(query));
            res.send(401);
        }
    });
});

// *******************************************************
//          Student endpoints

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

    log.info('Student lookup : ', JSON.stringify(query));

    DB.users.find(query, options).toArray(function (err, records) {
        if (err) {
            return next(err);
        }
        log.debug('Returning : ', JSON.stringify(records));
        res.send(records);
    });
});

/**
 * Deletes the object found by the post data. (only if 1 is found)
 */
app.post('/student/delete[/]?', bodyParser, function (req, res, next) {
    var query = req.body;
    log.info('Student Deleted : ', query._id);
    query._id = new mongodb.ObjectID(query._id);

    DB.users.update(_.pick(query, '_id'), {
        $set: {
            deleted: new Date()
        }
    }, {
        safe: true
    }, function (err, objects) {
        if (err) {
            return next(err);
        }

        res.send(202);
    });
});

/**
 * Create SR if _id == null
 * Update SR if _id == something
 */
app.post('/student/update[/]?', bodyParser, function (req, res, next) {
    var query = req.body;

    if (query.username) {
        query.username.toLowerCase();
    }
    if (query.pw1) {
        query.pw1.toLowerCase();
    }

    if (_.isEmpty(query._id) || _.isNull(query._id) || _.isUndefined(query._id)) {
        //create new record
        DB.users.insert(query, {
            safe: true
        }, function (err, objects) {
            if (err) {
                return next(err);
            }
            log.info('Student Created : ', JSON.stringify(objects));
            res.status(201);
            res.send(objects);
        });
    } else {
        //update record by matchin _id
        query._id = new mongodb.ObjectID(query._id);

        log.info('Student Updated : ', query._id);
        // log.debug('Update query : ', JSON.stringify(query));

        DB.users.update(_.pick(query, '_id'), {
            $set: _.omit(query, '_id')
        }, {
            safe: true
        }, function (err, objects) {
            if (err) {
                log.emerg('Update error : ', JSON.stringify(err));
                return next(err);
            }
            log.info("Student Update : success", objects);
            res.status(201);
            res.send(objects);
        });
    }
});


// *******************************************************
//          Center endpoints

app.route('/center(/:id)?')
    .all(bodyParser)
    .get(function (req, res, next) {
        req.query.deleted = {$exists: false};
        log.info('Center query : ', JSON.stringify(req.query));
        if (req.params.id) {
            DB.centers.findOne(req.query, function (err, record) {
                if (err) {
                    return next(err);
                }
                log.debug('Returning : '+ JSON.stringify(record));
                res.send(record);
            });
        } else {
            DB.centers.find(req.query, {safe: true}).toArray(function (err, objects) {
                if (err) {
                    return next(err);
                }
                log.debug('Returning : '+ JSON.stringify(objects));
                res.status(200);
                res.send(objects);
            });
        }
    })
    .put(function (req, res, next) {
        var query = req.body;

        log.info('Center create');
        console.log('Center create', query);

        DB.centers.insert(query, {
            safe: true
        }, function (err, objects) {
            if (err) {
                return next(err);
            }
            log.info('Center Created : ', JSON.stringify(objects));
            res.status(201);
            res.send(objects);
        });
    })
    .post(function (req, res, next) {
        var query = req.body;

        DB.centers.update(_.pick(query, '_id'), _.omit(query, '_id'), {
            safe: true
        }, function (err, objects) {
            console.log(err, objects);
            if (err) {
                return next(err);
            }
            log.info('Center update : ', JSON.stringify(objects));
            res.status(202);
            res.send(objects);
        });
    });

/**
 * Get center obj
 */
app.post('/center/find[/]?', bodyParser, function (req, res, next) {
    var query = req.body;
    query.deleted ={
        $exists: false
    };

    log.info('Center find query=' + JSON.stringify(_.pick(query, '_id', 'name')));
    log.debug('Center/find query=' + JSON.stringify(query));

    var hasEitherProprty = _.has(query, 'name') || _.has(query, '_id');

    if (!hasEitherProprty) {
        return next(new Error('need name or _id for this call'));
    }

    DB.centers.findOne(query, {
        limit: 1,
        fields: {
            purchaseOrders: 0
        }
    }, function (err, records) {
        if (err) {
            return next(err);
        }

        log.debug('Returning : '+ JSON.stringify(records));

        res.send(records);
    });
});

/**
 * Can only update if you have _id value. new centers created by us
 */
app.post('/center/update[/]?', bodyParser, function (req, res, next) {
    var query = req.body;
    if (!query._id) {
        return next(new Error('need object _id for this call'));
    }

    query._id = new mongodb.ObjectID(query._id);

    log.info('Updating Center : ' + JSON.stringify(query._id));
    log.debug('Center/Update query : ' + JSON.stringify(query));

    DB.centers.update(_.pick(query, '_id'), _.omit(query, '_id'), {
        safe: true
    }, function (err, objects) {
        if (err) {
            return next(err);
        }
        log.debug('Successful update id=',req.query._id);
        res.send(201);
    });
});

// *******************************************************
//          Recordings enpoints

/**
 * Returns a file from GrdFS
 */
app.get('/recordings/:filename', function (req, res, next) {
    log.debug('request for ' + req.params.filename);
    var storedRec = new mongodb.GridStore(DB, req.params.filename, 'r');
    storedRec.open(function (err, gs) {
        if (err) {
            return res.send(404);
        }

        //file opened, can now do things with it
        // Create a stream to the file
        log.debug('request for existing recording');
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
    log.debug('sending recording to mongo filename=' + req.params.filename);
    var newRecording = new mongodb.GridStore(DB, req.params.filename, 'w', {
        "content_type": "binary/octet-stream",
        "chunk_size": 1024 * 4
    });

    newRecording.open(function (err, gridStore) {
        if (err) {
            log.error('could not open Gridstore item filename=' + req.params.filename);
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
    console.log('Params : ' + req.params);
    console.log('Method : ' + req.method);
    console.log('_method : ' + req._method);
    console.log('headers : ' + JSON.stringify(req.headers));
    console.log('Data : \n');

    req.on('end', function () {
        res.write('<h1>Headers</h1>\n' + JSON.stringify(req.headers));
        res.write('<h1>Params</h1>\n' + JSON.stringify(req.params));
        res.write('<h1>Data</h1>\n' + JSON.stringify(req.data));
        res.send();
    });
});

// app.all('/dev/crash[/]?', function(req, res, next) {
//   console.error('This is a triggerd crash');
//   log.crit('This is a triggerd crash');
//   res.send('crashing app in 500ms');
//   setTimeout(function() {
//     throw new Error('this crash was triggered');
//   }, 500);
// });

// *******************************************************
//          Start of application doing things

// https://github.com/mongodb/node-mongodb-native#documentation

var options = {};
options.autoreconnect = true;
options.safe = true;
options.logger = {};
options.logger.doDebug = true;
options.logger.debug = function (message, object) {
    // print the mongo command:
    // "writing command to mongodb"
    log.debug(message);

    // print the collection name
    log.debug(object.json.collectionName);

    // print the json query sent to MongoDB
    log.debug(object.json.query);

    // // print the binary object
    // console.log(object.binary)
    // log.debug(object.binary)
};

mongodb.connect(process.env.DB_URI, options, function (err, dbconnection) {
    if (err) {
        log.emerg('error opening database');
        throw (err);
    }
    DB = dbconnection; //make the db globally avaliable

    DB.collection('users', function (err, collection) {
        if (err) {
            log.emerg('cannot open users collection');
            throw (err);
        }
        DB.users = collection;
    });

    DB.collection('centers', function (err, collection) {
        if (err) {
            log.emerg('cannot open centers collection');
            throw (err);
        }
        DB.centers = collection;
    });

    app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80).once('listening', function() {
        log.info('listening on ' + process.env.PORT);
    });
});

process.on('SIGHUP', function () {
    DB.close();
    app.close();
    console.log('bye');
});
