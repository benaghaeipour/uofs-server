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
    
    function(callback){ 
      //post log obeject
      requestOptions.path = '/center/find/';
      
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 200, 'failed to get centers for london');
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        name:'London'
      }));
    },
    
    function(callback){ 
      //post log obeject
      requestOptions.path = '/center/update/';
      
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 201, 'failed to update center');
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        name:'London',
        maxDate:'blah'
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
