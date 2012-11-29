
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
    express = require('express'),
    util = require('util'),
    app = express(),
    mongodb = require('mongodb');
    
// *******************************************************
//          Global Variables
var DB = '',
    students = null,
    logs = null;

// *******************************************************
//          Server Configuration
app.configure(function() {
  app.use('/v6php', phpProxy); //deal with this 1st to speed things up
  app.use(express.logger(':date - :remote-addr [req] :method :url :status [res] :res[content-length] - :response-time ms'));
  app.use(express.methodOverride());
  app.use('/log/', express.json());
  app.use('/student/*', express.json());
  app.use(app.router);
  app.use(express.static(__dirname + '/www'));
});

console.log('Configuring Application for NODE_ENV:'+process.env.NODE_ENV);

app.configure(function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('dbURI','mongodb://c9:c9@alex.mongohq.com:10051/dev?safe=true');
});

app.configure('production', function() {
  app.use(express.errorHandler());
  app.set('dbURI','mongodb://c9:c9@alex.mongohq.com:10051/prod?safe=false');
});

// *******************************************************
//          Validate rest call

app.param('student', function(req, res, next, student) {
  req.params.student = parseInt(student);
  next();
});

app.param('lesson', function(req, res, next, lesson) {
  req.params.lesson = parseInt(lesson);
  if(lesson > 160){
    res.status(400);
    next(new Error('requested lesson is out of range 1-160'));
  }else{
    next();  
  }
});

app.param('page', function(req, res, next, page) {
  req.params.page = parseInt(page);
  if(page > 10){
    res.status(400);
    next(new Error('requested page is out of range 1-10'));
  }else{
    next();  
  }
});

app.param('block', function(req, res, next, block) {
  req.params.block = parseInt(block);
  if(block > 8){
    res.status(400);
    next(new Error('requested block is out of range 1-8'));
  }else{
    next();  
  }
});

app.param('word', function(req, res, next, word) {
  req.params.word = parseInt(word);
  if(word > 5){
    res.status(400);
    next(new Error('requested word is out of range 1-5'));
  }else{
    next();  
  }
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
//          Recordings enpoints
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

  var newRecording = mongodb.GridStore(DB, req.path,'w',{
    "content_type": "binary/octet-stream",
    "metadata":{
      "student": req.params.student ,
      "lesson": req.params.lesson ,
      "page": req.params.page ,
      "word": req.params.word 
    },
    "chunk_size": 1024*4
  });
  
  req.on('data',function(chunk) {
    newRecording.write(chunk,function(err, gs) {
      if(err){
        console.log('error writing recording to GridFS');
      }
    });
  });
  
  req.on('error', function(err) {
    util.log(err);
    res.status(500);
    res.send('server error while uploading sound');
    newRecording.close(function(){
      mongodb.GridStore.unlink(DB, req.path);
    });
  });
  
  req.on('end',function() {
    newRecording.close();
  });
});

// *******************************************************
//          Student endpoints

/**
 * Creates a new student record from the req.data
 */
app.post('/student/new/', function(req, res, next) {
  students.insert(req.body, {safe:true}, function(err, objects) {
    if(err){
      console.log('error saving log : ' + err);
    }
  });
  res.send(); 
});

/**
 * Does a find on the DB from the posted object
 */
app.post('/student/find/', function(req, res, next) {
  if(!req.body._id){
    res.body = 'no _id in request object';
    res.send(400);
    next(new Error('no _id in request object'));
  }else{
    res.send();
  }
});

/**
 * Deletes the object found by the post data. (only if 1 is found)
 */
app.post('/student/delete/', function(req, res, next) {
  res.send(); 
});

/**
 * Merge req data with a record only if _id is present & valid
 */
app.post('/student/update/', function(req, res, next) {
  res.send(); 
});

// *******************************************************
//          Debug enpoints
app.post('/log/', function(req, res, next){
  logs.insert(req.body, {safe:true}, function(err, objects) {
    if(err){
      console.log('error saving log : ' + err);
      res.send(500);
    }else{
      res.send();
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
  res.send();
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
  
  //https.createServer(null, app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 443);
  http.createServer(app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);
  console.log('listening on %s, %s', process.env.PORT , process.env.IP );
});

process.on('SIGHUP', function() {
  console.log('bye');
});
