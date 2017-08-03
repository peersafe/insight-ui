'use strict';

function finddb(k, cb) {
    var arr = [];
    ldb.find(k, function (key, value) {
        if (key === null) {
            console.log("find Over @", value, " arr=", arr);
            return cb(arr);
        }
        if (key.startsWith(k)) {
            arr.push(JSON.parse(value));
        }
        // console.log(arr.length, ':find ok: ', arr);
    });
}

angular.module('insight.blacklists')
  .factory('Blacklist',
    function($resource, Api) {
      console.log('Blacklist single service get start');
    return $resource(Api.apiPrefix + '/blacklist/:blacklistHash', {
      blacklistHash: '@blacklistHash'
    }, {
      get: {
        method: 'GET',
        interceptor: {
          response: function (res) {
            return res.data;
          },
          responseError: function (res) {
            if (res.status === 404) {
              return res;
            }
          }
        }
      }
    });
  })
  .factory('Blacklists',
    function($resource, Api) {
        console.log('Blacklists service get start');
        var ldb = require('./leveldb');
        var k = 'blacklist';
        var blacklists = [];

        ldb.find(k, function (key, value) {
            if (key === null) {
                console.log("find Over @", value, " arr=", blacklists);
                return blacklists;
            }
            if (key.startsWith(k)) {
                blacklists.push(JSON.parse(value));
            }
            // console.log(arr.length, ':find ok: ', arr);
        });
  });
