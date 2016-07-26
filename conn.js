'use strict';
let conf = require('./config.json').conn;
function connect() {
  let mongoose = require('mongoose');
  let mongoAdmin = conf.admin;
  let mongoPwd = conf.pwd;
  let mongoServer = conf.host + ':' + (conf.port || '27017') + '/' + (conf.dbName);
  ;
  let dbUrl;
  if (mongoAdmin && mongoServer) {
    dbUrl = 'mongodb://' + mongoAdmin + ':' + mongoPwd + '@' + mongoServer;
  } else {
    dbUrl = 'mongodb://' + mongoServer;
  }
  console.log('连接数据库dbUrl:' + dbUrl);
  mongoose.connect(dbUrl);
  let db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('database connetction open!');
  });
};

function close() {
  console.log('关闭数据库');
  mongoose.connection.close()
}

module.exports = {
  connect,
  close,
};
