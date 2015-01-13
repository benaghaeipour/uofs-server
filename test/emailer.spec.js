/*jshint node:true*/
/*globals it, xit, describe, xdescribe, beforeEach, afterEach*/

var proxyquire = require('proxyquire'),
    expect = require('expect.js'),
    sinon = require('sinon'),
    sendMail = sinon.spy(),
    createTransport = sinon.stub(),
    sendPasswordReset = sinon.stub(),
    mailer = proxyquire('../emailer', {
        nodemailer: {
            createTransport: createTransport.returns({
                sendMail: sendMail
            }),
            sendPasswordReset: sendPasswordReset.returns({
                sendMail: sendMail
            })
        }
    });

describe('emailer', function () {

    it('should expose a consistant API', function () {
        expect(mailer.sendPasswordReset).to.be.a('function');
        expect(mailer.sendCenterCreate).to.be.a('function');
    });

    it('should set up a transport', function () {
        expect(createTransport.called).to.be(true);
    });

    describe('sendCenterCreate', function () {

        beforeEach(function () {
            sendMail.reset();
        });

        it('should send an email', function () {
            mailer.sendCenterCreate({});
            expect(sendMail.called).to.be(true);
        });

        it('should be to the right recipient', function () {
            mailer.sendCenterCreate({
                purchaser: 'blah@example.com'
            });
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.to).to.equal('blah@example.com');
        });

        it('should have the right sender', function () {
            mailer.sendCenterCreate({});
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.from).to.equal('setup-assistant@unitsofsound.com');
        });

        it('should have correct subject', function () {
            mailer.sendCenterCreate({});
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.subject).to.equal('Your new Uints of Sound center.');
        });

        it('should show the right content', function () {
            mailer.sendCenterCreate({
                name: 'test-center'
            });
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.html).to.match(/test-center/);
            expect(sendOpts.html).to.match(/created/);
            expect(sendOpts.html).to.match(/this link/);
        });
    });

    describe('sendPasswordReset', function () {

        beforeEach(function () {
            sendMail.reset();
        });

        it('should send an email', function () {
            mailer.sendPasswordReset({});
            expect(sendMail.called).to.be(true);
        });

        it('should be to the right recipient', function () {
            mailer.sendPasswordReset({
                username: 'blah@example.com'
            });
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.to).to.equal('blah@example.com');
        });

        it('should have the right sender', function () {
            mailer.sendPasswordReset({});
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.from).to.equal('password-reset@unitsofsound.com');
        });

        it('should have correct subject', function () {
            mailer.sendPasswordReset({});
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.subject).to.equal('Your new password has been reset.');
        });

        it('should show the right content', function () {
            mailer.sendPasswordReset({
                name: 'test-center',
                pw1: 'ugly penguin'
            });
            var sendOpts = sendMail.getCall(0).args[0];
            expect(sendOpts.html).to.match(/Your new password is : ugly penguin/);
        });
    });

});