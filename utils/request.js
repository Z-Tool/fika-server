'use strict'
const net = require('superagent');

function get(url, query) {
  return new Promise((resolve, reject) => {
    console.log(`[GET] ${url}`);
    net.get(url)
       .query(query)
       .end(function(err, res){
         if (err) {
           return reject(err);
         }
         resolve(res);
       });
  });
}

module.exports = {
  get: get
}
