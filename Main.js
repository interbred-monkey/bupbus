/*global __base*/
/*global __logging*/

global.__base = __dirname;

require('dotenv').config();
const fs      = require('fs'),
      Db      = require(`${__base}/Common/DbDrivers/MongoDB.js`),
      Logging = require(`${__base}/Common/Logging.js`);

global.__formatError  = require(`${__base}/Common/FormatError.js`);
global.__db           = new Db();
global.__logging      = new Logging();

if (fs.existsSync(`${__base}/art.txt`)) {

  process.stdout.write(`\n${fs.readFileSync(`${__base}/art.txt`, 'utf-8').toString()}\n`);

}

let PubSub = require(`${__base}/PubSub/Startup.js`);
new PubSub().Start()
.catch( (e) => {

  __logging.error(e);
  throw e;

});