
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
//          Application metrics
//var appfog = JSON.parse(process.env.VMC_APP_INSTANCE);
//require('nodefly').profile(
//    '08a3157a-c881-4488-a8d8-ccb0b53ca8a5',
//    ['[C9]uos-dev'],
//    {
//      // time in ms when the event loop is considered blocked
//      blockThreshold: 10
//    }
//);

// *******************************************************
//          Application includes
var phpProxy = require('http-proxy').createServer(80, 'unitsofsound.net/v6php/'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    express = require('express'),
    mongodb = require('mongodb'),
    _ = require('underscore');
    
    
// *******************************************************
//          Global Variables
var DB = null,
    app = express();

// *******************************************************
//          Server Configuration
app.configure(function() {
  app.use(express.logger(':date - :remote-addr [req] :method :url [res] :status :res[content-length] - :response-time ms'));
  app.use('/v6php', phpProxy);
  app.use(express.json());
  app.use(app.router);
  app.use(express.static(__dirname + '/www'));
});

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log('Configuring Application for NODE_ENV:'+process.env.NODE_ENV);

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: false }));
  app.set('dbURI','mongodb://c9:c9@alex.mongohq.com:10051/dev?safe=true');
});

app.configure('production', function() {
  app.use(express.logger({
    format:':date - :remote-addr [req] :method :url [res] :status :res[content-length] b in:response-time ms',
    stream: fs.createWriteStream('http-reqs.logs', {flags:'a'})
  }));
  app.use(express.timeout());
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
app.post('/login[/]?', function(req, res, next) {
  //sanitize
  var query = _.extend({
    username:"",
    pw1:""
  }, _.pick(req.body,'username','pw1'));
  query.username.toLowerCase();
  query.pw1.toLowerCase();
  
  DB.users.findOne(query, {limit:1}, function (err, studentRecord) {
    if(err){ return next(err)}

    if(studentRecord){
      DB.logs.insert({
        type: "Login",
        sucessfull: true,
        message: query
      },{safe:false});
      res.send(studentRecord);
    }else{
      DB.logs.insert({
        type: "Login",
        sucessfull: false,
        message: query
      },{safe:false});
      res.send(401);
    }
  });
});

// *******************************************************
//          Student endpoints

/**
 * Does a find on the DB from the posted object
 */
app.post('/student/find[/]?', function(req, res, next) {
  var query = req.body;
  var options = {};
  if(query._id){
    query._id = new mongodb.ObjectID(query._id);
    
  }else{
    //dont fetch syllabus's when doing big query
    options.fields = {
      'dictationSyllabus':0,
      'spellingSyllabus':0, 
      'readingSyllabus':0, 
      'memorySyllabus':0
    };
  }
  if(query.username){
    query.username.toLowerCase();  
  }
  if(query.pw1){
    query.pw1.toLowerCase();
  }

  DB.users.find(query, options).toArray(function (err, records) {
    if(err){ return next(err)}
    res.send(records);
  });
});

/**
 * Deletes the object found by the post data. (only if 1 is found)
 */
app.post('/student/delete[/]?', function(req, res, next) {

  res.send();
});

/**
 * Create SR if _id == null
 * Update SR if _id == something
 */
app.post('/student/update[/]?', allowEdit, function(req, res, next) {
  var query = req.body;
  
  if(query.username){
    query.username.toLowerCase();  
  }
  if(query.pw1){
    query.pw1.toLowerCase();
  }
  
  if(_.isEmpty(query._id) || _.isNull(query._id) || _.isUndefined(query._id)){
    //create new record
    DB.users.insert(query,{safe:true},function(err, objects) {
      if(err){ return next(err)}
      
      res.send(201);
    });
  }else{
    //update record by matchin _id
    query._id = new mongodb.ObjectID(query._id);
    console.log(JSON.stringify(query));
    DB.users.update(_.pick(query, '_id'), _.omit(query,'_id'), {safe:true}, function(err, objects) {
      if(err){ return next(err)}
      
      res.send(201);
    });
  }
});

/**
 * This function will check if the current session's logged in user is allowed to 
 * perform the requested edits.
 * passes an error if this is not possible
 */
function allowEdit(req, res, next){
  next();
  return;
}


// *******************************************************
//          Recordings enpoints

/**
 * Returns a file from GrdFS
 */
app.get('/recordings/:filename[/]?', function(req, res, next) {
  var storedRec = new mongodb.GridStore(DB, req.params.filename,'r');
  storedRec.open(function(err, gs) {
    if(err){ return next(err)}
    
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
app.post('/recordings/:filename[/]?', function(req, res, next) {
  
  var tempFileName = './tmp/'+req.params.filename;
  //buffer file upload into an actual file
  var uploadBuff =  fs.createWriteStream(tempFileName);
  req.pipe(uploadBuff);
  
  //save this file off to DB
  req.on('end', function () {
    var newRecording = new mongodb.GridStore(DB, req.params.filename,'w',{
      "content_type": "binary/octet-stream",
      "chunk_size": 1024*4
    });
    
    newRecording.open(function(err, gridStore) {
      if(err){ return next(err)}
      
      gridStore.writeFile(tempFileName , function (err, filePointer) {
        if(err){ return next(err)}
        
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
app.post('/log[/]?', function(req, res, next){
  if( _.isEmpty(req.body.type) || _.isEmpty(req.body.type) ){
    next(new Error('log does not have the required properties \'type\' and \'message\''));
    return;
  }
  DB.logs.insert(req.body, {safe:true}, function(err, objects) {
    if(err){
      console.log('error saving log : ' + err);
      res.send(500);
    }else{
      res.send(201);
    }
  });
});


// *******************************************************
//          Debug enpoints

/**
 * dump will just dump req data to console.
 */
app.all('/dev/dump[/]?', function(req, res, next) {
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

app.all('/dev/crash[/]?', function(req, res, next) {
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
    DB.logs = collection;
  });
  
  DB.collection('users', function(err, collection) {
    if(err){
      console.log('cannot open students collection');
      throw(err);
    }
    DB.users = collection;
  });
  
  //https.createServer(null, app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 443);
  http.createServer(app).listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);
  console.log('listening on %s, %s', process.env.PORT , process.env.IP );
});

process.on('SIGHUP', function() {
  DB.close();
  console.log('bye');
});
