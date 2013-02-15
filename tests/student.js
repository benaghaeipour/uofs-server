var assert = require('assert'),
    http = require('http'),
    async = require('async'),
    fs = require('fs'),
    _ = require('underscore');

require("../App.js");

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
      //create new SR
      requestOptions.path = '/student/update/';
      
      var req = http.request(requestOptions, function(response){
        response.pipe(process.stdout);
        assert.equal(response.statusCode, 201, 'Failed to create unique SR');
        callback();
      });
      req.end(JSON.stringify({
        username:'chris'+Math.round(Math.random()*1000),
        center:'London'
      }));
    },
    
    function(callback){ 
      //New SR with same details as existing
      requestOptions.path = '/student/update/';
      
      var req = http.request(requestOptions, function(response){
        response.on('end', function(){
          //assert.equal(response.statusCode, 400, 'Failed to refuse new SR with details that allready exist');  
        });
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        username:'chris',
        center:'London'
      }));
    },
    
    function(callback){ 
      //New SR with same details as existing
      requestOptions.path = '/student/delete/';
      
      var req = http.request(requestOptions, function(response){
        response.on('end', function(){
          //assert.equal(response.statusCode, 400, 'Failed to refuse new SR with details that allready exist');  
        });
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        _id:'510f89605f3269072e000010'
      }));
    },
    
    function(callback){ 
      //update an existing record with current time stamp
      requestOptions.path = '/student/update/';
      var req = http.request(requestOptions, function(response){
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        _id:'50fd14f37646fb785f00000b',
        modified: Date()
      }));
    },
        
    function (callback) {
      setTimeout(function() {
        process.exit(0);
      },1500);
      callback();
    }
  ]);    
}, 1500);
