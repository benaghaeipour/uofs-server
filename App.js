// *******************************************************
// expressjs template
//
// assumes: npm install express
//
// assumes these subfolders:
//   public/
//
var phpProxy = require('http-proxy').createServer(80, 'unitsofsound.net/v6php/');
var express = require('express');
var util = require('util');
var app = express();
var PostBuffer = require('bufferstream/postbuffer');

// *******************************************************
//          Server Configuration
app.configure(function(){  
  app.use(express.logger(':date - :remote-addr [req] :method :url :status [res] :res[content-length] - :response-time ms'));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/www'));
  app.use('/v6php', phpProxy);
});

console.log('Configuring Application for NODE_ENV:'+process.env.NODE_ENV);

app.configure('C9', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('AppFog', function(){
  app.use(express.errorHandler());
});

// *******************************************************
//          Validate rest call

app.all('*', function(req, res, next){
  //res.set('Content-Type','html/text'); 
  next();
});

app.param('student', function(req, res, next, student){
  req.params.student = parseInt(student);
  next();
});

app.param('lesson', function(req, res, next, lesson){
  req.params.lesson = parseInt(lesson);
  if(lesson > 160){
    res.status(400);
    next(new Error('requested lesson is out of range 1-160'));
  }else{
    next();  
  }
});

app.param('page', function(req, res, next, page){
  req.params.page = parseInt(page);
  if(page > 10){
    res.status(400);
    next(new Error('requested page is out of range 1-10'));
  }else{
    next();  
  }
});

app.param('block', function(req, res, next, block){
  req.params.block = parseInt(block);
  if(block > 8){
    res.status(400);
    next(new Error('requested block is out of range 1-8'));
  }else{
    next();  
  }
});

app.param('word', function(req, res, next, word){
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

app.get('/assets/*', function (req, res, next) {
  res.redirect(301, 'http://www.unitsofsound.net/preview'+req.path);
});

app.get('/favicon.ico', function (req, res, next) {
  //no favicon avaliable, but dont want 404 errors
  res.send();
});

// *******************************************************
//          Actually do save/get file
app.get('/recordings/:student?/:lesson?/:page?/:block?/:word?/', function(req, res, next){
  res.send();
});

/** 
 * REST interface /<student id>/<lesson>/<page>/<block>/<word>/
 * 
 * if the request gets to this function it has passed all verification and can 
 * be acted upon
 */
app.post('/recordings/:student?/:lesson?/:page?/:block?/:word?/', function(req, res, next){

  // pipe req data into a file
  var uploadBuffer = new PostBuffer(req);
  
  uploadBuffer.onEnd(function(data){
   res.send();
  });
  
  req.on('error', function(err){
    util.log(err);
    res.status(500);
    res.send('server error while uploading sound'); 
  });
  
});

/**
 * logging endpoint
 * loggins will be simple and 'ficle' errors not dealt with etc etc'
 */
app.post('/logs/', function(req, res, next) {
  var logBuffer = new PostBuffer(req);
  
  logBuffer.onEnd(function(data){
    res.send(200);
    var logDoc = JSON.parse(data);
    logDoc.type = logDoc.type || "log";
  });
});

/**
 * dump will just dump req data to console.
 */
app.post('/dump*', function (req, res, next) {
    req.pipe(process.stdout);
    res.send();
});

/**
 * Start Application
 */
app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);

console.log('listening on %s, %s', process.env.PORT , process.env.IP );

process.on('exit', function () {
  console.log('bye');
});
