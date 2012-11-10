// *******************************************************
// expressjs template
//
// assumes: npm install express
// defaults to jade engine, install others as needed
//
// assumes these subfolders:
//   public/
//   public/javascripts/
//   public/stylesheets/
//   views/
//
var express = require('express');
var fs = require('fs');
var util = require('util');
var app = express();

// Configuration
app.configure(function(){  
  app.use(express.logger({ immediate: true }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
  app.use(express.errorHandler());
});
// *******************************************************


app.get('/:student?/:lesson?/:page?/:block?/:word?/', function(req, res){
  if(!req.params.word){
    // returns only 1-5 sounds in an array OR an error
    console.log('no word var');
  }
  
  res.send();
});

app.post('/:student/:lesson/:page/:block/:word/', function(req, res){
  // REST interface /student/lesson/page/block/word/
  console.log('fs path - %s, %n', req.path, req.params.length);
  
  if(!req.params.word){
    console.log('no word param');
    res.status(500);
    res.send('Missing word variable in REST call');
  } 
  else{
    res.status(200)  ;
    res.send();
  }
  
  // optional, verify that student number is valid
  // pip req data into a file
  var save = fs.createWriteStream('sounds/aSound.bytearray');
  req.pipe(save);
  req.on('end', function(){
    util.log('saved sound to disk')
    save.destroy();  
  });
});

app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);

console.log('listening on %j, %j', process.env.PORT , process.env.IP );
