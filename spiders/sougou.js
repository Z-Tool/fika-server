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
const mkdirp = require('mkdirp');
let errrCount = 0;
let totalCount = 0;
let errorFiles = [];

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

function downloadAllCategories() {
  function getCategory(link) {
    let pageLinks = [link];
    let pageurlTpl;
    let title;
    let categoryFolder;
    function extractPageLink($) {
      let $pages = $('#dict_page_list ul li a');
      let pageNum;
      let len = $pages.length - 1;
      if (len > 1 ) {
        const href = $pages.eq(len - 1).attr('href');
        if (href) {
          pageurlTpl = href;
          pageNum = parseInt(/\d+$/i.exec(pageurlTpl)[0], 10);
        }
        if (pageurlTpl) {
          if (pageNum) {
            let i = 2;
            while(i <= pageNum) {
              pageLinks.push(toUrl(pageurlTpl.replace(/\d+$/i, i)));
              i++;
            }
          }
        }
      };
    }

    function extractDownloadLins($) {
      let libs = [];
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
      return libs;
    }
    return request.get(link)
           .then(res => {
            const $ = cheerio.load(res.text);
            extractPageLink($);
            let otitle = $('title').text();
            title = otitle.slice(0, otitle.lastIndexOf('_'));
            let totalStr = $('#dict_detail_list .dict_cate_title_block .cate_title').text();
            let t = /有(\d+)个词/.exec(totalStr);
            if (t && t[1]) {
              t = parseInt(t[1], 10);
              totalCount += t;
              console.log(t);
            }
            console.log(`爬取词库:${title}, ${totalStr}`);
            console.log(`一共有:${pageLinks.length}页`);
            categoryFolder = path.resolve(downloadFolder, title);
            mkdirp.sync(categoryFolder);
           })
           .then(() => {
             return pageLinks.reduce( (promise, pgLink, index) => {
                return promise.then( () => {
                  console.log(`[下载第${index + 1} 页] ${pgLink}`);
                  return request.get(pgLink)
                  .then( res => {
                    if (res.text) {
                     let downloadLinks;
                     const $ = cheerio.load(res.text);
                     downloadLinks = extractDownloadLins($);
                     return downloadLinks.reduce((promise, lib) => {
                      let filePath = path.resolve(categoryFolder, (lib.title + '.scel').replace(/[/\/:*?"<>|= ]/ig, ''));
                       return promise.then( () => {
                          return downloadFile(filePath, lib.dlLink)
                          .then( () => {
                            console.log(`下载文件到${filePath}成功`);
                          }, (err) => {
                            errrCount += 1;
                            console.log(`下载文件到${filePath}失败`);
                            errorFiles.push(lib.dlLink);
                          });
                       });
                     }, Promise.resolve())
                   }
                  }, (err) => {
                    console.log(err.message);
                    console.log(err.stack);
                  }).then( () => {
                    console.log(`${title}的第[${index + 1}页]下载成功`);
                  });
                });
             }, Promise.resolve())
             .then( () => {
                  console.log(`${title}下载完成 total: ${totalCount} error: ${errrCount}`);
              }).catch(err => {
                console.log('[getCategory error]');
                console.log(err);
                console.log(err.message);
                console.log(err.stack);
              });
           });
  }
  return categories.reduce((promise, categoryLink) => {
    return promise.then( () => getCategory(categoryLink));
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
    .then(downloadAllCategories)
    .then( (obj) => {
      console.log(`爬取结束 ${totalCount} ${errrCount}`);
      console.log(errorFiles);
    })
    .catch(err => {
      console.log(err);
      console.log(err.message);
      console.log(err.stack);
    });
}

exports.start = () => {
  crawl();
}


function downloadFile(filePath, link) {
  console.log(`[下载文件] ${link} 到 ${filePath} 中`);
  return new Promise( (resolve, reject) => {
    try {
      let file = fs.createWriteStream(filePath);
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
      let request = http.request(options, function(response) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if(responseSent)  return;
            responseSent = true;
            resolve();
          });
        });
      });
      request.on('error', err => {
          if(responseSent)  return;
          responseSent = true;
          console.log(err);
          console.log(err.message);
          console.log(err.stack);
          reject(err);
      });
      request.end();
    }
    catch(e) {
      reject(err);
    }
  });
}
