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
var app = module.exports = express.createServer();
// Configuration
app.configure(function(){
  
  app.use(express.bodyParser());
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
app.get('/', function(req, res){
  res.send('hello world');
});

app.post('/', function(req, res){
  fs.writeFile('/sounds/'+Date()+'.txt', 'Hello Node', function (err) {
    if (err){
      res.send(err);
    }else{
      res.send('OK');      
    }
  });
});

app.listen(process.env.PORT || process.env.VCAP_APP_PORT || 80);