var le = require('node-logentries').logger({token: process.env.LOG_TOKEN});

le.info('Deploying application v' + require('./package.json').version + ' from SHA:'+process.env.TRAVIS_COMMIT);

process.exit();
