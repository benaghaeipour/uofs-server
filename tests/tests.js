var assert = require('assert'),
    http = require('http'),
    async = require('async'),
    _ = require('underscore');

require("../App.js");

var studentRecord = JSON.stringify({
        id:'123456',
        name:'chris matheson',
        center:'london'
      },'utf8');
      
var requestOptions = {
  host:process.env.IP, 
  port:process.env.PORT, 
  method:'POST', 
  path:'/log/', 
  headers:{
    'content-type':'application/json'
    }
};

setTimeout(function() {
    //wait 15 secs for server to startup
  async.series([
    //non parrallel executing tests for simplicity's sake
    function(callback){
      http.get({host:process.env.IP, port:process.env.PORT, path:'/favicon.ico'}, function(response){
        assert.equal(response.statusCode, 200, 'while requesting favicon.ico', 'got');
        callback();
      });    
    },
    
    function(callback){ 
      //post student obeject
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 200, 'while writing a log to DB', 'got');
        callback();
      });
      req.end(studentRecord);
    },
    
    function(callback){ 
      //post student obeject
      requestOptions.headers.x-http-method-override = 'DELETE';
      requestOptions.path = '/dump';
      
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 200, 'while writing a log to DB', 'got');
        callback();
      });
      req.end(studentRecord);
    },
    
    function (callback) {
      process.exit(0);
      callback();
    }
  ]);    
}, 1500);
