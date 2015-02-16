/*jslint node:true*/
'use strict';

var crypto = require('crypto');

function calcSysAdminCreds(user) {
    var hash = crypto.createHmac('sha256', process.env.SYSADMIN_KEY);
    return hash.update(user).digest('hex');
}

module.exports = function auth(req, res, next) {

    if (req.user.pass === calcSysAdminCreds(req.user.name)) {
        return next();
    }

    res.status(401);
    res.end();
};