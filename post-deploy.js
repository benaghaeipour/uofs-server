var pkg = require('./package.json');
var le = require('node-logentries').logger(pkg.process.env.LOG_TOKEN);

le.info('Deploying application v' + pkg.version + ' from SHA:' + process.env.TRAVIS_COMMIT);

process.exit();
