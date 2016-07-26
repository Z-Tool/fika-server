'use strict';

const path = require('path');
const fs = require('fs');
const conn = require('./conn');
const PythonShell = require('python-shell');
const recursive = require('recursive-readdir');
const LIB_FOLDER = path.resolve(__dirname, './download');
const Word = require('./model/Word');
const Category = require('./model/Category');
const Dictionary = require('./model/Dictionary');
const readline = require('readline');
// connect to database
conn.connect();


// recursive(LIB_FOLDER, function (err, files) {
//   // Files is an array of filename
//   files.reduce((promise, file) => {
//     return promise.then(() => {
//       if (/\.scel$/.test(file)) {
//         return importFile(file);
//       } else {
//         return Promise.resolve();
//       }
//     });
//   }, Promise.resolve(1)).then(() => {
//     console.log('done');
//     process.exit(0);
//   }, err => {
//     console.log(err);
//     conn.close();
//     process.exit(0);
//   });
// });

function importFile(file) {
  const fileInfoArr = file.split('/');
  const cateName = fileInfoArr[fileInfoArr.length - 2];
  const fileName = fileInfoArr[fileInfoArr.length - 1];
  const dictName = fileName.slice(0, fileName.lastIndexOf('.'));

  return importCategory(cateName)
    .then(cate => {
      return importDictionary(dictName, cate._id);
    }).then(() => {
      return parseScelFile();
    }).then(() => {
      return importTxt();
    }).then(() => {
      console.log(`正在入库 ${cateName} : ${dictName} 成功`);
    }, (err) => {
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


function importWord(word, source, cateId, dictId) {
  return new Promise((resolve, reject) => {
    Word.create({
      source: source,
      text: word.text, // 单词文字
      cate: cateId, // 分类
      dict: dictId, // 字典名称
      py: word.py, // 拼音
      createTime: new Date(),
      lastEditTime: new Date(),
    }, (err, word) => {
      if (err) {
        reject(err);
      } else {
        resolve(word);
      }
    });
  });
}

function importTxt() {
  let lines = [];
  let lineReader = readline.createInterface({
    input: fs.createReadStream('./sougou.txt')
  });

  lineReader.on('line', function (line) {
    const word = getWord(line);
    lineReader.pause();
    importWord(word).then( () => {
      lineReader.resume();
    }, (err) => {
      console.log(err);
      throw err;
    });
  });

  lineReader.on('close', function() {
    resolve();
  });
}

function parseScelFile(filePath) {
  return new Promsie((resolve, reject) => {
    var options = {
      args: [filePath]
    };
    PythonShell.run('toTxt.py', options, function (err, results) {
      if (err) {
        return reject (err);
      }
      resolve(results);
    });
  });
}
