var db = require('../mongoHQdb.js');

db.connect('dev');
db.saveRecording();
db.getRecording();

setTimeout(function() {
    process.exit(0);
}, 6000);