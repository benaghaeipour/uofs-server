/*jslint node:true*/
/*globals it, xit, describe, xdescribe, beforeEach, afterEach*/
'use strict';

var expect = require('expect');
var usersPositionInCourse = require('./usersPositionInCourse');
var exampleUser = require('../../example-user.json');

describe('usersPositionInCourse', function () {
  it('should calculate placed at lesson 5', function () {
    var positions = usersPositionInCourse(exampleUser.dictationSyllabus);
    expect(positions).toEqual({
      placed : 1,
      current: 5
    });
  });
});
