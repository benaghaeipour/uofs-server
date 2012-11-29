host = db.serverStatus().host;
prompt = function() {return db+"@"+host+"$ ";};
use dev;
db.auth('c9','c9');
db.logs.find();