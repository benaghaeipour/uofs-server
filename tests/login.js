var assert = require('assert'),
    http = require('http'),
    async = require('async'),
    _ = require('underscore');

require("../App.js");

      
var requestOptions = {
  host:process.env.IP, 
  port:process.env.PORT, 
  method:'POST', 
  path:'/login/', 
  headers:{
    'content-type':'application/json'
    }
};

setTimeout(function() {
    //wait 15 secs for server to startup
  async.series([
    //non parrallel executing tests for simplicity's sake
    function(callback){ 
      //login with correct creds get 200
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 200, 'login with correct details');
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        username:'chris',
        pw1:'iii'
      },'utf8'));
    },
    
    function(callback){ 
      //login with wrong creds and get 401-unauth error
      var req = http.request(requestOptions, function(response){
        assert.equal(response.statusCode, 401, 'login with wrong password');
        response.pipe(process.stdout);
        callback();
      });
      req.end(JSON.stringify({
        username:'chris',
        pw1:'wrong'
      },'utf8'));
    },
    
    function(callback){ 
      //login which could return more than one entry
      var req = http.request(requestOptions, function(response){
        response.pipe(process.stdout);
        response.on('end', function(){
          assert.equal(response.statusCode, 401, 'login with missing user & pw1');
        });
        callback();
      });
      req.end(JSON.stringify({
        center:'London'
      },'utf8'));
    },
    
    function (callback) {
      setTimeout(function() {
        process.exit(0);
      },5000);
      callback();
    }
  ]);    
}, 2000);
