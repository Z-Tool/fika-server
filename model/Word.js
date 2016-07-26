const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const word = new Schema({
  source: {type: String, default: 'unknow'}, //词库来源
  text: String, // 单词文字
  cate: String, // 分类
  subCate: String, // 子分类
  dict: String, // 字典名称
  py: String, // 拼音
  createTime: {type: Date},
  lastEditTime: {type: Date},
});

word.index({ text: 1, cate: 1, subCate: 1, dict: 1});
module.exports = mongoose.model('Word', word);
