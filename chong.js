var http = require('http');
var Then = require('thenjs');
var BufferHelper = require('bufferhelper');
var fs = require('fs');
var cheerio = require('cheerio'); // Html分析模块
var iconv = require('iconv-lite'); // 字符转码模块
var pageUrl = []; //Url集合
var pagesHtml = []; //所有Url获取的Html的集合
var baseUrl = 'http://www.runoob.com';

main();

function main() {
    console.log('Start');
    Then(cont => {
        grabPageAsync(baseUrl, cont)
    }).then((cont, html) => {
        var $ = cheerio.load(html);
        var $html = $('.codelist.codelist-desktop.cate1');
        var $aArr = $html.find('a');
        $aArr.each((i, u) => {
            pageUrl.push('http:' + $(u).attr('href'));
        })
        everyPage(cont);
    }).fin((cont, error, result) => {
        console.log(error ? error : JSON.stringify(result));
        console.log('End');
    })
}

//爬去每个Url
function everyPage(callback) {
    Then.each(pageUrl, (cont, item) => {
        grabPageAsync(item, cont);
    }).then((cont, args) => {
        pagesHtml = args;
        createHtml(cont);
    }).fin((cont, error, result) => {
        callback(error, result);
    })
}

//创建Html文件
function createHtml(callback) {
    Then.each(pagesHtml, (cont, item, index) => {
        var name = pageUrl[index].substr(pageUrl[index].lastIndexOf('/') + 1);
        fs.writeFile(__dirname + '/grapHtml/' + name, item, function(err) {
            err ? console.error(err) : console.log('写入成功：' + name);
            cont(err, index);
        });
    }).fin((cont, error, result) => {
        callback(error, result);
    })
}

// 异步爬取页面HTML 
function grabPageAsync(url, callback) {
    http.get(url, function(res) {
        var bufferHelper = new BufferHelper();
        res.on('data', function(chunk) {
            bufferHelper.concat(chunk);
        });
        res.on('end', function() {
            console.log('爬取 ' + url + ' 成功');
            var fullBuffer = bufferHelper.toBuffer();
            var utf8Buffer = iconv.decode(fullBuffer, 'UTF-8');
            var html = utf8Buffer.toString()
            callback(null, html);
        });
    }).on('error', function(e) {
        // 爬取成功
        callback(e, null);
        console.log('爬取 ' + url + ' 失败');
    });
}