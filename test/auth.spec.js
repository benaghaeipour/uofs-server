/*jslint node:true*/
/*globals describe, it, beforeEach*/
'use strict';

var expect = require('expect');
var http =  require('http');
var proxyquire = require('proxyquire');

describe('auth', function () {

    var mocks, auth;

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
            },
            db: {
                users: {
                    findOne: function () {}
                },
                "@noCallThru": true
            }
        };

        auth = proxyquire('../auth', {
            "./db": mocks.db
        });
    });

    it('should allow sysadmins', function () {
        expect.spyOn(mocks, 'next');
        mocks.req.user.pass = 'lmZFGr19D6RP4SLx0rliV4IgiDHhTww27mxjDbsi/To=';
        auth(mocks.req, mocks.res, mocks.next);

        expect(mocks.next).toHaveBeenCalled();
    });

    it('should check req.user in the DB', function () {
        expect.spyOn(mocks.db.users, 'findOne');

        auth(mocks.req, mocks.res);

        expect(mocks.db.users.findOne).toHaveBeenCalled();
        var dbQuery = mocks.db.users.findOne.calls[0].arguments[0];
        expect(dbQuery.username).toBe('fred');
        expect(dbQuery.deleted.$exists).toBe(false);
    });

    it('should replace req.user with db result', function () {
        expect.spyOn(mocks.db.users, 'findOne');

        auth(mocks.req, mocks.res);

        var dbCallback = mocks.db.users.findOne.calls[0].arguments[2];
        dbCallback(null, [{type: 'teacher', pw1: 'blah blah'}]);

        expect(mocks.req.user.type).toBe('teacher');
    });

    it('should 401 if password is incorrect', function () {
        expect.spyOn(mocks.db.users, 'findOne');
        expect.spyOn(mocks.res, 'status');
        expect.spyOn(mocks.res, 'end');

        auth(mocks.req, mocks.res);

        var dbCallback = mocks.db.users.findOne.calls[0].arguments[2];
        dbCallback(null, [{type: 'teacher', pw1: 'not correct'}]);

        expect(mocks.res.status).toHaveBeenCalledWith(401);
        expect(mocks.res.end).toHaveBeenCalled();
    });

    it('should 404 if user is not found', function () {
        expect.spyOn(mocks.db.users, 'findOne');
        expect.spyOn(mocks.res, 'status');
        expect.spyOn(mocks.res, 'end');

        auth(mocks.req, mocks.res);

        var dbCallback = mocks.db.users.findOne.calls[0].arguments[2];
        dbCallback(null, []);

        expect(mocks.res.status).toHaveBeenCalledWith(404);
        expect(mocks.res.end).toHaveBeenCalled();
    });
});