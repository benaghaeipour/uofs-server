var assert = require('assert'),
    http = require('http'),
    async = require('async'),
    fs = require('fs'),
    _ = require('underscore');

require("../app.js");

var requestOptions = {
  host:process.env.IP,
  port:process.env.PORT,
  method:'POST',
  path:'/log/',
  headers:{
    'content-type':'binary/octet-stream'
    }
};

setTimeout(function() {
    //wait 15 secs for server to startup
  async.series([
    //non parrallel executing tests for simplicity's sake

    function(callback){
      //post log obeject
      requestOptions.path = '/recordings/'+Math.round(Math.random()*1000000)+'4321/';

      var req = http.request(requestOptions, function(response){
        response.pipe(process.stdout);
        callback();
      });

      fs.createReadStream('tests/d1.mp3').pipe(req);
    },

    function (callback) {
      console.log('shutting down in 1.5s');
      setTimeout(function() {
        process.exit(0);
      },1500);
      callback();
    }
  ]);
}, 1500);
