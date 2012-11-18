var mongojs = require('mongojs');

var db = mongojs('c9:imhim4032@alex.mongohq.com:10038/uos_sound_chris', ['sounds', 'logs']);

db.sounds.find({
    student: 123456,
    lesson: 1,
    page: 2,
    block: 3,
    word: 4
},function(err, docs) {
    // docs is an array of all the documents in mycollection
    console.log(docs);
});

setTimeout(function() {
    process.exit(0);
}, 3000);