/*jslint node:true */
var pkg = require('./package.json');
var le = require('node-logentries').logger(pkg.env.LOG_TOKEN);

process.env.TRAVIS_COMMIT = process.env.TRAVIS_COMMIT || 'local';
le.info('Deploying application v' + pkg.version + ' from SHA:' + process.env.TRAVIS_COMMIT);

process.exit();
