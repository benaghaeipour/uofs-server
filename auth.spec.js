/*jslint node:true*/
/*globals describe, it, beforeEach*/

var expect = require('expect');
var http =  require('http');
var auth = require('./auth');

describe('auth', function () {
    'use strict';

    var mocks;

    beforeEach(function () {
        process.env.SYSADMIN_KEY = 'testing';

        mocks = {
            next: function () {},
            req: {
                user: {
                    name: 'fred',
                    pass: 'blah blah'
                }
            },
            res: {
                status: function () {},
                end: function () {}
            }
        };
    });

    it('should allow sysadmins', function () {
        expect.spyOn(mocks, 'next');
        mocks.req.user.pass = '9666451abd7d0fa44fe122f1d2b9625782208831e14f0c36ee6c630dbb22fd3a';
        auth(mocks.req, mocks.res, mocks.next);

        expect(mocks.next).toHaveBeenCalled();
    });

    it('should reject everyone', function () {
        expect.spyOn(mocks.res, 'status');
        expect.spyOn(mocks.res, 'end');
        auth(mocks.req, mocks.res, mocks.next);

        expect(mocks.res.status).toHaveBeenCalledWith(401);
        expect(mocks.res.end).toHaveBeenCalled();
    });
});