'use strict'
const _ = require('lodash');
const moment = require('moment');
const request = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

let finalData = {};
let url = [{'key': 'ifeng', 'url': 'https://news.ifeng.com/c/special/7tPlDSzDgVk'}, {
    'key': 'dingxiang',
    'url': 'https://3g.dxy.cn/newh5/view/pneumonia'
}];

async function init() {
    finalData['data'] = [];
    await getUrl('ifeng');
    console.info(finalData);
    process.exit();
}

init();

async function getUrl(urlKey = '') {
    let urlData = _.find(url, {'key': urlKey});
    let tmpUrl = urlData['url'];
    console.info("正在请求地址：" + JSON.stringify({tmpUrl}));
    const res = await request.get(tmpUrl);

    finalData = await ifeng(res);
    console.info(finalData);
    finalData = await getLocation(finalData);

    fs.writeFileSync(path.join(__dirname, './', 'now.json'), JSON.stringify(finalData));

    // console.info(fileFlag);
}

async function getLocation(data = {}) {
    for (let k in data['data']) {
        let city = data['data'][k]['name'] + "市";
        console.info(city);

        city = encodeURIComponent(data['data'][k]['name']);
        let baiduUrl = "https://api.map.baidu.com/geocoder?address=" + city + "&output=json&key=f247cdb592eb43ebac6ccd27f796e2d2";
        console.info(baiduUrl);
        const res = await request.get(baiduUrl);
        let bdData = JSON.parse(res.text);

        let lnglat = {'lnglat': []};
        console.info(bdData['result']['location']);
        lnglat['lnglat'][0] = bdData['result']['location']['lng'] + '';
        lnglat['lnglat'][1] = bdData['result']['location']['lat'] + '';
        data['data'][k]['lnglat'] = lnglat;
    }

    return data;
}

async function ifeng(domData = {}) {
    let scriptArr = [];
    let res = domData;

    const $ = cheerio.load(res.text, {decodeEntities: false});
    let domLi = $('script').each(function (i, elem) {
        let cou = $(this).html();
        scriptArr.push(cou);
    });

    // console.info(scriptArr[3]);

    let jsonString = scriptArr[3].replace("var allData =", "");
    jsonString = jsonString.replace(/^\s+|\s+$/g, "");
    jsonString = jsonString.substr(0, jsonString.length - 1);
    // console.info(jsonString);
    let jsonData = JSON.parse(jsonString);
    let gn = jsonData['modules'][1]['data'][1];
    let gw = jsonData['modules'][1]['data'][2]
    let gnData = await getDataGn(gn);
    let gwData = await getDataGn(gw);

    writeFinalData(gnData);
    writeFinalData(gwData);

    let fileName = moment().format("YYYY-MM-DD_HHmm") + ".json";
    let filePath = path.join(__dirname, './jsonData/', fileName);
    let fileFlag = fs.existsSync(filePath);
    if (!fileFlag) {
        fs.writeFileSync(filePath, jsonString);
    } else {
        console.info("文件已存在：" + JSON.stringify({filePath}));
    }

    return finalData;
}

async function writeFinalData(data) {
    for (let v of data) {
        let obj = {};
        obj['name'] = v['arr'][0];
        obj['value'] = 0;
        obj['remark'] = '';
        if (!_.isEmpty(v['arr'][1])) {
            obj['remark'] = v['arr'][1];
            if (v['arr'][1].indexOf('确诊') != -1) obj['value'] = v['num'][0] * 1;
        }

        finalData['data'].push(obj);
    }
}

async function getDataGn(gn) {
    // console.info(gn['articleList']);
    let returnData = [];
    let creatTimeStr = '';
    let d = gn['articleList'];
    for (let k in d) {
        let v = d[k];
        if (k == 0) continue;

        let str = v['title'];
        let creatTimeFlag = str.indexOf('数据更新时');
        if (creatTimeFlag != -1) {
            creatTimeStr = str;
            continue;
        }


        let arr = str.split(" ");
        // console.info(arr);

        let numStr = _.isEmpty(arr[1]) ? [] : arr[1].match(/\d+(.\d+)?/g);
        returnData.push({'arr': arr, 'num': numStr});
        // console.info(arr, numStr);
    }


    creatTimeStr = creatTimeStr.substr(8, 15);
    if (!_.isEmpty(creatTimeStr)) {
        finalData['creatTimeStr'] = creatTimeStr;
        // console.info(creatTimeStr);
    }
    return returnData;
}
