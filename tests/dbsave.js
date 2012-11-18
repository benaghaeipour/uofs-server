var mongojs = require('mongojs');

var db = mongojs('c9:imhim4032@alex.mongohq.com:10038/uos_sound_chris', ['sounds', 'logs']);

db.logs.save(
    {
        type:'test',
        message:'a log from'
    },
    function(err, res) {
        // docs is an array of all the documents in mycollection
        console.log(res);
        process.ext(0);
    }
);