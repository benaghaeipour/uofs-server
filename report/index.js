'use strict';
var route = require('express').Router();
var browserify = require('browserify');

route.get(/progress\/index\.js/, function (req, res) {
  browserify(__dirname + '/progress/index.js', {debug: true}).bundle().pipe(res);
});

route.get('*', require('serve-static')(__dirname, {maxAge: 0}));

module.exports = route;
