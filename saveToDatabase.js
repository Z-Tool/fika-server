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
const exec = require('child_process').exec;
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
    process.exit(0);
  }, err => {
    console.log(err);
    conn.close();
    process.exit(0);
  });
});

function importFile(file) {
  const fileInfoArr = file.split('/');
  const cateName = fileInfoArr[fileInfoArr.length - 2];
  const fileName = fileInfoArr[fileInfoArr.length - 1];
  const dictName = fileName.slice(0, fileName.lastIndexOf('.'));

  return importCategory(cateName)
    .then(cate => {
      return importDictionary(dictName, cate._id);
    }).then((res) => {
      return parseScelFile(file).then(function (results) {
        console.log(results);
        return importTxt(res.category, res.dictionary);
      });
    }).then(() => {
      console.log(`入库 ${cateName} : ${dictName} 成功`);
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
            resolve({
              category: cate,
              dictionary: res._id,
            });
          }
        });
      } else {
        resolve({
          category: cate,
          dictionary: dict._id,
        });
      }
    });
  });
}


function importWord(word, source, cateId, dictId) {
  return new Promise((resolve, reject) => {
    if (!word) {
      return resolve();
    }
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

function importTxt(cate, dict) {
  return new Promise((resolve, reject) => {
    let lines = [];
    let lineReader = readline.createInterface({
      input: fs.createReadStream('./sougou.txt')
    });

    lineReader.on('line', function (line) {
      const word = getWord(line);
      lineReader.pause();
      importWord(word, 'sougou', cate, dict).then( (word) => {
        console.log('word import success', word.text);
        lineReader.resume();
      }, (err) => {
        console.log(err);
        throw err;
      });
    });

    lineReader.on('close', function() {
      resolve();
    });
  });
}

function getWord(line) {
  if (!line) { return; }
  const tmp = line.split(/\s/);
  return {
    py : tmp[1].match(/{{(.+?)}}/)[1].trim(),
    text: tmp[2].match(/{{(.+?)}}/)[1].trim(),
  };
}



function parseScelFile(filePath) {
  console.log(filePath);
  const cmd = `python ./toTxt.py ${filePath}`;
  console.log(`command: ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(cmd, function(error, stdout, stderr) {
      if (error) {
        return reject(error);
      }
      resolve(stdout);
    });
  });
}
