'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const dict = new Schema({
  _id: String, // 字典Id ，同时也是分类名
  categories: {type: Array, default: []},
  createTime: {type: Date},
  lastEditTime: {type: Date},
});

module.exports = mongoose.model('Dictionary', dict);
