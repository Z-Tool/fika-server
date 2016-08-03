'use strict';

const koa = require('koa');
const router = require('koa-router')();
const app = koa();
const conn = require('../conn');
const Word = require('../model/Word');
const Category = require('../model/Category');
const Dictionary = require('../model/Dictionary');
const _s = require('strman');
const BusinessError = require('./error/BusinessError.js');
const DEFAULT_SNAKE_SIZE = 10;
const DEFAULT_ASSOCIATE_SIZE = 1;
// connect to database
conn.connect();

/**
 * 词汇联想
 */
router.get('/associate', function*(next) {
  const query = this.query;
  const word = query.word;
  let size = query.size;
  size = size ? parseInt(size, 10) : DEFAULT_ASSOCIATE_SIZE;
  if (!word) {
    throw new BusinessError('args_required', 'need word params');
  }
  const lastChar = _s.last(word, 1);
  let words = yield randomWord({
    text: new RegExp('^' + lastChar),
  }, size);
  if (size === 1) {
    words = [words];
  }
  this.body = words.map(word => word.text);
});


/**
 * 词汇接龙
 */
router.get('/snake', function*(next) {
  const query = this.query;
  const words = [];
  let word = query.word;
  let size = query.size;
  size = size ? parseInt(size, 10) : DEFAULT_SNAKE_SIZE;
  if (!word) {
    word = yield randomWord();
    word = word.text;
  }
  words.push(word);
  let curWord = word;
  let index = 1;
  while(index++ < size) {
    const lastChar = _s.last(curWord, 1);
    const newWord = yield randomWord({
      text: new RegExp('^' + lastChar),
    });
    curWord = newWord.text;
    words.push(curWord);
  }
  this.body = words;
});

function randomWord(filter, size) {
  filter = filter || {};
  size = size || 1;
  return new Promise((resolve, reject) => {
    Word.aggregate({
      $match: filter,
    }).sample(size).exec((err, result) => {
      if (err) {
        reject(err);
      } else {
        if (size === 1) {
          resolve(result[0]);
        } else {
          resolve(result);
        }
      }
    });
  });
}

app.use(function*(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = {
      code: err.code,
      message: err.message
    };
    this.app.emit('error', err, this);
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3210);
