'use strict';

angular.module('insight.blacklists')
.config(['$httpProvider', function($httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }

    // Answer edited to include suggestions from comments
    // because previous version of code introduced browser-related errors

    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    // extra
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
}])
    .controller('BlacklistsController',
  function ($scope, $rootScope, $routeParams, $http, Service, BlacklistService, Address) {
    // $scope.global = Global;
    // $scope.loading = false;

    console.log("blacklists controller start");

    // $scope.blacklists = BlacklistService.list();
    $scope.list = function () {
      BlacklistService.get({}, function (res) {
        console.log('res', res)
        if (res.code === 0) {
          for (var i in res.data) {
            res.data[i].nm_cmt = res.data[i].addr + res.data[i].comment;
          }
          $scope.blacklists = res.data;
        }
      });
    }
    $scope.list();

    $scope.bedit = true;

    // open add dialog----------------------------------------
    $scope.addMode = function () {
      $scope.isAdd = true;
    };

    // click dialog's add btn
    $scope.doAdd = function () {
      if (!$scope.newblacklist || !$scope.newblacklist.addr) {
        $scope.newblacklist = {addr:'地址不能为空'}
      // } else if ($scope.newblacklist.addr.length < 34
      // || $scope.newblacklist.addr.length > 35) {
      } else {
        // 验证地址的有效性
        Address.get({
            addrStr: $scope.newblacklist.addr
          },
          function(address) {
            $scope.saveBlacklist($scope.newblacklist);
          },
          function(e) {
            if (e.status === 400) {
              // $rootScope.flashMessage = 'Invalid Address: ' + $routeParams.addrStr;
              $scope.newblacklist.addr = '无效的地址'
            } else if (e.status === 503) {
              // $rootScope.flashMessage = 'Backend Error. ' + e.data;
              $scope.newblacklist.addr = '地址未找到'
            } else {
              // $rootScope.flashMessage = 'Address Not Found';
              $scope.newblacklist.addr = '地址未找到'
            }
          });
      }
    };

    // click dialog's cancel btn
    $scope.cancelAdd = function () {
      if (!$scope.newblacklist || !$scope.newblacklist.addr) {

      } else {
        $scope.newblacklist.addr = ''
        $scope.newblacklist.comment = ''
      }
      $scope.isAdd = false;
    };

    // click edit btn----------------------------------------
    $scope.editMode = function () {
      $scope.bedit = false;
    };

    // open edit dialog
    $scope.openEdit = function (addr, comment) {
      console.log('edit ',addr,'with cmt:',comment);
      $scope.editblacklist = {
        addr: addr,
        comment: comment
      };
      $scope.isEdit = true;
      console.log('edit ',$scope.editblacklist,'with switch:',$scope.isEdit);
    }

    // click dialog edit btn
    $scope.doEdit = function () {
      $scope.saveBlacklist($scope.editblacklist);
      $scope.isEdit = false;
    }

    // click dialog's cancel btn
    $scope.cancelEdit = function () {
      $scope.editblacklist.addr = ''
      $scope.editblacklist.comment = ''
      $scope.isEdit = false;
    };

    // click cancel btn----------------------------------------
    $scope.cancelMode = function () {
      angular.forEach($scope.blacklists, function (i) {
        i.checked = false;
      })
      $scope.checked = [];
      $scope.bedit = true;
      $scope.select_all = false;
    };

    $scope.checked = [];
    $scope.selectAll = function () {
      if (!$scope.select_all) {
        $scope.checked = [];
        angular.forEach($scope.blacklists, function (i) {
          i.checked = true;
          $scope.checked.push(i.addr);
        })
      } else {
        angular.forEach($scope.blacklists, function (i) {
          i.checked = false;
        })
        $scope.checked = [];
      }
      // console.log('Achecked:',$scope.checked);
    };
    $scope.selectOne = function (addr) {
      var index = $scope.checked.indexOf(addr);
      if (index === -1) {
        $scope.checked.push(addr);
      } else if (index !== -1) {
        $scope.checked.splice(index, 1);
      }

      if ($scope.blacklists.length === $scope.checked.length) {
        $scope.select_all = true;
      } else {
        $scope.select_all = false;
      }
      // console.log('1checked:',$scope.checked);
    }

    // click delete btn
    $scope.delMode = function () {
      // console.log('$scope.checked=',$scope.checked)
      if (!$scope.checked || $scope.checked.length === 0) {
        return;
      }
      $scope.isDel = true
    }
    // click dialog delete btn
    $scope.doDel = function (ok) {

      if (!ok) {
        $scope.isDel = false
        return;
      }

      $http.delete(Service.apiPrefix + '/blacklist/list/' + JSON.stringify($scope.checked))
        .success(function(data, status, headers, config) {
          if (data.code === 0) {
            $scope.list();
          }
        })
        .error(function(data, status, headers, config) {
        });

      $scope.isDel = false
    }

    $scope.saveBlacklist = function (blacklist) {
      // BlacklistService.save($scope.newblacklist);

      // console.log('$scope.newblacklist.addr=',$scope.newblacklist.addr)
      // console.log('$scope.newblacklist.comment=',$scope.newblacklist.comment)

      // console.log($scope.bedit,'SAVE: ',$scope.newblacklist)

      // $scope.status = 'loading';
      if ($scope.isEdit) {
        $http.patch(Service.apiPrefix + '/blacklist/' + blacklist.addr,
          blacklist)
          .success(function(data, status, headers, config) {
            if (data.code === 0) {
              $scope.list();
            }
            $scope.editblacklist = {}
          })
          .error(function(data, status, headers, config) {
          });

        // console.log("after edit list=", $scope.blacklists);
      } else {
        $http.post(Service.apiPrefix + '/blacklist', blacklist)
          .success(function(data, status, headers, config) {
            if (data.code === -202) {
              $scope.newblacklist.addr = '地址已存在'
            } else if (data.code === 0) {
              $scope.list();
              $scope.newblacklist = {}
              $scope.isAdd = false;
            }
          })
          .error(function(data, status, headers, config) {
          });
      }

      // $scope.newblacklist = {};
      $scope.bedit = true;
    };

    // form delete.(old)
    $scope.delete = function (hash) {
      // console.log('controller,delete hash=', hash)

      // console.log($scope.newblacklist != {})
      // console.log($scope.newblacklist)


      if ($scope.newblacklist != {}
        && $scope.newblacklist !== undefined
        && $scope.newblacklist.addr === hash) {
        $scope.newblacklist = {};
      }
      // BlacklistService.delete(id);
      $http.delete(Service.apiPrefix + '/blacklist/' + hash)
        .success(function(data, status, headers, config) {
          if (data.code === 0) {
            $scope.list();
          }
          $scope.newblacklist = {}
        })
        .error(function(data, status, headers, config) {
        });

      $scope.bedit = true;
      // $scope.blacklists = BlacklistService.list();
      // console.log("after dellete list=", $scope.blacklists);
    };

    // unused
    function parseParams (params) {
      var str = [];
      for (var o in params)
        str.push(encodeURIComponent(o) + "=" + encodeURIComponent(params[o]));
      return str.join("&");
    }

    // form eitd.(old)
    $scope.edit = function (hash, bz) {
      $scope.newblacklist = {
        addr: hash,
        comment: bz
      };
      $scope.bedit = false;
      // $scope.blacklists = BlacklistService.list();
    };

    $scope.params = $routeParams;

  });
