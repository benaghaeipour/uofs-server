var assert = require('assert'),
    http = require('http'),
    async = require('async'),
    _ = require('underscore');

require("../App.js");

var studentRecord = JSON.stringify({
        _id:"50b7edd4f76d067e2e000002",
        fname:'Chris',
        lname:'Matheson',
        center:'london',
        origin:'node test'
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
      //post log obeject
      requestOptions.path = '/log/';
      
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 201, 'while writing a log to DB', 'got');
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        type:'test',
        message:'this was sent from node.js tests'
      }));
    },
    
    function(callback){ 
      //post student obeject
      requestOptions.path = '/student/update/';
      
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 200, 'while writing a log to DB', 'got');
        callback();
      });
      req.end(studentRecord);
    },
    
    function(callback){ 
      //find student obeject
      requestOptions.path = '/student/find/';
      var req = http.request(requestOptions, function(response){
        //assert.equal(response.statusCode, 200, 'while writing a log to DB', 'got');
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({_id:'50b7edd4f76d067e2e000002'}));
    },
    
    function (callback) {
      setTimeout(function() {
        process.exit(0);
      },1500);
      callback();
    }
  ]);    
}, 1500);
