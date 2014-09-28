/*jslint node:true */
var list = ["54280161bc41940b00eb1ffb",
"5428023cbc41940b00eb1ffd",
"54280294bc41940b00eb1fff",
"542802dcbc41940b00eb2001",
"54280346bc41940b00eb2003",
"542803d5bc41940b00eb2005",
"54280467bc41940b00eb2007",
"542804febc41940b00eb2009",
"54280558bc41940b00eb200b",
"542805e6bc41940b00eb200d",
"5428063fbc41940b00eb200f",
"54280696bc41940b00eb2011",
"542806e8bc41940b00eb2013",
"5428073fbc41940b00eb2015",
"54281b89bc41940b00eb2019",
"54281c25bc41940b00eb201b"],
    request = require('superagent');

function changeDialect(err, res) {
    console.log('was: ' + res.body[0].voiceDialect);
    res.body[0].voiceDialect = 0;
    console.log('now: ' + res.body[0].voiceDialect);
    request
        .post('http://uos-dev.herokuapp.com/student/update')
        .send(res.body[0])
        .set('Accept', 'application/json')
        .end(function (err, res) {
            err ? console.log('error') : null;
        });
}

list.forEach(function (id) {
    console.log('finding : ' + id);
    request
        .post('http://uos-dev.herokuapp.com/student/find')
        .send({
            _id: id
        })
        .set('Accept', 'application/json')
        .end(changeDialect);
});