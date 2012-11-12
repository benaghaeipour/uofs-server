// *******************************************************
// expressjs template
//
// assumes: npm install express
//
// assumes these subfolders:
//   public/
//
var httpProxy = require('http-proxy');
var phpProxy = httpProxy.createServer(80, 'unitsofsound.net/v6php/');
var express = require('express');
var fs = require('fs');
var util = require('util');
var app = express();

// *******************************************************
//          Configuration
app.configure(function(){  
  app.use(express.logger({ immediate: true }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/www'));
  app.use('/v6php', phpProxy);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
  app.use(express.errorHandler());
});

// *******************************************************
//          Validate rest call

app.param('student', function(req, res, next, student){
  util.log('validating student - ' + student);
  next();
});

app.param('lesson', function(req, res, next, lesson){
  util.log('validating lesson - ' + lesson);
  next();
});

app.param('page', function(req, res, next, page){
  util.log('validating page - ' + page);
  next();
});

app.param('block', function(req, res, next, block){
  util.log('validating block - ' + block);
  next();
});

app.param('word', function(req, res, next, word){
  util.log('validating word - ' + word);
  if(word > 5){
    req.status(500);
    next(new Error('requested word is out of range 1-5'));
  }
  next();
});

// *******************************************************
//          Actually do save/get file
app.get('/:student?/:lesson?/:page?/:block?/:word?/', function(req, res){
  //unless otherwise changes the status code should be 200 - ok 
  res.status(200);
  console.log(req.url);
  
  res.send();
});

app.post('/:student/:lesson/:page/:block/:word/', function(req, res){
  // REST interface /student/lesson/page/block/word/
  console.log('fs path - %s, %i', req.path, req.params.length);
  
  if(!req.params.word){
    console.log('no word param');
    res.status(500);
    res.send('Missing word variable in REST call');
  } 
  else{
    res.status(200);
    res.send();
  }
  
  // pipe req data into a file
  var save = fs.createWriteStream('sounds/aSound.bytearray');
  req.pipe(save);
  req.on('end', function(){
    util.log('saved sound to disk')
    save.destroy();  
  });
});

app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);

console.log('listening on %j, %j', process.env.PORT , process.env.IP );
