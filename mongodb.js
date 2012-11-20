
var mongodb = require("mongodb"),
  db = null,
  debug = process.env.NODE_ENV == 'development';

module.exports.connect = function(dbname){
  if(debug){console.log('connecting to db');}
  var server = new mongodb.Server('alex.mongohq.com', 10051);
  db = new mongodb.Db('dev', server).open(function(err, db) {
    if(!err) {
      console.log("We are connected");
    }
  });
};

module.exports.allLogs = function(){
    
};

module.exports.saveRecording = function(buffer){
  if(debug){console.log('saving recording to db');}
};

module.exports.getRecording = function(){
  if(debug){console.log('getting recording from db');}
  var buffer;
  
  return buffer;
};

process.on('exit', function(){
  db.close(); 
  console.log('db connection closed');
});