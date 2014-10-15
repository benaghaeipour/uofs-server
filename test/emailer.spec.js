/*jshint node:true*/
/*globals expect, jasmine, it, xit, describe, xdescribe, beforeEach, afterEach*/

var proxyquire = require('proxyquire'),
    sendMail = jasmine.createSpy('sendMail'),
    createTransport = jasmine.createSpy('createTransport'),
    sendPasswordReset = jasmine.createSpy('sendPasswordReset'),
    mailer = proxyquire('../emailer', {
        nodemailer: {
            createTransport: createTransport.and.returnValue({
                sendMail: sendMail
            }),
            sendPasswordReset: sendPasswordReset.and.returnValue({
                sendMail: sendMail
            })
        }
    });

describe('emailer', function () {

    it('should expose a consistant API', function () {
        expect(mailer.sendPasswordReset).toBeDefined();
        expect(mailer.sendCenterCreate).toBeDefined();
    });

    it('should set up a transport', function () {
        expect(createTransport).toHaveBeenCalled();
    });

    describe('sendCenterCreate', function () {

        beforeEach(function () {
            sendMail.calls.reset();
        });

        it('should send an email', function () {
            mailer.sendCenterCreate({});
            expect(sendMail).toHaveBeenCalled();
        });

        it('should be to the right recipient', function () {
            mailer.sendCenterCreate({
                mainContact: 'blah@example.com'
            });
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.to).toEqual('blah@example.com');
        });

        it('should have the right sender', function () {
            mailer.sendCenterCreate({});
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.from).toEqual('setup-assitant@unitsofsound.com');
        });

        it('should have correct subject', function () {
            mailer.sendCenterCreate({});
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.subject).toEqual('Your new Uints of Sound center.');
        });

        it('should show the right content', function () {
            mailer.sendCenterCreate({
                name: 'test-center'
            });
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.html).toMatch(/test-center/);
            expect(sendOpts.html).toMatch(/created/);
            expect(sendOpts.html).toMatch(/you as the main contact/);
        });
    });

    describe('sendPasswordReset', function () {

        beforeEach(function () {
            sendMail.calls.reset();
        });

        it('should send an email', function () {
            mailer.sendPasswordReset({});
            expect(sendMail).toHaveBeenCalled();
        });

        it('should be to the right recipient', function () {
            mailer.sendPasswordReset({
                username: 'blah@example.com'
            });
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.to).toEqual('blah@example.com');
        });

        it('should have the right sender', function () {
            mailer.sendPasswordReset({});
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.from).toEqual('setup-assitant@unitsofsound.com');
        });

        it('should have correct subject', function () {
            mailer.sendPasswordReset({});
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.subject).toEqual('Your new password has been reset.');
        });

        it('should show the right content', function () {
            mailer.sendPasswordReset({
                name: 'test-center'
            });
            var sendOpts = sendMail.calls.argsFor(0)[0];
            expect(sendOpts.html).toMatch(/Your new password is/);
        });
    });

});