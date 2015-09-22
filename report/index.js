'use strict';
var route = require('express').Router();

route.get('*', require('serve-static')(__dirname, {maxAge: 0}));

module.exports = route;
