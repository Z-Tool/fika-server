'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const category = new Schema({
  _id: String, // 分类Id ，同时也是分类名
  parent: {type: String, default: null},
  children: {type: Array, default: []},
  createTime: {type: Date},
  lastEditTime: {type: Date},
});
module.exports = mongoose.model('Category', category);
