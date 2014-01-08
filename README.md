tfs
=======

![logo](https://raw.github.com/fengmk2/tfs/master/logo.png)

[TFS: Taobao FileSystem](http://code.taobao.org/p/tfs/src/) nodejs client.

* [RESTful API](http://baike.corp.taobao.com/index.php/CS_RD/tfs/use_web_service)
* [Diagnose Tools](http://baike.corp.taobao.com/index.php/CS_RD/tfs/diagnose)

## Install

```bash
$ npm install tfs
```

## Usage

```js
var tfs = require('tfs');

// var client = tfs.createClient({
//   rootServer: '$host:port',
//   appkey: '$your_appkey',
//   imageServers: ['$your_server1', '$your_server2']
// });

// e.g.: test environment on tb daily
var client = tfs.createClient({
  rootServer: '$tfsdomain:$port',
  appkey: 'appkey',
  imageServers: [
    'img01.tfs.com',
    'img02.tfs.com'
  ]
});

// upload normal file
client.upload(filepath, function (err, info) {
  console.log(info);
  // {
  //   name: 'T2xRETBgZv1RCvBVdK.jpg',
  //   url: 'http://img1.tfs.com/tfscom/T2xRETBgZv1RCvBVdK.jpg',
  //   size: 1024
  // }
});

// upload file content buffer directly
client.upload(fs.readFileSync(filepath), '', function (err, info) {
  console.log(info);
  // {
  //   name: 'T1Pj9zXkRYXXXXXXXX',
  //   url: 'http://img1.tfs.com/tfscom/T1Pj9zXkRYXXXXXXXX',
  //   size: 5929
  // }
});

// upload a stream
client.upload(fs.createReadStream(filepath), 'jpg', function (err, info) {
  console.log(info);
  // {
  //   name: 'T2xRETBgZv1RCvBVdL.jpg',
  //   url: 'http://img1.tfs.com/tfscom/T2xRETBgZv1RCvBVdL.jpg',
  //   size: 1024
  // }
});

// upload custom name file
client.uploadFile(filepath, '320', 'foo.jpg', function (err, info) {
  console.log(info);
  // {
  //   name: 'L1/1/320/foo.jpg',
  //   url: 'http://img1.tfs.com/L1/1/320/foo.jpg',
  //   size: 1984
  // }
});

// upload private file, will not get by CDN
client.uploadPrivate(filepath, function (err, info) {
  console.log(info);
  // {
  //   name: 'T1XeRfXkBXXXXXXXXX.tfsprivate.jpg',
  //   size: 11779,
  //   url: 'http://img01.daily.taobaocdn.net/tfscom/T1XeRfXkBXXXXXXXXX.tfsprivate.jpg'
  // }
});
```

## API v1: 原生TFS

[原生TFS](http://baike.corp.taobao.com/index.php/CS_RD/tfs/use_web_service#.E5.8E.9F.E7.94.9FTFS)

```js
/**
 * Create TFS RESTFul client.
 *
 * @param {Object} options
 *  - {String} appkey
 *  - {String} [appLocation], default is 'tfscom'.
 *  - {Number} [uploadTimeout], upload max timeout, default is 60s.
 *  - {String} [rootServer], 'host:port' format, default is 'restful-store.vip.tbsite.net:3800'.
 *  - {Array} [imageServers], default is CDN online servers list.
 * @return {Client}
 */
function createClient(options);

/**
 * Upload a file.
 * @param {String|Buffer} filepath file path or file content buffer.
 * @param {String} extname. optional, if filepath is buffer or stream type, use this extname.
 * @param {Function(err, info)} callback
 *  - {Object} info
 *   - {String} name, tfs file name
 *   - {String} url, CDN url
 *   - {Number} size, file size
 * @param {Number} timeout, default is `client.uploadTimeout`.
 */
Client.prototype.upload = function (filepath, extname, callback, timeout);

/**
 * Remove a file by name.
 *
 * @param {String} name
 * @param {Object} [options]
 *  - {Number|String} hide, 1: hidden, 0: show
 * @param {Function(err, success)} callback
 * @param {Number} timeout, default is `client.uploadTimeout`.
 */
Client.prototype.remove = function (name, options, callback, timeout);

/**
 * Download a file by name.
 *
 * @param {String} name
 * @param {String|WriteStream} savefile, save file path or writable stream.
 * @param {Object} [options]
 *  - {Number} offset
 *  - {Number} size
 * @param {Function(err, success)} callback
 * @param {Number} timeout, default is `client.uploadTimeout`.
 */
Client.prototype.download = function (name, savefile, options, callback, timeout);

/**
 * Get file meta.
 * @param {String} name
 * @param {Object} [options]
 *  - {Number} type, 0: normal mode, 1: force mode, get meta info even it was deleted.
 * @param {Function(err, meta)} callback
 * @param {Number} timeout
 */
Client.prototype.getMeta = function (name, options, callback, timeout);
```

## API v2: 自定义文件名

[自定义文件名](http://baike.corp.taobao.com/index.php/CS_RD/tfs/use_web_service#.E8.87.AA.E5.AE.9A.E4.B9.89.E6.96.87.E4.BB.B6.E5.90.8D)

```js
/**
 * Get custom file meta.
 *
 * @param {String} uid user id
 * @param {String} filename custom file name
 * @param {Function(err, meta)} callback
 * @param {Number} timeout
 */
Client.prototype.getFileMeta = function (uid, filename, callback, timeout);

/**
 * Create a file.
 * @param {String} uid, user id
 * @param {[type]} filename, e.g.: 'foo/bar.jpg', 'foo.png'.
 * @param {Function(err, success)} callback
 * @param {Number} [timeout], request timeout
 */
Client.prototype.createFile = function (uid, filename, callback, timeout);

/**
 * Upload a file with custom filename.
 *
 * @param {String} filepath
 * @param {String} uid, user id
 * @param {String} filename
 * @param {Object} [options]
 *  - {Number} offset
 * @param {Function(err, info)} callback
 * @param {Number} [timeout]
 */
Client.prototype.uploadFile = function (filepath, uid, filename, options, callback, timeout);

/**
 * Download a file by custom name.
 *
 * @param {String} uid
 * @param {String} filename
 * @param {String|WriteStream} savefile, save file path or writable stream.
 * @param {Object} [options]
 *  - {Number} offset
 *  - {Number} size
 * @param {Function(err, success)} callback
 * @param {Number} timeout, default is `client.uploadTimeout`.
 */
Client.prototype.downloadFile = function (uid, filename, savefile, options, callback, timeout);

/**
 * Remove a custom name file.
 *
 * @param {String} uid
 * @param {String} filename
 * @param {Function(err, success)} callback
 * @param {Number} [timeout]
 */
Client.prototype.removeFile = function (uid, filename, callback, timeout);
```

## Events

* `ready`: If client init done, will `client.emit('ready')`.
* `error`: If client init error, will `client.emit('error', err)`. User must listen this event once, otherise node process will throw it.
* `refreshError`: If `refreshServers()` error, will `client.emit('refreshError', err)`.
* `servers`: If got new servers list, will `client.emit('servers', servers)`.

## Authors

```bash
$ git summary

 project  : tfs
 repo age : 1 year, 1 month
 active   : 19 days
 commits  : 52
 files    : 17
 authors  :
    34  苏千                  65.4%
    16  fengmk2                 30.8%
     2  不四                  3.8%
```

## License

(The MIT License)

Copyright (c) 2012 - 2013 fengmk2 &lt;fengmk2@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
