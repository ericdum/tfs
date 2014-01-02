/*!
 * tfs - demo/buyerstory.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var path = require('path');
var tfs = require('../');

var client = tfs.createClient({
  rootServer: '$domain:$port',
  appkey: 'appkey',
  imageServers: [
    'img01.daily.taobaocdn.net',
    'img02.daily.taobaocdn.net'
  ]
});

client.on('servers', function (servers) {
  console.log(servers);
});

client.on('refreshError', function (err) {
  throw err;
});

var logopath = path.join(path.dirname(__dirname), 'logo.png');

// client.uploadFile(logopath, '320', 'tfs.png', function (err, info) {
//   console.log('uploadFile info: %j', info);
//   client.getMeta(info.name, function (err, meta) {
//     console.log(err)
//     console.log('uploadFile meta: %j', meta);
//   });
// });

client.upload(logopath, function (err, info) {
  console.log('upload info: %j', info);
  client.getMeta(info.name, function (err, meta) {
    // console.log(err)
    console.log('upload meta: %j', meta);
  });
});
