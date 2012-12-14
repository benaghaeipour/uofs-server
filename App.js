
// *******************************************************
// expressjs template
//
// assumes: npm install express
//
// assumes these subfolders:
//   public/
//
var phpProxy = require('http-proxy').createServer(80, 'unitsofsound.net/v6php/'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    express = require('express'),
    util = require('util'),
    app = express(),
    mongodb = require('mongodb'),
    _ = require('underscore');
    
// *******************************************************
//          Global Variables
var DB = '',
    students = null,
    logs = null,
    results = null;

// *******************************************************
//          Server Configuration
app.configure(function() {
  app.use(express.logger(':date - :remote-addr [req] :method :url :status [res] :res[content-length] - :response-time ms'));
  app.use(express.timeout());
  app.use(express.static(__dirname + '/www'));
  app.use('/v6php', phpProxy); //deal with this 1st to speed things up
  app.use(express.json());
  app.use(app.router);
});

console.log('Configuring Application for NODE_ENV:'+process.env.NODE_ENV);

app.configure(function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('dbURI','mongodb://c9:c9@alex.mongohq.com:10051/dev?safe=true');
});

app.configure('production', function() {
  app.use(express.logger({
    format:':date - :remote-addr [req] :method :url :status [res] :res[content-length] - :response-time ms',
    stream: fs.createWriteStream('http-reqs.logs', {flags:'a'})
  }));
  app.set('dbURI','mongodb://c9:c9@alex.mongohq.com:10051/prod?safe=false');
});



// *******************************************************
//          Some standrad routes etc

app.get('/assets/*', function(req, res, next) {
  res.redirect(301, 'http://www.unitsofsound.net/preview'+req.path);
});

app.get('/favicon.ico', function(req, res, next) {
  //no favicon avaliable, but dont want 404 errors
  res.status(200);
  res.send();
});

// *******************************************************
//          Login endpoint

/**
 * Does a search with request object whcih should only return one or none docs
 * 
 * check that req includes user, center & pass
 */
app.post('/login/', function(req, res, next) {
  var query = _.pick(req.body, 'center','loginName','pass');
  console.log(query);
  students.findOne(query, {limit:1}, function (err, studentRecord) {
    if(err){
      next(err);
      return;
    }
    if(studentRecord){
      res.send(studentRecord);
    }else{
      res.send(401);
    }
  });
});

// *******************************************************
//          Student endpoints

/**
 * Does a find on the DB from the posted object
 */
app.post('/student/find/', function(req, res, next) {
  if(req.body._id) req.body._id = new mongodb.ObjectID(req.body._id);
  
  var query = _.extend({},req.body);
  
  students.find(query, {limit:10}).toArray(function (err, records) {
    if(err){
      next(err);
      return;
    }
    res.send(records);
  });
});

/**
 * Deletes the object found by the post data. (only if 1 is found)
 */
app.post('/student/delete/', function(req, res, next) {

  res.send();
});

/**
 * Create SR if _id == null
 * Update SR if _id == something
 */
app.post('/student/update/', function(req, res, next) {
  if(_.isEmpty(req.body._id) || _.isNull(req.body._id) || _.isUndefined(req.body._id)){
    //create new record
    students.insert(req.body,{safe:true},function(err, objects) {
      if(err){
        next(err);
        return;
      }
      res.send(201);
    });
  }else{
    //update record by matchin _id
    req.body._id = new mongodb.ObjectID(req.body._id);
    students.update(_.pick(req.body, '_id'), _.omit(req.body,'_id'), {safe:true}, function(err, objects) {
      if(err){
        next(err);
        return;
      }
      res.send(201);
    });
  }
});

// *******************************************************
//          Results endpoints

/**
 * Does a find on the DB from the posted object
 */
app.post('/results/find/', function(req, res, next) {
  try{
    req.body._id = new mongodb.ObjectID(req.body._id);
  }catch(err){
    console.log(err);
  }
  students.find(req.body, {limit:50}).toArray(function (err, records) {
    if(err){
      next(err);
      return;
    } 
    res.send(records);
  });
});

/**
 * Creates a new student record from the req.data
 * Merge req data with a record only if _id is present & valid
 */
app.post('/results/save/', function(req, res, next) {
  if(req.body._id){
    res.status(400);
    next(new Error('new results should not have _id property'));
  }else{
    students.save(req.body, req.body, {safe:true}, function(err, objects) {
      if(err){
        next(err);
        return;
      }
      res.send(201);
    });
  }
});

// *******************************************************
//          Recordings enpoints

/**
 * Returns a file from GrdFS
 */
app.get('/recordings/:student?/:lesson?/:page?/:block?/:word?/', function(req, res, next) {
  var storedRec = new mongodb.GridStore(DB, req.path,'r');
  storedRec.open(function(err, gs) {
    //file opened, can now do things with it
    // Create a stream to the file
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
app.post('/recordings/:student?/:lesson?/:page?/:block?/:word?/', function(req, res, next) {

  var newRecording = new mongodb.GridStore(DB, req.path,'w',{
    "content_type": "binary/octet-stream",
    "chunk_size": 1024*4
  });
  
  newRecording.open(function(err, gridStore) {
    if(err) {next(err)}
    
    req.on('data',function(chunk) {
      gridStore.write(chunk, function(err, gs) {
        if(err){
          console.log('error writing recording to GridFS');
        }
      });
    });
  });
    
  req.on('error', function(err) {
    if(err) {next(err)}
    
    newRecording.close(function(){
      mongodb.GridStore.unlink(DB, req.path);
    });
  });
  
  req.on('end',function() {
    newRecording.close();
  });
});

// *******************************************************
//          Debug enpoints

/**
 * log req body into the db with a type & message minimum, and any other properties
 */
app.post('/log/', function(req, res, next){
  if( !req.body.type && !req.body.message ){
    next(new Error('log does not have the required properties \'type\' and \'message\''));
  }
  logs.insert(req.body, {safe:true}, function(err, objects) {
    if(err){
      console.log('error saving log : ' + err);
      res.send(500);
    }else{
      res.send(201);
    }
  });
});

/**
 * dump will just dump req data to console.
 */
app.all('/dump/*', function(req, res, next) {
  console.log('Params : '+req.params);
  console.log('Method : '+req.method);
  console.log('_method : '+req._method);
  console.log('headers : '+JSON.stringify(req.headers));
  console.log('Data : \n');
  req.pipe(process.stdout);
  req.on('end', function () {
    res.send();
  });
});

app.get('/crash/', function(req, res, next) {
  console.error('This is a triggerd crash');
  res.send('crashing app in 500ms');
  setTimeout(function() {
    throw new Error('this crash was triggered');
  }, 500);
});

// *******************************************************
//          Start of application doing things

// https://github.com/mongodb/node-mongodb-native#documentation
mongodb.connect(app.get('dbURI'), {safe:true}, function(err, dbconnection) {
  if(err){
    console.log('error opening database');
    throw(err);
  }
  DB = dbconnection; //make the db globally avaliable
  
  //make pointers to the collections we are going to use
  DB.collection('logs', function(err, collection) {
    if(err){
      console.log('cannot open logs collection');
      throw(err);
    }
    logs = collection;
  });
  
  DB.collection('students', function(err, collection) {
    if(err){
      console.log('cannot open students collection');
      throw(err);
    }
    students = collection;
  });
  
  DB.collection('results', function(err, collection) {
    if(err){
      console.log('cannot open students collection');
      throw(err);
    }
    results = collection;
  });
  
  //https.createServer(null, app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 443);
  http.createServer(app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);
  console.log('listening on %s, %s', process.env.PORT , process.env.IP );
});

process.on('SIGHUP', function() {
  console.log('bye');
});
