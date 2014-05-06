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
    express = require('express'),
    mongodb = require('mongodb'),
    _ = require('underscore'),
    logentries = require('node-logentries');

// *******************************************************
//          Global Variables
var DB = null,
    app = express();

var log = logentries.logger({
    token: process.env.LOG_TOKEN,
    timestamp: false
});

// set defaults to those needed for local dev
app.set('env', (process.env.NODE_ENV || 'development'));
process.env.LOG_TOKEN = process.env.LOG_TOKEN || 'a15ad4d2-7c28-406d-bef0-9e12f39225b5';
process.env.DB_URI = process.env.DB_URI || 'mongodb://c9:c9@alex.mongohq.com:10051/dev?safe=true';
process.env.PORT = process.env.PORT || 5000;


// *******************************************************
//          expose 'app' for testing
module.exports = app;

// *******************************************************
//          Server Configuration

log.info('Configuring Application for NODE_ENV: ' + app.get('env'));
log.info('Configuring for DB : ' + process.env.DB_URI);
log.info('Mongo-db-native driver version : ' + mongodb.version);


app.configure(function () {
    app.use(express.logger({
        format: process.env.LOG_TOKEN + ' :req[x-forwarded-for] [req] :method :url [res] :status :res[content-length] b res_time=:response-time ms',
        stream: new net.Socket().connect(10000, 'api.logentries.com')
    }));
    app.use(express.json());
    app.use(app.router);
    app.use(express.static(__dirname + '/www'));
});

switch(process.env.NODE_ENV) {
    case 'production':
        log.level('info');
        app.use(express.timeout());
        break;
    case 'development':
        //allow overflow
    default:
        log.on('log', function (logline) {
            console.log(logline);
        });
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: false
        }));
        log.level('info');
        log.debug('Setting up debug level logging');
        break;
}

// *******************************************************
//          Some standrad routes etc

app.get('/u[k,s]/*', function (req, res, next) {
    res.redirect(301, 'http://static.unitsofsound.net' + req.path);
});

app.get('/favicon.ico', function (req, res, next) {
    //no favicon avaliable, but dont want 404 errors
    res.status(200);
    res.send();
});

app.get('/crossdomain.xml', function (req, res, next) {
    //no favicon avaliable, but dont want 404 errors
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
//          Login endpoint

/**
 * Does a search with request object whcih should only return one or none docs
 *
 * check that req includes user, center & pass
 */
app.post('/login[/]?', function (req, res, next) {
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
            log.notice('Login Failed : ', JSON.stringify(query));
            res.send(401);
        }
    });
});

// *******************************************************
//          Student endpoints

/**
 * Does a find on the DB from the posted object
 */
app.post('/student/find[/]?', function (req, res, next) {
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

    log.info('Student/Find/ : ', JSON.stringify(query));

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
app.post('/student/delete[/]?', function (req, res, next) {
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

        res.send(201);
    });
});

/**
 * Create SR if _id == null
 * Update SR if _id == something
 */
app.post('/student/update[/]?', function (req, res, next) {
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
            log.info('Student Created : ', objects);
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

/**
 * Get center obj
 */
app.post('/center/find[/]?', function (req, res, next) {
    var query = req.body;

    log.debug('Center/Find Query : ' + JSON.stringify(query));

    if (!query.name) {
        return next(new Error('need name or _id for this call'));
    }

    log.info('Center find : ' + query.name);

    DB.centers.findOne(query, {
        limit: 1,
        fields: {
            purchaseOrders: 0
        }
    }, function (err, records) {
        if (err) {
            return next(err);
        }

        // log.debug('Returning : '+ JSON.stringify(records));

        res.send(records);
    });
});

/**
 * Can only update if you have _id value. new centers created by us
 */
app.post('/center/update[/]?', function (req, res, next) {
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
        log.debug('Retuning : ' + JSON.stringify(objects));
        res.send(201);
    });
});

// *******************************************************
//          Recordings enpoints

/**
 * Returns a file from GrdFS
 */
app.get('/recordings/:filename[/]?', function (req, res, next) {
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
app.post('/recordings/:filename[/]?', function (req, res, next) {

    log.debug('receieving recording file ' + req.params.filename);
    var tempFileName = './tmp/' + req.params.filename;
    //buffer file upload into an actual file
    var uploadBuff = fs.createWriteStream(tempFileName);
    req.pipe(uploadBuff);

    //save this file off to DB
    req.on('end', function () {
        var newRecording = new mongodb.GridStore(DB, req.params.filename, 'w', {
            "content_type": "binary/octet-stream",
            "chunk_size": 1024 * 4
        });

        newRecording.open(function (err, gridStore) {
            if (err) {
                return next(err);
            }

            gridStore.writeFile(tempFileName, function (err, filePointer) {
                if (err) {
                    return next(err);
                }
                log.debug('recoding file has been sucessfully saved');
                res.send(201);
                fs.unlink(tempFileName);
            });
        });
    });
});


// *******************************************************
//          Log enpoint

/**
 * log req body into the db with a type & message minimum, and any other properties
 */
app.post('/log[/]?', function (req, res, next) {
    if (_.isEmpty(req.body.type) || _.isEmpty(req.body.type)) {
        next(new Error('log does not have the required properties \'type\' and \'message\''));
        return;
    }
    DB.logs.insert(req.body, {
        safe: true
    }, function (err, objects) {
        if (err) {
            log.err('error saving log : ' + err);
            res.send(500);
        } else {
            res.send(201);
        }
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

    //https.createServer(null, app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 443);
    http.createServer(app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);
    log.debug('listening on %s', process.env.PORT);
});

process.on('SIGHUP', function () {
    DB.close();
    console.log('bye');
});

process.on('uncaughtException', function (err) {
    log.emerg("UNCAUGHT!!: " + err + err.stack);
    process.exit(1);
});
