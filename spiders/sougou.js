'use strict';
const cheerio = require('cheerio');
const request = require('../utils/request');
const path = require('path');
const host = 'http://pinyin.sogou.com'
const Uri = require('simple-uri');
// 起始url
const zeroUrl = '/dict/cate/index';
const urlMap = {};
const categories = [];
const dictionaries = [];
const http = require('http');
const fs = require('fs');
const downloadFolder = path.resolve(process.cwd(), './download');

function pushToArr(arr, url) {
  if (url && typeof url === 'string') {
    arr.push(url);
  }
}

function toUrl(url) {
  return `${host}${url}`;
}

function getCategory() {
  console.log('[步骤1] 获取搜狗输入法词库目录');
  return request
    .get(toUrl(zeroUrl))
    .then(res => {
      if (res.text) {
        let arr = [];
        const $ = cheerio.load(res.text);
        const $nav = $('#dict_nav_list li a');
        console.log($('title').text());
        $nav.each((index, el) => {
          arr.push($(el).attr('href'));
        });
        return arr;
      }
    }, (err) => {
      console.log(err);
    });
}

function getDictionaries() {
  function getDict(link) {
    return request.get(link)
           .then(res => {
             if (res.text) {
               let libs = [];
               const $ = cheerio.load(res.text);
               console.log(`爬取词库:${$('title').text()}, ${$('#dict_detail_list .dict_cate_title_block .cate_title').text()}`);
               const $dicList = $('#dict_detail_list .dict_detail_block');
               $dicList.each((i, el) => {
                 const $el = $(el);
                 const title = $el.find('.detail_title').text();
                 const dlLink = $el.find('.dict_dl_btn a').attr('href');
                 let official = false;
                 if (title.indexOf('官方推荐')) {
                   official = true;
                 }
                 libs.push({
                   title,
                   dlLink,
                   official
                 });
               });
               return libs.reduce((promise, lib) => {
                 return promise.then( () => downloadFile(lib.title + '.scel', lib.dlLink));
               }, Promise.resolve())
               .then( () => {
                 console.log('下载完成');
               });
             }
           });
  }
  return categories.reduce((promise, val) => {
    return promise.then( () => getDict(val));
  }, Promise.resolve());
}

function crawl() {
  console.log('爬取搜狗输入法词库');
  getCategory()
    .then((category) => {
      category.forEach( link => {
        pushToArr(categories, toUrl(link));
      });
    })
    .then(getDictionaries)
    .then( (obj) => {
      console.log('爬取结束');
    })
    .catch(err => {
      console.log(err);
    });
}

exports.start = () => {
  crawl();
}


function downloadFile(filename, link) {
  let filePath = path.resolve(downloadFolder, filename);
  console.log(`下载 ${filename} 地址：${link}`);
  let file = fs.createWriteStream(filePath);
  return new Promise( (resolve, reject) => {
    let responseSent = false;
    let uri = new Uri(link);
    let options = {
      hostname: uri.host,
      port: 80,
      method: 'GET',
      path: uri.relative,
      headers: {
        'Upgrade-Insecure-Requests': 1,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'http://pinyin.sogou.com/dict/cate/index/160?rf=dictindex',
        'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept-Language': 'en,zh-CN;q=0.8,zh;q=0.6,en-US;q=0.4,ru;q=0.2,fr;q=0.2,ja;q=0.2,zh-TW;q=0.2,ko;q=0.2,vi;q=0.2,id;q=0.2,ms;q=0.2',
        'Cookie': 'ssuid=9980485630; sct=2; LSTMV=1016%2C175; LCLKINT=309995; CXID=4408FAF51F4615A3BFDA53AFBDD3A42D; SUV=1454078435487117921270607; ad=Qw47ykllll2qKoU7lllllVNiVeUlllllWkCUvkllllUllllllZlll5@@@@@@@@@@; SUID=2202960E7E23900A00000000544ADED8; SMYUV=1468131514244211; redref=https://www.google.com/; IPLOC=CN4401',
      },
    }
    console.log(options);
    let request = http.request(options, function(response) {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          if(responseSent)  return;
          responseSent = true;
          console.log(`下载文件到${filePath}成功`);
          resolve();
        });
      });
    });
    request.on('error', err => {
        if(responseSent)  return;
        responseSent = true;
        console.log(err);
        reject(err);
    });
    request.end();
  });
}
