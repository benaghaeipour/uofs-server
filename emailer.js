/*jslint node:true*/
var nodemailer = require('nodemailer'),
    stubTransport = require('nodemailer-stub-transport');

var transport = nodemailer.createTransport(stubTransport());

module.exports = {
    sendPasswordReset: function (user, cb) {
        transport.sendMail({
            to: user.username,
            from: 'setup-assitant@unitsofsound.com',
            subject: 'Your new password has been reset.',
            html: '<p>Your new password is : </p>'
        }, cb);
    },
    sendCenterCreate: function (center, cb) {
        transport.sendMail({
            to: center.mainContact,
            from: 'setup-assitant@unitsofsound.com',
            subject: 'Your new Uints of Sound center.',
            html: '<p><b>' + center.name + '</b> has been created as a new Uints of Sound center, with you as the main contact</p><p>You should recieve a seccond email shortly with your new password</p>'
        }, cb);
    }
};