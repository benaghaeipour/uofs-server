var db = require('../mongodb.js');

process.env.NODE_ENV = 'development';

var openDB = db.connect('dev');

db.saveRecording();
db.getRecording();

setTimeout(function() {
  db.dissconnect();
}, 10000);