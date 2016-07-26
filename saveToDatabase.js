'use strict';

const path = require('path');
const conn = require('./conn');
const PythonShell = require('python-shell');
const recursive = require('recursive-readdir');
const LIB_FOLDER = path.resolve(__dirname, './download');
const Word = require('./model/Word');
const Category = require('./model/Category');
const Dictionary = require('./model/Dictionary');
// connect to database
conn.connect();


recursive(LIB_FOLDER, function (err, files) {
  // Files is an array of filename
  files.reduce((promise, file) => {
    return promise.then(() => {
      if (/\.scel$/.test(file)) {
        return importFile(file);
      } else {
        return Promise.resolve();
      }
    });
  }, Promise.resolve(1)).then(() => {
    console.log('done');
  }, err => {
    console.log(err);
    conn.close();
  });
});

function importFile(file) {
  const fileInfoArr = file.split('/');
  const cateName = fileInfoArr[fileInfoArr.length - 2];
  const fileName = fileInfoArr[fileInfoArr.length - 1];
  const dictName = fileName.slice(0, fileName.lastIndexOf('.'));
  console.log(`正在入库 ${cateName} : ${dictName} ...`);
  return importCategory(cateName)
    .then(cate => {
      return importDictionary(dictName, cate._id);
    }, err => {
      console.log(err);
      throw err;
    });
}



function importCategory(cateName) {
  return new Promise((resolve, reject) => {
    Category.findById(cateName, (err, cate) => {
      if (err) {
        return reject(err);
      }
      if (!cate) {
        let category = {
          _id: cateName,
          createTime: new Date(),
          lastEditTime: new Date(),
        };
        Category.create(category, function (err, cate) {
          if (err) {
            reject(err);
          } else {
            resolve(cate);
          }
        });
      } else {
        resolve(cate);
      }
    });
  });
}



function importDictionary(dictName, cate) {
  return new Promise((resolve, reject) => {
    Dictionary.findById(dictName, (err, dict) => {
      if (err) {
        return reject(err);
      }
      if (!dict) {
        let dictObj = {
          _id: dictName,
          categories: [cate],
          createTime: new Date(),
          lastEditTime: new Date(),
        };
        Dictionary.create(dictObj, function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        resolve(dict);
      }
    });
  });
}
























// var options = {
//   mode: 'text',
//   pythonPath: 'path/to/python',
//   pythonOptions: ['-u'],
//   scriptPath: 'path/to/my/scripts',
//   args: ['value1', 'value2', 'value3']
// };
//
// PythonShell.run('my_script.py', options, function (err, results) {
//   if (err) throw err;
//   // results is an array consisting of messages collected during execution
//   console.log('results: %j', results);
// });
