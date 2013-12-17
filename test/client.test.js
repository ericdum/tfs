/*!
 * tfs - test/client.test.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var fs = require('fs');
var urlparse = require('url').parse;
var path = require('path');
var tfs = require('../');
var should = require('should');
var mm = require('mm');
var http = require('http');
var pedding = require('pedding');

var TMPDIR = process.env.TMPDIR || '/tmp';

describe('client.test.js', function () {

  var tfsClient = tfs.createClient({
    appkey: 'tfscom',
    rootServer: 'restful-store.daily.tbsite.net:3800',
    imageServers: [
      'img01.daily.taobaocdn.net',
      'img02.daily.taobaocdn.net',
    ],
  });

  var logopath = path.join(path.dirname(__dirname), 'logo.png');

  afterEach(mm.restore);

  it('should throw missing appkey error', function () {
    (function () {
      tfs.createClient();
    }).should.throw('missing appkey');
  });

  it('should emit error when getAppid() error', function (done) {
    var tfsClientError = tfs.createClient({
      appkey: 'tfscom',
      rootServer: 'restful-store.daily.tbsite.net:3800',
      imageServers: [
        'img01.daily.taobaocdn.net',
        'img02.daily.taobaocdn.net',
      ],
    });
    mm.error(tfsClientError, 'getAppid');
    tfsClientError.on('error', function (err) {
      should.exists(err);
      err.message.should.equal('mm mock error');
      done();
    });
  });

  describe('upload()', function () {
    var client;
    before(function (done) {
      client = tfs.createClient({
        appkey: 'tfscom',
        rootServer: 'restful-store.daily.tbsite.net:3800',
        imageServers: [
          'img01.daily.taobaocdn.net',
          'img02.daily.taobaocdn.net',
        ],
      });
      client.once('servers', function (servers) {
        should.exist(servers);
        servers.length.should.above(0);
        done();
      });
    });

    it('should upload logo.png to tfs', function (done) {
      client.upload(logopath, function (err, info) {
        client.appid.should.equal('1');
        should.not.exist(err);
        info.should.have.keys('name', 'url', 'size');
        info.size.should.be.a('number');
        info.name.should.be.a('string').with.match(/\.png$/);
        info.url.should.be.a('string').with.match(/\.png$/);
        info.url.should.include('http://img01.daily.taobaocdn.net/tfscom/');

        client.refreshCounter = 1;
        // next upload will refresh servers
        client.upload(fs.createReadStream(logopath), 'png', function (err, info) {
          should.not.exist(err);
          info.should.have.keys('name', 'url', 'size');
          info.size.should.be.a('number');
          info.name.should.be.a('string').with.match(/\.png$/);
          info.url.should.be.a('string').with.match(/\.png$/);
          info.url.should.include('http://img02.daily.taobaocdn.net/tfscom/');

          client.upload(fs.readFileSync(logopath), 'png', function (err, info) {
            should.not.exist(err);
            info.should.have.keys('name', 'url', 'size');
            info.size.should.be.a('number');
            info.name.should.be.a('string').with.match(/\.png$/);
            info.url.should.be.a('string').with.match(/\.png$/);
            info.url.should.include('http://img01.daily.taobaocdn.net/tfscom/');
            done();
          });
        });
      });
    });

    it('should return mock server error', function (done) {
      var data = fs.readFileSync(path.join(__dirname, 'server_error.txt'));
      var headers = {
        server: 'Tengine/1.3.0',
        date: 'Wed, 14 Aug 2013 02:36:30 GMT',
        'content-type': 'text/html',
        'content-length': String(data.length),
        connection: 'close',
        statusCode: 500
      };
      mm.http.request(/\//, data, headers, 5);
      client.upload(logopath, function (err, info) {
        should.exist(err);
        err.name.should.equal('TFSServerError');
        err.status.should.equal(500);
        err.message.should.equal('TFS Server error: 500 Internal Server Error (tfs004043.sqa.cm4)');
        done();
      });
    });

    it('should upload txt content buffer with empty extname', function (done) {
      var content = fs.readFileSync(path.join(__dirname, 'test.txt'));
      client.upload(content, '', function (err, result) {
        should.not.exist(err);
        result.should.have.keys('name', 'size', 'url');
        result.size.should.equal(content.length);
        done();
      });
    });

    it('should upload jpg content buffer with empty extname', function (done) {
      var content = fs.readFileSync(path.join(__dirname, '1212.jpg'));
      client.upload(content, function (err, result) {
        should.not.exist(err);
        result.should.have.keys('name', 'size', 'url');
        result.url.should.match(/\.jpg$/);
        result.size.should.equal(content.length);
        done();
      });
    });

    it('should upload error', function (done) {
      mm.http.requestError(/\/v1\/tfscom/, 'mock request() error');
      client.upload(logopath, function (err, info) {
        should.exist(err);
        err.message.should.equal('mock request() error');
        should.not.exist(info);
        done();
      });
    });

    it('should upload 500 error', function (done) {
      mm.http.request(/\/v1\/tfscom/, fs.readFileSync(__filename), {});
      client.upload(logopath, function (err, info) {
        should.exist(err);
        err.message.should.include('Unexpected token');
        err.data.should.length(1024);
        should.not.exist(info);
        done();
      });
    });

    it('should upload error when file not exists', function (done) {
      mm.http.request(/\/v1\/tfscom/, new Buffer(''), {});
      client.upload(logopath + 'not-exists', function (err, info) {
        should.exist(err);
        err.message.should.include('ENOENT');
        should.not.exist(info);
        done();
      });
    });

    it('should upload timeout', function (done) {
      mm.http.request(/\/v1\/tfscom/, new Buffer('{}'), {}, 1000000);
      client.upload(logopath, function (err, info) {
        should.exist(err);
        err.message.should.include('timeout for 500ms');
        should.not.exist(info);
        done();
      }, 500);
    });

    it('should upload return wrong response', function (done) {
      mm.http.request(/\/v1\/tfscom/, new Buffer('{}'), {});
      client.upload(logopath, function (err, info) {
        should.exist(err);
        err.message.should.equal('TFS upload error');
        err.name.should.equal('TFSUploadError');
        should.not.exist(info);
        done();
      });
    });

  });

  describe('remove()', function () {

    it('should remove a exists file', function (done) {
      tfsClient.upload(logopath, function (err, info) {
        should.not.exist(err);
        info.should.have.keys('name', 'url', 'size');
        info.size.should.be.a('number');
        info.name.should.be.a('string').with.match(/\.png$/);
        info.url.should.be.a('string').with.match(/\.png$/);
        info.url.should.include('http://img01.daily.taobaocdn.net/tfscom/');
        var options = urlparse(info.url);
        var req = http.get(options, function (res) {
          res.should.status(200);
          res.should.header('Content-Type', 'image/png');
          tfsClient.remove(info.name, function (err, success) {
            should.not.exist(err);
            should.ok(success);
            setTimeout(function () {
              var options = urlparse(info.url);
              var req = http.get(options, function (res) {
                res.should.status(404);
                done();
              });
            }, 500);
          });
        });
      });
    });

    it('should remove not exists file success', function (done) {
      tfsClient.remove('T14H4cXilgXXXXXXXX.png', function (err, success) {
        should.not.exist(err);
        should.ok(success);
        done();
      });
    });

    it('should hide a file and show it, and delete it', function (done) {
      tfsClient.upload(logopath, function (err, info) {
        should.not.exist(err);
        var options = urlparse(info.url);
        var req = http.get(options, function (res) {
          res.should.status(200);
          res.should.header('Content-Type', 'image/png');
          // hide it
          tfsClient.remove(info.name, { hide: 1 }, function (err, success) {
            should.not.exist(err);
            should.ok(success);
            setTimeout(function () {
              var options = urlparse(info.url);
              var req = http.get(options, function (res) {
                res.should.status(404);
                // show it
                tfsClient.remove(info.name, { hide: 0 }, function (err, success) {
                  should.not.exist(err);
                  should.ok(success);
                  var options = urlparse(info.url);
                  var req = http.get(options, function (res) {
                    res.should.status(200);
                    res.should.header('Content-Type', 'image/png');

                    // delete it
                    tfsClient.remove(info.name, function (err, success) {
                      should.not.exist(err);
                      should.ok(success);

                      setTimeout(function () {
                        var options = urlparse(info.url);
                        var req = http.get(options, function (res) {
                          res.should.status(404);
                          done();
                        });
                      }, 500);

                    });

                  });
                });
              });

            }, 500);

          });
        });
      });
    });

    it('should return request error', function (done) {
      mm.http.requestError(/\/v1\/tfscom/, 'mock request() error');
      tfsClient.remove('T14H4cXilgXXXXXXXX.png', function (err, success) {
        should.exist(err);
        err.message.should.equal('mock request() error');
        should.not.exist(success);
        done();
      });
    });

  });

  describe('refreshServers()', function () {

    var client;

    before(function () {
      client = tfs.createClient({
        appkey: 'tfscom',
        rootServer: 'restful-store.daily.tbsite.net:3800'
      });
    });

    it('should get servers list from rootServer', function (done) {
      client.once('servers', function (servers) {
        client.refreshCounter.should.equal(99); // getAppid()
        servers.length.should.above(0);
        client.removeAllListeners();
        done();
      });
      client.once('refreshError', function (err) {
        throw err;
      });

      client.refreshServers();
      client.refreshServers(); // no problem
    });

    it('should emit refreshError', function (done) {
      mm.http.requestError('/tfs.list', 'mock request() error');

      client.once('servers', function (servers) {
        throw new Error('should not emit this event');
      });
      client.once('refreshError', function (err) {
        should.exist(err);
        err.message.should.equal('mock request() error');
        done();
      });

      client.refreshServers();
    });

    it('should emit refreshError when statusCode !== 200', function (done) {
      mm.http.request('/tfs.list', '', { statusCode: 404 });

      client.once('servers', function (servers) {
        throw new Error('should not emit this event');
      });
      client.once('refreshError', function (err) {
        should.exist(err);
        err.message.should.equal('Http Response 404');
        done();
      });

      client.refreshServers();
    });

    it('should not emit any events when rootServer return empty datas', function (done) {
      mm.http.request('/tfs.list', '');
      client.once('servers', function (servers) {
        throw new Error('should not emit servers');
      });
      client.once('refreshError', function (err) {
        throw err;
      });
      client.refreshServers();
      setTimeout(done, 500);
    });

    it('should not emit any events when rootServer return wrong datas', function (done) {
      mm.http.request('/tfs.list', 'foo\nbar\n1\n\n2\n3\n12312312');
      client.once('servers', function (servers) {
        throw new Error('should not emit servers');
      });
      client.once('refreshError', function (err) {
        throw err;
      });
      client.refreshServers();
      setTimeout(done, 500);
    });

  });

  it('should emit ready event', function (done) {
    done = pedding(2, done);

    var c = tfs.createClient({
      appkey: 'tfscom',
      rootServer: 'restful-store.daily.tbsite.net:3800',
      imageServers: [
        'img01.daily.taobaocdn.net',
        'img02.daily.taobaocdn.net',
      ],
    });
    c.on('ready', function () {
      should.ok(c.appid);
      done();
    });

    // check queue
    c.uploadFile(logopath, 320, 'logo.png', function (err, info) {
      should.not.exist(err);
      info.should.have.keys('url', 'name', 'size');
      info.name.should.equal('L1/1/320/logo.png');
      info.url.should.include('http://');
      info.url.should.include('L1/1/320/logo.png');
      done();
    });
  });

  describe('createFile()', function () {

    it('should create 320/foobar.png', function (done) {
      done = pedding(2, done);

      tfsClient.createFile(320, 'foobar.png', function (err, success) {
        should.not.exist(err);
        should.ok(success);
        done();
      });

      tfsClient.createFile('320', 'foobar.png', function (err, success) {
        should.not.exist(err);
        should.ok(success);
        done();
      });
    });

    it('should return error when uid wrong', function (done) {
      tfsClient.createFile('wrongid', 'foobar.png', function (err, success) {
        should.exist(err);
        err.name.should.equal('TFSRequestError');
        err.message.should.equal('TFS request error, Http status 400');
        err.data.should.include('400 Bad Request');
        done();
      });
    });

  });

  describe('uploadFile()', function () {

    it('should uploadFile 320/logo.png', function (done) {
      tfsClient.uploadFile(logopath, 320, 'logo.png', function (err, info) {
        should.not.exist(err);
        info.should.have.keys('url', 'name', 'size');
        info.name.should.equal('L1/1/320/logo.png');
        info.url.should.include('http://');
        info.url.should.include('L1/1/320/logo.png');

        var p2 = path.join(__dirname, '1212.jpg');
        tfsClient.uploadFile(p2, 1212, 'head.jpg', function (err, info) {
          should.not.exist(err);
          info.should.have.keys('url', 'name', 'size');
          info.name.should.equal('L1/1/1212/head.jpg');
          info.url.should.include('http://');
          info.url.should.include('L1/1/1212/head.jpg');
          done();
        });
      });
    });

    it('should return error when uid wrong', function (done) {
      tfsClient.uploadFile(logopath, 'wrongid', 'logo.png', function (err, info) {
        should.exist(err);
        err.name.should.equal('TFSRequestError');
        err.message.should.equal('TFS request error, Http status 400');
        err.data.should.include('400 Bad Request');
        should.not.exist(info);
        done();
      });
    });

    it('should return error when file not exists', function (done) {
      tfsClient.uploadFile(logopath + 'not exists', 'wrongid', 'logo.png', function (err, info) {
        should.exist(err);
        err.message.should.include('ENOENT');
        should.not.exist(info);
        done();
      });
    });

  });

  describe('getAppid()', function () {
    it('should return appid', function (done) {
      tfsClient.getAppid(function (err, appid) {
        should.not.exist(err);
        appid.should.equal('1');
        done();
      });
    });

    it('should return mock error', function (done) {
      mm.http.requestError('/v2/tfscom/appid', 'get appid error');
      tfsClient.getAppid(function (err, appid) {
        should.exist(err);
        err.name.should.equal('MockHttpRequestError');
        err.message.should.equal('get appid error');
        should.not.exist(appid);
        done();
      });
    });

    it('should return mock empty response', function (done) {
      mm.http.request('/v2/tfscom/appid', '{}');
      tfsClient.getAppid(function (err, appid) {
        should.exist(err);
        err.name.should.equal('TFSRequestError');
        err.message.should.equal('GET /v2/tfscom/appid return appid is empty');
        should.not.exist(appid);
        done();
      });
    });
  });

  describe('removeFile()', function () {
    it('should remove not exists file success or server error', function (done) {
      tfsClient.removeFile('320', 'noexists.jpg', function (err, success) {
        if (err) {
          err.name.should.equal('TFSServerError')
          err.message.should.equal('TFS Server error: Internal Server Error (unknow server)');
          err.status.should.equal(500);
        } else {
          should.not.exist(err);
          should.ok(success);
        }
        done();
      });
    });

    it('should return error when uid wrong', function (done) {
      tfsClient.removeFile('wronguid', 'noexists.jpg', function (err, success) {
        should.exist(err);
        err.message.should.equal('TFS request error, Http status 400')
        should.not.exist(success);
        done();
      });
    });

    it('should remove 320/logo.png', function (done) {
      tfsClient.uploadFile(logopath, 320, 'logo.png', function (err, info) {
        should.not.exist(err);
        info.should.have.keys('url', 'name', 'size');
        tfsClient.removeFile(320, 'logo.png', function (err, success) {
          should.not.exist(err);
          should.ok(success);
          done();
        });
      });
    });

  });

  describe('download()', function () {
    var name = null;
    before(function (done) {
      tfsClient.upload(logopath, function (err, info) {
        should.not.exist(err);
        should.exist(info);
        name = info.name;
        done();
      });
    });

    after(function (done) {
      tfsClient.remove(name, done);
    });

    it('should return success', function (done) {
      var tmpfile = path.join(TMPDIR, 'tfs_downloadfile');
      tfsClient.download(name, tmpfile, function (err, success) {
        should.not.exist(err);
        should.ok(success);
        fs.statSync(logopath).size.should.equal(fs.statSync(tmpfile).size);
        done();
      });
    });

    it('should work with offset and size', function (done) {
      var tmpfile = path.join(TMPDIR, 'tfs_downloadfile');
      tfsClient.download(name, tmpfile, { offset: 0, size: 100 }, function (err, success) {
        should.not.exist(err);
        should.ok(success);
        fs.statSync(tmpfile).size.should.equal(100);
        tfsClient.download(name, tmpfile, { offset: 100, size: 1000 }, function (err, success) {
          should.not.exist(err);
          should.ok(success);
          fs.statSync(tmpfile).size.should.equal(1000);
          done();
        });
      });
    });

    it('should download all data when size not set', function (done) {
      var tmpfile = path.join(TMPDIR, 'tfs_downloadfile');
      tfsClient.download(name, tmpfile, { offset: 0 }, function (err, success) {
        should.not.exist(err);
        should.ok(success);
        fs.statSync(logopath).size.should.equal(fs.statSync(tmpfile).size);
        done();
      });
    });

    it('should return error when name not exists file', function (done) {
      var tmpfile = path.join(TMPDIR, 'tfs_downloadfile');
      tfsClient.download('T1AjmyXgRfXXXXXXX.png', tmpfile, function (err, success) {
        should.exist(err);
        err.name.should.equal('TFSRequestError');
        err.status.should.equal(404);
        should.ok(!success);
        fs.readFileSync(tmpfile, 'utf8').should.include('404 Not Found');
        done();
      });
    });

  });

  describe('getMeta()', function () {
    var name = null;
    before(function (done) {
      tfsClient.upload(logopath, function (err, info) {
        should.not.exist(err);
        should.exist(info);
        name = info.name;
        done();
      });
    });

    after(function (done) {
      tfsClient.remove(name, function () {
        done();
      });
    });

    it('should return file info', function (done) {
      done = pedding(2, done);

      tfsClient.getMeta(name, function (err, meta) {
        should.not.exist(err);
        meta.should.have.keys('FILE_NAME', 'BLOCK_ID', 'FILE_ID',
          'OFFSET', 'SIZE', 'OCCUPY_SIZE', 'MODIFY_TIME', 'CREATE_TIME', 'STATUS', 'CRC');

        tfsClient.getMeta(name, { type: 1 }, function (err, meta) {
          should.not.exist(err);
          meta.should.have.keys('FILE_NAME', 'BLOCK_ID', 'FILE_ID',
            'OFFSET', 'SIZE', 'OCCUPY_SIZE', 'MODIFY_TIME', 'CREATE_TIME', 'STATUS', 'CRC');
          done();
        });

        tfsClient.getMeta(name, { type: 0 }, function (err, meta) {
          should.not.exist(err);
          meta.should.have.keys('FILE_NAME', 'BLOCK_ID', 'FILE_ID',
            'OFFSET', 'SIZE', 'OCCUPY_SIZE', 'MODIFY_TIME', 'CREATE_TIME', 'STATUS', 'CRC');
          done();
        });
      });
    });

    it('should return 404 error when name not exists', function (done) {
      tfsClient.getMeta('T1AjmyXgRfXXXXXXX.png', function (err, meta) {
        should.exist(err);
        err.name.should.equal('TFSRequestError');
        err.status.should.equal(404);
        should.not.exist(meta);
        done();
      });
    });

    it('should return json parse error', function (done) {
      mm.http.request(/\/v1\/tfscom/, new Buffer(''), {});
      tfsClient.getMeta(name, function (err, meta) {
        should.exist(err);
        err.name.should.equal('SyntaxError');
        err.message.should.equal('Unexpected end of input');
        should.not.exist(meta);
        done();
      });
    });

    it('should return meta after file delete', function (done) {
      done = pedding(3, done);
      tfsClient.remove(name, function (err, success) {
        should.not.exist(err);
        should.ok(success);
        setTimeout(function () {
          tfsClient.getMeta(name, function (err, meta) {
            should.exist(err);
            err.name.should.equal('TFSRequestError');
            err.status.should.equal(404);
            should.not.exist(meta);
            done();
          });

          tfsClient.getMeta(name, { type: 0 }, function (err, meta) {
            should.exist(err);
            err.name.should.equal('TFSRequestError');
            err.status.should.equal(404);
            should.not.exist(meta);
            done();
          });

          tfsClient.getMeta(name, { type: 1 }, function (err, meta) {
            should.not.exist(err);
            meta.should.have.keys('FILE_NAME', 'BLOCK_ID', 'FILE_ID',
              'OFFSET', 'SIZE', 'OCCUPY_SIZE', 'MODIFY_TIME', 'CREATE_TIME', 'STATUS', 'CRC');
            done();
          });
        }, 500);
      });
    });

  });

});