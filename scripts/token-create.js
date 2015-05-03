var crypto = require('crypto');

if (!process.env.SYSADMIN_KEY) {
    console.error('No SYSADMIN_KEY');
    process.exit(1);
}

var hash = crypto.createHmac('sha256', process.env.SYSADMIN_KEY);

console.log(hash.update(process.argv[2]).digest('base64'));