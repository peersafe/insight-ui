// Source: public/src/js/app.js
var defaultLanguage = localStorage.getItem('insight-language') || 'zh';
var defaultCurrency = localStorage.getItem('insight-currency') || 'BTC';

angular.module('insight',[
  'ngAnimate',
  'ngResource',
  'ngRoute',
  'ngProgress',
  'ui.bootstrap',
  'ui.route',
  'monospaced.qrcode',
  'gettext',
  'angularMoment',
  'insight.system',
  'insight.socket',
  'insight.api',
  'insight.blocks',
  'insight.transactions',
  'insight.address',
  'insight.search',
  'insight.status',
  'insight.connection',
  'insight.currency',
    'insight.messages',
    'insight.history',
    'insight.blacklists',
  'insight.login'
]);

angular.module('insight.system', []);
angular.module('insight.socket', []);
angular.module('insight.api', []);
angular.module('insight.blocks', []);
angular.module('insight.transactions', []);
angular.module('insight.address', []);
angular.module('insight.search', []);
angular.module('insight.status', []);
angular.module('insight.connection', []);
angular.module('insight.currency', []);
angular.module('insight.messages', []);
angular.module('insight.history', []);
angular.module('insight.blacklists', []);
angular.module('insight.login', []);

// Source: public/src/js/controllers/address.js
angular.module('insight.address').controller('AddressController',
  function($scope, $rootScope, $routeParams, $location, Global, Address, getSocket) {
    $scope.global = Global;

    //Datepicker
    var _formatTimestamp = function (date) {
      var yyyy = date.getFullYear().toString();
      var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd  = date.getDate().toString();

      return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
    };

    $scope.formatstime = '2009-01-03';
    $scope.formatetime = _formatTimestamp(new Date());
    var socket = getSocket($scope);
    var addrStr = $routeParams.addrStr;

    var _startSocket = function() {
      socket.on('bitcoind/addresstxid', function(data) {
        if (data.address === addrStr) {
          $rootScope.$broadcast('tx', data.txid);
          var base = document.querySelector('base');
          var beep = new Audio(base.href + '/sound/transaction.mp3');
          beep.play();
        }
      });
      socket.emit('subscribe', 'bitcoind/addresstxid', [addrStr]);
    };

    var _stopSocket = function () {
      socket.emit('unsubscribe', 'bitcoind/addresstxid', [addrStr]);
    };

    socket.on('connect', function() {
      _startSocket();
    });

    $scope.$on('$destroy', function(){
      _stopSocket();
    });

    $scope.params = $routeParams;

    $scope.findOne = function() {
      $rootScope.currentAddr = $routeParams.addrStr;
      _startSocket();

      Address.get({
          addrStr: $routeParams.addrStr
        },
        function(address) {
          $rootScope.titleDetail = address.addrStr.substring(0, 7) + '...';
          $rootScope.flashMessage = null;
          $scope.address = address;
        },
        function(e) {
          if (e.status === 400) {
            $rootScope.flashMessage = 'Invalid Address: ' + $routeParams.addrStr;
          } else if (e.status === 503) {
            $rootScope.flashMessage = 'Backend Error. ' + e.data;
          } else {
            $rootScope.flashMessage = 'Address Not Found';
          }
          setTimeout(function () {
            $rootScope.flashMessage = null
          }, 2000);
         // $location.path(history.go(-1));
        });
    };
  });

// Source: public/src/js/controllers/blacklists.js
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
  function ($scope, $rootScope, $routeParams, $http, Service, BlacklistService) {
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
      } else if ($scope.newblacklist.addr.length < 30
        || $scope.newblacklist.addr.length > 40) {
        $scope.newblacklist = {addr:'无效的地址'}
      } else {
        $scope.saveBlacklist($scope.newblacklist);
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

// Source: public/src/js/controllers/blocks.js
angular.module('insight.blocks').controller('BlocksController',
  function($scope, $rootScope, $routeParams, $location, Global, Block, Blocks, BlockByHeight, Status) {
  $scope.global = Global;
  $scope.loading = false;
  $scope.excelblocks = [];

  if ($routeParams.blockHeight) {
    BlockByHeight.get({
      blockHeight: $routeParams.blockHeight
    }, function(hash) {
      $location.path('/block/' + hash.blockHash);
    }, function() {
      $rootScope.flashMessage = 'Bad Request';
      $location.path('/');
    });
  }

  //Datepicker
  var _formatTimestamp = function (date) {
    var yyyy = date.getUTCFullYear().toString();
    var mm = (date.getUTCMonth() + 1).toString(); // getMonth() is zero-based
    var dd  = date.getUTCDate().toString();

    return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
  };

  //Datepicker
  var _formatTime = function (date) {
      var yyyy = date.getUTCFullYear().toString();
      var mm = (date.getUTCMonth() + 1).toString(); // getMonth() is zero-based
      var dd  = date.getUTCDate().toString();
      var h  = date.getUTCHours().toString();
      var m  = date.getUTCMinutes().toString();
      var s  = date.getUTCSeconds().toString();

      return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]) + " " + (h[1] ? h : '0' + h[0]) + ":" + (m[1] ? m : '0' + m[0]) + ":" + (s[1] ? s : '0' + s[0]) ; //padding
  };

  $scope.dateval = _formatTimestamp(new Date());

  $scope.$watch('dt', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $location.path('/blocks-date/' + _formatTimestamp(newValue));
    }
  });

  $scope.openCalendar = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.humanSince = function(time) {
  /*  var m = moment.unix(time).startOf('day');
    var b = moment().startOf('day');
    return m.max().from(b);*/
    return _formatTime(new Date(time*1000))
  };

 
  $scope.list = function() {
    $scope.loading = true;
    var searchDate = $routeParams.blockDate;

     Status.get({
          q: 'getLastBlockHash'
        },
        function(d) {
          
            Block.get({
              blockHash:d.lastblockhash
          },function(data){
              var date = _formatTimestamp(new Date((data.time-86400)*1000));
             
              if(!searchDate){
                   searchDate = date;
              }
              if ($routeParams.blockDate) {
                $scope.detail = 'On ' + searchDate;
              }

              if ($routeParams.startTimestamp) {
                var d=new Date($routeParams.startTimestamp*1000);
                var m=d.getMinutes();
                if (m<10) m = '0' + m;
                $scope.before = ' before ' + d.getHours() + ':' + m;
              }

              $rootScope.titleDetail = $scope.detail;

              Blocks.get({
                blockDate: searchDate,
                startTimestamp: $routeParams.startTimestamp
              }, function(res) {
                $scope.loading = false;
                $scope.blocks = res.blocks;
                res.blocks.forEach(function(data){
                    $scope.excelblocks.push({height:data.height,time:_formatTime(new Date(data.time * 1000)),confirmations:data.txlength + "个确认数",poolInfo:data.poolInfo.poolName||"",size:data.size})
                })
                $scope.pagination = res.pagination;
              });
          })
      });

  };

  $scope.findOne = function() {
    $scope.loading = true;

    Block.get({
      blockHash: $routeParams.blockHash
    }, function(block) {
      $rootScope.titleDetail = block.height;
      $rootScope.flashMessage = null;
      $scope.loading = false;
      $scope.block = block;
    }, function(e) {
      if (e.status === 400) {
        $rootScope.flashMessage = 'Invalid Transaction ID: ' + $routeParams.txId;
      }
      else if (e.status === 503) {
        $rootScope.flashMessage = 'Backend Error. ' + e.data;
      }
      else {
        $rootScope.flashMessage = 'Block Not Found';
      }
      $location.path('/');
    });
  };

  $scope.params = $routeParams;

});

// Source: public/src/js/controllers/connection.js
angular.module('insight.connection').controller('ConnectionController',
  function($scope, $window, Status, getSocket, PeerSync) {

    // Set initial values
    $scope.apiOnline = true;
    $scope.serverOnline = true;
    $scope.clienteOnline = true;

    var socket = getSocket($scope);

    // Check for the node server connection
    socket.on('connect', function() {
      $scope.serverOnline = true;
      socket.on('disconnect', function() {
        $scope.serverOnline = false;
      });
    });

    // Check for the  api connection
    $scope.getConnStatus = function() {
      PeerSync.get({},
        function(peer) {
          $scope.apiOnline = peer.connected;
          $scope.host = peer.host;
          $scope.port = peer.port;
        },
        function() {
          $scope.apiOnline = false;
        });
    };

    socket.emit('subscribe', 'sync');
    socket.on('status', function(sync) {
      $scope.sync = sync;
      $scope.apiOnline = (sync.status !== 'aborted' && sync.status !== 'error');
    });

    // Check for the client conneciton
    $window.addEventListener('offline', function() {
      $scope.$apply(function() {
        $scope.clienteOnline = false;
      });
    }, true);

    $window.addEventListener('online', function() {
      $scope.$apply(function() {
        $scope.clienteOnline = true;
      });
    }, true);

  });

// Source: public/src/js/controllers/currency.js
angular.module('insight.currency').controller('CurrencyController',
  function($scope, $rootScope, Currency) {
    $rootScope.currency.symbol = defaultCurrency;

    var _roundFloat = function(x, n) {
      if(!parseInt(n, 10) || !parseFloat(x)) n = 0;

      return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
    };

    $rootScope.currency.getConvertion = function(value) {
      value = value * 1; // Convert to number

      if (!isNaN(value) && typeof value !== 'undefined' && value !== null) {
        if (value === 0.00000000) return '0 ' + this.symbol; // fix value to show

        var response;

        if (this.symbol === 'USD') {
          response = _roundFloat((value * this.factor), 2);
        } else if (this.symbol === 'mBTC') {
          this.factor = 1000;
          response = _roundFloat((value * this.factor), 5);
        } else if (this.symbol === 'bits') {
          this.factor = 1000000;
          response = _roundFloat((value * this.factor), 2);
        } else { // assumes symbol is BTC
          this.factor = 1;
          response = _roundFloat((value * this.factor), 8);
        }
        // prevent sci notation
        if (response < 1e-7) response=response.toFixed(8);

        return response + ' ' + this.symbol;
      }

      return 'value error';
    };

    $scope.setCurrency = function(currency) {
      $rootScope.currency.symbol = currency;
      localStorage.setItem('insight-currency', currency);

      if (currency === 'USD') {
        Currency.get({}, function(res) {
          $rootScope.currency.factor = $rootScope.currency.bitstamp = res.data.bitstamp;
        });
      } else if (currency === 'mBTC') {
        $rootScope.currency.factor = 1000;
      } else if (currency === 'bits') {
        $rootScope.currency.factor = 1000000;
      } else {
        $rootScope.currency.factor = 1;
      }
    };

    // Get initial value
    Currency.get({}, function(res) {
      $rootScope.currency.factor = $rootScope.currency.bitstamp = res.data.bitstamp;
    });

  });

// Source: public/src/js/controllers/footer.js
angular.module('insight.system').controller('FooterController',
  function($scope, $route, $templateCache, gettextCatalog, amMoment,  Version) {

    $scope.defaultLanguage = defaultLanguage;

    var _getVersion = function() {
      Version.get({},
        function(res) {
          $scope.version = res.version;
        });
    };

    $scope.version = _getVersion();

    $scope.availableLanguages = [{
      name: 'Deutsch',
      isoCode: 'de_DE',
    }, {
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Chinese',
      isoCode: 'zh',
    }, {
      name: 'Spanish',
      isoCode: 'es',
    }, {
      name: 'Japanese',
      isoCode: 'ja',
    }];

    $scope.setLanguage = function(isoCode) {
      gettextCatalog.currentLanguage = $scope.defaultLanguage = defaultLanguage = isoCode;
      amMoment.changeLocale(isoCode);
      localStorage.setItem('insight-language', isoCode);
      var currentPageTemplate = $route.current.templateUrl;
      $templateCache.remove(currentPageTemplate);
      $route.reload();
    };

  });

// Source: public/src/js/controllers/header.js
angular.module('insight.system').controller('HeaderController',
  function($scope, $rootScope, $modal, getSocket, Global, Block) {
    $scope.global = Global;

    $scope.$on('userLogin', function(d, data) {
      $rootScope.isLogin = true;

      $scope.containerStyle = {
        "padding" : "70px 15px 0",
        "width" : "1170px"
      }
    });

    $scope.$on('userLogout', function(d, data) {
      $rootScope.isLogin = false;

      $scope.containerStyle = {
        "padding" : "70px 0 0",
        "width" : "100%"
      }
    });

    $rootScope.currency = {
      factor: 1,
      bitstamp: 0,
      symbol: 'BTC'
    };

    $scope.menu = [{
      'title': 'Home',
      'link': 'home'
    },{
      'title': 'Blocks',
      'link': 'blocks-index'
    }, {
      'title': 'Status',
      'link': 'status'
    },{
      'title': 'History',
      'link': 'history'
    }, {
      'title': 'Blacklist',
      'link': 'blacklists'
    }];

    $scope.openScannerModal = function() {
      var modalInstance = $modal.open({
        templateUrl: 'scannerModal.html',
        controller: 'ScannerController'
      });
    };

    var _getBlock = function(hash) {
      Block.get({
        blockHash: hash
      }, function(res) {
        $scope.totalBlocks = res.height;
      });
    };

    var socket = getSocket($scope);
    socket.on('connect', function() {
      socket.emit('subscribe', 'inv');

      socket.on('block', function(block) {
        var blockHash = block.toString();
        _getBlock(blockHash);
      });
    });

    $rootScope.isCollapsed = true;
  });

// Source: public/src/js/controllers/history.js
angular.module('insight.history').controller('HistoryController',
  function ($scope, $rootScope, $routeParams, HistoryService,History) {

      var _formatTimestamp = function (date) {
        var yyyy = date.getUTCFullYear().toString();
          var mm = (date.getUTCMonth() + 1).toString(); // getMonth() is zero-based
          var dd  = date.getUTCDate().toString();

          return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
      };

      $scope.dateval = _formatTimestamp(new Date());


    // $scope.historys = HistoryService.list();
    $scope.list = function () {
      HistoryService.get({}, function (res) {
        if (res.code === 0) {
          $scope.histories = res.data;
          // console.log('historys:',$scope.histories)
        }
      });
    }
    $scope.list();

    $scope.expand = function (num, id) {
      var length = $scope.histories.length;
      $scope.histories[length - 1 - id].limitpage = num;
      console.log('$scope.histories[id]=', $scope.histories[length - 1 - id])
    }

    $scope.params = $routeParams;

    $scope.history = function () {
           History.get({}, function (res) {
              if (res.code === 0) {
                  window.location.href="/history";
              }
            });
        }

  });

// Source: public/src/js/controllers/index.js
var TRANSACTION_DISPLAYED = 6;
var BLOCKS_DISPLAYED = 8;

angular.module('insight.system').controller('IndexController',
  function($scope, $rootScope, Global, getSocket,Block, Blocks,Status,TransactionsByBlock,$timeout/*,BlackByAddr*/) {
    $scope.global = Global;

    if ($rootScope.flashMessage) {
      $timeout(function(){$rootScope.flashMessage=null}, 2000);
    }
    var blockHash =[];
    var number = 0;
    var _getBlocks = function(date,startTimestamp) {
      Blocks.get({
        blockDate:date,
        startTimestamp:startTimestamp,
        limit: BLOCKS_DISPLAYED
      }, function(res) {
        $scope.blocks = res.blocks;
        res.blocks.forEach(function(block) {
          blockHash.push(block.hash);
        });
        $scope.blocksLength = res.length;
        _getcurData(blockHash);
      });
    };

    var socket = getSocket($scope);

    var _getcurData = function(){
            
        TransactionsByBlock.get({
          block:blockHash[number]
      }, function(data) {
        _loadData(data);
      });
    }
       
    var _loadData=function(data){
      number +=1;

      data.txs.forEach(function(tx) {
        $scope.txs.push(tx);
      });
     if (parseInt($scope.txs.length, 10) >= parseInt(TRANSACTION_DISPLAYED, 10)) {
        $scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED);
      }else{
        _getcurData();
      }
    }
   var _formatTimestamp = function (date) {
      var yyyy = date.getFullYear().toString();
      var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd  = date.getDate().toString();

      return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
    };
    var _initData = function(){
       Status.get({
          q: 'getLastBlockHash'
        },
        function(d) {
          console.log(d.lastblockhash);
          _getBlockDateByHash(d.lastblockhash);
        });
    }
    var _getBlockDateByHash = function (blockhash) {
          Block.get({
              blockHash:blockhash
          },function(data){
              var date = _formatTimestamp(new Date((data.time-86400)*1000));
              _getBlocks(date,data.time+1);
          })

    }


    var _startSocket = function() { 
     

      //_getcurData();
     /* socket.emit('subscribe', 'inv');
      socket.on('tx', function(tx) {
        $scope.txs.unshift(tx);
        if (parseInt($scope.txs.length, 10) >= parseInt(TRANSACTION_DISPLAYED, 10)) {
          $scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED);
        }
      });

      socket.on('block', function() {
        _getBlocks();
      });*/
    };

    socket.on('connect', function() {
      //_startSocket();
    });

 //Datepicker
    var _formatTime = function (date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd  = date.getDate().toString();
        var h  = date.getHours().toString();
        var m  = date.getMinutes().toString();
        var s  = date.getSeconds().toString();

        return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]) + " " + (h[1] ? h : '0' + h[0]) + ":" + (m[1] ? m : '0' + m[0]) + ":" + (s[1] ? s : '0' + s[0]) ; //padding
    };

    $scope.humanSince = function(time) {

      return _formatTime(new Date(time*1000))
    /*  var m = moment.unix(time);
      return m.max().fromNow();*/
    };

    $scope.index = function() {
      //_getBlocks();
       _initData();
      _startSocket();
    };

    $scope.txs = [];
    $scope.blocks = [];
  });

// Source: public/src/js/controllers/login.js
angular.module('insight.login').controller('loginController',
  function ($scope, $rootScope, $routeParams, $location, Account) {
    $rootScope.$broadcast('userLogout');

    // force to hide header
    $scope.hideHeader = function() {
      $rootScope.$broadcast('userLogout');
    };
    //依赖注入的内容 作用域 本地 账户信息 弹出提示 状态值
    $scope.login = function () {

      // $scope.verifyError = "";
      $scope.accountError = "";
      $scope.passwordError = "";

      // console.log('login user info:', $scope.user.name, $scope.user.password);
      if(!$scope.user.name){
        $scope.accountError = "请填写账号"
      }
      if(!$scope.user.password){
        $scope.passwordError = "请填写密码"
      }
      if ($scope.user && $scope.user.name && $scope.user.password) {
        Account.get({
          name: $scope.user.name,
          password: $scope.user.password
        }, function(res) {
          // console.log('res',res)
          if (res.code === -101) {
            $scope.accountError = "账号不存在"
            $scope.passwordError = ""
            $scope.user.name = '';
          } else if (res.code === -102) {
            $scope.accountError = ""
            $scope.passwordError = "密码错误"
            $scope.user.password = '';
          } else if (res.code === 0) {
            $rootScope.isLogin = true;
            $location.path('/home');
          }

        });

      }
      else {
        //SweetAlert.swal("", "请重新输入用户名或密码", "warning");
      }
    }
  })
// Source: public/src/js/controllers/messages.js
angular.module('insight.messages').controller('VerifyMessageController',
  function($scope, $http, Api) {
  $scope.message = {
    address: '',
    signature: '',
    message: ''
  };
  $scope.verification = {
    status: 'unverified',  // ready|loading|verified|error
    result: null,
    error: null,
    address: ''
  };

  $scope.verifiable = function() {
    return ($scope.message.address
            && $scope.message.signature
            && $scope.message.message);
  };
  $scope.verify = function() {
    $scope.verification.status = 'loading';
    $scope.verification.address = $scope.message.address;
    $http.post(Api.apiPrefix + '/messages/verify', $scope.message)
      .success(function(data, status, headers, config) {
        if(typeof(data.result) != 'boolean') {
          // API returned 200 but result was not true or false
          $scope.verification.status = 'error';
          $scope.verification.error = null;
          return;
        }

        $scope.verification.status = 'verified';
        $scope.verification.result = data.result;
      })
      .error(function(data, status, headers, config) {
        $scope.verification.status = 'error';
        $scope.verification.error = data;
      });
  };

  // Hide the verify status message on form change
  var unverify = function() {
    $scope.verification.status = 'unverified';
  };
  $scope.$watch('message.address', unverify);
  $scope.$watch('message.signature', unverify);
  $scope.$watch('message.message', unverify);
});

// Source: public/src/js/controllers/scanner.js
angular.module('insight.system').controller('ScannerController',
  function($scope, $rootScope, $modalInstance, Global) {
    $scope.global = Global;

    // Detect mobile devices
    var isMobile = {
      Android: function() {
          return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function() {
          return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function() {
          return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function() {
          return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function() {
          return navigator.userAgent.match(/IEMobile/i);
      },
      any: function() {
          return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
      }
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    $scope.isMobile = isMobile.any();
    $scope.scannerLoading = false;

    var $searchInput = angular.element(document.getElementById('search')),
        cameraInput,
        video,
        canvas,
        $video,
        context,
        localMediaStream;

    var _scan = function(evt) {
      if ($scope.isMobile) {
        $scope.scannerLoading = true;
        var files = evt.target.files;

        if (files.length === 1 && files[0].type.indexOf('image/') === 0) {
          var file = files[0];

          var reader = new FileReader();
          reader.onload = (function(theFile) {
            return function(e) {
              var mpImg = new MegaPixImage(file);
              mpImg.render(canvas, { maxWidth: 200, maxHeight: 200, orientation: 6 });

              setTimeout(function() {
                qrcode.width = canvas.width;
                qrcode.height = canvas.height;
                qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);

                try {
                  //alert(JSON.stringify(qrcode.process(context)));
                  qrcode.decode();
                } catch (e) {
                  alert(e);
                }
              }, 1500);
            };
          })(file);

          // Read  in the file as a data URL
          reader.readAsDataURL(file);
        }
      } else {
        if (localMediaStream) {
          context.drawImage(video, 0, 0, 300, 225);

          try {
            qrcode.decode();
          } catch(e) {
            //qrcodeError(e);
          }
        }

        setTimeout(_scan, 500);
      }
    };

    var _successCallback = function(stream) {
      video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      localMediaStream = stream;
      video.play();
      setTimeout(_scan, 1000);
    };

    var _scanStop = function() {
      $scope.scannerLoading = false;
      $modalInstance.close();
      if (!$scope.isMobile) {
        if (localMediaStream.stop) localMediaStream.stop();
        localMediaStream = null;
        video.src = '';
      }
    };

    var _videoError = function(err) {
      console.log('Video Error: ' + JSON.stringify(err));
      _scanStop();
    };

    qrcode.callback = function(data) {
      _scanStop();

      var str = (data.indexOf('bitcoin:') === 0) ? data.substring(8) : data; 
      console.log('QR code detected: ' + str);
      $searchInput
        .val(str)
        .triggerHandler('change')
        .triggerHandler('submit');
    };

    $scope.cancel = function() {
      _scanStop();
    };

    $modalInstance.opened.then(function() {
      $rootScope.isCollapsed = true;
      
      // Start the scanner
      setTimeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if ($scope.isMobile) {
          cameraInput = document.getElementById('qrcode-camera');
          cameraInput.addEventListener('change', _scan, false);
        } else {
          video = document.getElementById('qrcode-scanner-video');
          $video = angular.element(video);
          canvas.width = 300;
          canvas.height = 225;
          context.clearRect(0, 0, 300, 225);

          navigator.getUserMedia({video: true}, _successCallback, _videoError); 
        }
      }, 500);
    });
});

// Source: public/src/js/controllers/search.js
angular.module('insight.search').controller('SearchController',
  function($scope, $routeParams, $location, $timeout, Global, Block, Transaction, Address, BlockByHeight) {
  $scope.global = Global;
  $scope.loading = false;

  var _badQuery = function() {
    $scope.badQuery = true;

    $timeout(function() {
      $scope.badQuery = false;
    }, 2000);
  };

  var _resetSearch = function() {
    $scope.q = '';
    $scope.loading = false;
  };

  $scope.search = function() {
    var q = $scope.q;
    $scope.badQuery = false;
    $scope.loading = true;

    Block.get({
      blockHash: q
    }, function() {
      _resetSearch();
      $location.path('block/' + q);
    }, function() { //block not found, search on TX
      Transaction.get({
        txId: q
      }, function() {
        _resetSearch();
        $location.path('tx/' + q);
      }, function() { //tx not found, search on Address
        Address.get({
          addrStr: q
        }, function() {
          _resetSearch();
          $location.path('address/' + q);
        }, function() { // block by height not found
          if (isFinite(q)) { // ensure that q is a finite number. A logical height value.
            BlockByHeight.get({
              blockHeight: q
            }, function(hash) {
              _resetSearch();
              $location.path('/block/' + hash.blockHash);
            }, function() { //not found, fail :(
              $scope.loading = false;
              _badQuery();
            });
          }
          else {
            $scope.loading = false;
            _badQuery();
          }
        });
      });
    });
  };

});

// Source: public/src/js/controllers/status.js
angular.module('insight.status').controller('StatusController',
  function($scope, $routeParams, $location, Global, Status, Sync, getSocket) {
    $scope.global = Global;

    $scope.getStatus = function(q) {
      Status.get({
          q: 'get' + q
        },
        function(d) {
          $scope.loaded = 1;
          angular.extend($scope, d);
        },
        function(e) {
          $scope.error = 'API ERROR: ' + e.data;
        });
    };

    $scope.humanSince = function(time) {
      var m = moment.unix(time / 1000);
      return m.max().fromNow();
    };

    var _onSyncUpdate = function(sync) {
      $scope.sync = sync;
    };

    var _startSocket = function () {
      socket.emit('subscribe', 'sync');
      socket.on('status', function(sync) {
        _onSyncUpdate(sync);
      });
    };
    
    var socket = getSocket($scope);
    socket.on('connect', function() {
      _startSocket();
    });


    $scope.getSync = function() {
      _startSocket();
      Sync.get({},
        function(sync) {
          _onSyncUpdate(sync);
        },
        function(e) {
          var err = 'Could not get sync information' + e.toString();
          $scope.sync = {
            error: err
          };
        });
    };
  });

// Source: public/src/js/controllers/transactions.js
angular.module('insight.transactions',['ngSanitize', 'ngCsv']).controller('transactionsController',
function($scope, $rootScope, $routeParams, $location, Global, Transaction, TransactionsByBlock, TransactionsByAddress,BlockByHeight,Blocks,Block,BlacklistService,Address,Status) {
  $scope.global = Global;
  $scope.loading = false;
  $scope.loadedBy = null;
  $scope.youShow=true;
  $scope.zuoShow=true;

  var txdirection_you=true;
  var txdirection_zuo=true;

  var pageNum = 0;
  var pagesTotal = 1;
  var COIN = 100000000;
  var isHome=false;
  var isSearchByDate = false;
 
   //Datepicker
  var _formatTimestamp = function (date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();

    return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); //padding
  };
  var _formatTimestampIE = function (date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();

    return yyyy + '/' + (mm[1] ? mm : '0' + mm[0]) + '/' + (dd[1] ? dd : '0' + dd[0]); //padding
  };

  $scope.dateval= _formatTimestamp(new Date())
  $scope.stime=1230739200
  $scope.etime=Math.round((new Date()).getTime()/1000);

  $scope.searchByAddr = function(){
      $scope.loading = true;
      isHome=true;
      $scope.txs=[];
      pageNum = 0;
      _blackAddr();
      _byAddress();
  }

  var _blackAddr = function(){
      var addr = $scope.searchAddr;
      $scope.blackaddr="";
      BlacklistService.get({}, function (res) {
        var data = res.data;
         for(var i in data){
          if(addr===data[i].addr){
               $scope.blackaddr = data[i];
            }
         }
        
      }); 
      Address.get({
          addrStr: addr
        },
        function(address) {
         $scope.balance =  address.balance;
        });   
  }

  $scope.lookTX = function(imgstr){
    isHome=false;
    $scope.loading = true;
    if(imgstr==="you"){
        txdirection_you=false;
        $scope.youShow=!$scope.youShow;
    }else if(imgstr==="you-g"){
        txdirection_you=true;
     $scope.youShow=!$scope.youShow;
    }else if(imgstr==="zuo"){
        txdirection_zuo=false;
        $scope.zuoShow=!$scope.zuoShow;
    }else{
        txdirection_zuo=true;
        $scope.zuoShow=!$scope.zuoShow;
    }
     $scope.txs=[];
     $scope.exceltxs=[];
     $scope.exceladdtxs=[];
     pageNum = 0;
      _byAddress();
  }
  

  $scope.openCalendara = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.openeda = true;
  };
  $scope.openCalendarb = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.openedb = true;
  };

  $scope.$watch('datevala', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.stime = Math.round((new Date(_formatTimestampIE(newValue) +" 00:00:00")).getTime()/1000);
      //console.log("$scope.stime "+$scope.stime);
      $scope.formatstime = _formatTimestamp(new Date($scope.stime*1000))
    }

  });
  $scope.$watch('datevalb', function(newValue, oldValue) {
    if (newValue !== oldValue) {
        $scope.etime = Math.round((new Date(_formatTimestampIE(newValue) +" 23:59:59")).getTime()/1000);
        $scope.formatetime = _formatTimestamp(new Date($scope.etime*1000))
        if($scope.stime>$scope.etime){
            alert("开始时间不能大于结束时间!");
        }
    }

  });


 $scope.searchByDate = function(){
      $scope.loading = true;
      isHome=false;
      isSearchByDate = true;
      //console.log($scope.stime ,$scope.etime);
      $scope.txs=[];
      $scope.exceltxs=[];
      $scope.exceladdtxs=[];
      pageNum = 0;
      _byAddress();
  }

    //Datepicker
    var _formatTime = function (date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd  = date.getDate().toString();
        var h  = date.getHours().toString();
        var m  = date.getMinutes().toString();
        var s  = date.getSeconds().toString();

        return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]) + " " + (h[1] ? h : '0' + h[0]) + ":" + (m[1] ? m : '0' + m[0]) + ":" + (s[1] ? s : '0' + s[0]) ; //padding
    };


  var _aggregateItems = function(items) {
    if (!items) return [];

    var l = items.length;

    var ret = [];
    var tmp = {};
    var u = 0;

    for(var i=0; i < l; i++) {

      var notAddr = false;
      // non standard input
      if (items[i].scriptSig && !items[i].addr) {
        items[i].addr = 'Unparsed address [' + u++ + ']';
        items[i].notAddr = true;$scope.stime
        notAddr = true;
      }

      // non standard output
      if (items[i].scriptPubKey && !items[i].scriptPubKey.addresses) {
        items[i].scriptPubKey.addresses = ['Unparsed address [' + u++ + ']'];
        items[i].notAddr = true;
        notAddr = true;
      }

      // multiple addr at output
      if (items[i].scriptPubKey && items[i].scriptPubKey.addresses.length > 1) {
        items[i].addr = items[i].scriptPubKey.addresses.join(',');
        ret.push(items[i]);
        continue;
      }

      var addr = items[i].addr || (items[i].scriptPubKey && items[i].scriptPubKey.addresses[0]);

      if (!tmp[addr]) {
        tmp[addr] = {};
        tmp[addr].valueSat = 0;
        tmp[addr].count = 0;
        tmp[addr].addr = addr;
        tmp[addr].items = [];
      }
      tmp[addr].isSpent = items[i].spentTxId;

      tmp[addr].doubleSpentTxID = tmp[addr].doubleSpentTxID   || items[i].doubleSpentTxID;
      tmp[addr].doubleSpentIndex = tmp[addr].doubleSpentIndex || items[i].doubleSpentIndex;
      tmp[addr].dbError = tmp[addr].dbError || items[i].dbError;
      tmp[addr].valueSat += Math.round(items[i].value * COIN);
      tmp[addr].items.push(items[i]);
      tmp[addr].notAddr = notAddr;

      if (items[i].unconfirmedInput)
        tmp[addr].unconfirmedInput = true;

      tmp[addr].count++;
    }

    angular.forEach(tmp, function(v) {
      v.value    = v.value || parseInt(v.valueSat) / COIN;
      ret.push(v);
    });
    return ret;
  };

  var _processTX = function(tx) {
    tx.vinSimple = _aggregateItems(tx.vin);
    tx.voutSimple = _aggregateItems(tx.vout);
  };

  var _paginate = function(data) {
    pagesTotal = data.pagesTotal;
    pageNum += 1;
    data.txs.forEach(function(tx) {
     /* console.log('_paginate.pageNum=',pageNum)
      console.log('_paginate.pagesTotal=',pagesTotal)
*/
      if(isHome){
        _processTX(tx);
        $scope.txs.push(tx);
      }else{
        //console.log("_Txdirection "+_Txdirection(tx));
        if(_Txdirection(tx)){
          _processTX(tx);
          $scope.txs.push(tx);
          var vinaddrs = _vinaddrs(tx.vin);
          var voutaddrs = _voutaddrs(tx.vout);
          $scope.exceltxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),vinadds:vinaddrs,voutadds:voutaddrs,value:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认"});
          //console.log(tx.time);
          $scope.exceladdtxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),vinadds:vinaddrs,voutadds:voutaddrs,valueOut:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认"});
          //$scope.exceladdtxs.push({hash:"988cadbbad955a7285e27dbae8e50cc289a23045cc66a21db9de50f6ca917f7a",time:"20170204",vinadds:"2Mx3TZycg4XL5sQFfERBgNmg9Ma7uxowK9y\nmg2ecTMFakp4xSca1x1pzPfd1aCc1WVY6Q",voutadds:"mz28XtZ4pNTmNEU6Nc4qUkLzqrX2SjfRbH\nmjAFPh7F15o3BrAXbqZgUtUj6zjnKMWMhu\n2NBMEXscbMskQPji9j2CoEvU8tnZdpLZmSy",valueIn:"125 BTC",valueOut:"124 BTC",confirmations:"12 个确认数"});
        }
      }
     
    });
    $scope.loading = false;
  };

  var _TxByDate = function(data){
      pagesTotal = data.pagesTotal;
      pageNum += 1;
      var txCount = 0;
      data.txs.forEach(function(tx) {
        if(tx.blocktime>$scope.stime&&tx.blocktime<$scope.etime){
              txCount +=1;
             if(_Txdirection(tx)){
                _processTX(tx);
                $scope.txs.push(tx);
                var vinaddrs = _vinaddrs(tx.vin);
                var voutaddrs = _voutaddrs(tx.vout);
                $scope.exceltxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),vinadds:vinaddrs,voutadds:voutaddrs,value:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认"});
                $scope.exceladdtxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),vinadds:vinaddrs,voutadds:voutaddrs,valueOut:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认"});
             }
          }
      })
/*    console.log('pageNum=',pageNum)
    console.log('pagesTotal=',pagesTotal)
    console.log('txCount=',txCount)*/
      if(txCount<10&&pageNum<Math.round(pagesTotal/10) && pageNum>0){
        _byAddress();
      }else{
         $scope.loading = false;
      }
  }

  var _vinaddrs = function(data){
      var address = "";
      data.forEach(function(vin) {
          if(vin.addr){
            address += "\n"+vin.addr;
          }else{
            address += "\n没有输入(新生产的币)"
          }
      })
      return address;
  };
  var _voutaddrs = function(data){
     var address = "";
     data.forEach(function(vout) {
          vout.scriptPubKey.addresses.forEach(function(addr) {
            if(address.indexOf(addr) == -1){
              address += "\n"+addr;;
            }
          });
      })
      return address;
  };


  var _Txdirection = function(tx){
      //console.log("txdirection_you "+txdirection_you,"txdirection_zuo "+txdirection_zuo);
      var account= $routeParams.addrStr;
      if(txdirection_you&&!txdirection_zuo){
        if(JSON.stringify(tx.vin).indexOf(account) != -1){
          return true;
        }           
      }else if(!txdirection_you&&txdirection_zuo){
         if(JSON.stringify(tx.vout).indexOf(account) != -1){
          return true;
        }    
      }else if(txdirection_you&&txdirection_zuo){
          return true;  
      }else{
        return false;
      }
      return false;
  }

  var _byBlock = function() {
    TransactionsByBlock.get({
      block: $routeParams.blockHash,
      pageNum: pageNum
    }, function(data) {
      _paginate(data);
    });
  };

  var _byAddress = function () {
    var address = $routeParams.addrStr;
    if(address===undefined){
      address = $scope.searchAddr;
    }
    TransactionsByAddress.get({
      address: address,
      pageNum: pageNum

    }, function(data) {
      console.log($scope.stime,$scope.etime);
      if(isSearchByDate){
        _TxByDate(data);
      }else{
        _paginate(data);
      }
    },function(err){
      $scope.loading = false;
    });
  };

  var _findTx = function(txid) {
    Transaction.get({
      txId: txid
    }, function(tx) {
      $rootScope.titleDetail = tx.txid.substring(0,7) + '...';
      $rootScope.flashMessage = null;
      $scope.tx = tx;
      _processTX(tx);
      $scope.txs.unshift(tx);
      // $scope.exceltxs.unshift({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),value:tx.valueOut + " BTC",confirmations:tx.confirmations});
    }, function(e) {
      if (e.status === 400) {
        $rootScope.flashMessage = 'Invalid Transaction ID: ' + $routeParams.txId;
      }
      else if (e.status === 503) {
        $rootScope.flashMessage = 'Backend Error. ' + e.data;
      }
      else {
        $rootScope.flashMessage = 'Transaction Not Found';
      }

      $location.path('/');
    });
  };

  $scope.findThis = function() {
    _findTx($routeParams.txId);
  };

  //Initial load
  $scope.load = function(from) {
    $scope.loadedBy = from;
    $scope.loadMore();
  };

  //Load more transactions for pagination
  $scope.loadMore = function() {
    if (pageNum < pagesTotal && !$scope.loading) {
      $scope.loading = true;

      if ($scope.loadedBy === 'address') {
        _byAddress();
      }
      else {
        _byBlock();
      }
    }
  };

 

  $scope.htxs= [];
  $scope.excelhtxs=[];
  var curHeight = 0;
  $scope.iscurheight = true;
  $scope.initLoadTXByheight = function() {
      $scope.loading = true;
      _initData();
  };
   //Load transactions for pagination
  $scope.loadTXByheight = function() {
      $scope.iscurheight = false;
      $scope.htxs= [];
      $scope.excelhtxs=[];
      $scope.loading = true;
      pageNum = 0;
      console.log($scope.blockHeight,curHeight);
      if($scope.blockHeight===curHeight){
          $scope.iscurheight = true;
      }
      console.log($scope.iscurheight);
      BlockByHeight.get({
        blockHeight:$scope.blockHeight
      },function(data){
          $scope.blockhash = data.blockHash;
          _getcurData();
      })
  };
 var _initData = function(){
       Status.get({
          q: 'getLastBlockHash'
        },
        function(d) {
          console.log(d.lastblockhash);
          _getBlockDateByHash(d.lastblockhash);
        });
    }
  var _getBlockDateByHash = function (blockhash) {
          Block.get({
              blockHash:blockhash
          },function(data){

              $scope.blockhash = blockhash;
              curHeight = data.height;
              $scope.blockHeight = curHeight;
              _getcurData();
          })

    }

  var _getcurData = function(){
     var hash = $scope.blockhash;
     console.log(hash);
      TransactionsByBlock.get({
          block:hash,
          pageNum: pageNum
      }, function(data) {
          _paginatetx(data);
      });
    }
    
  $scope.humanSince = function(time) {
    return _formatTime(new Date(time*1000));
     /* var m = moment.unix(time);
      return m.max().fromNow();*/
  };
  $scope.parseint = function(height) {
      return parseInt(height);
  };
  $scope.prevHeight = function() {
      $scope.blockHeight = $scope.blockHeight-1;
      $scope.loadTXByheight();
  };
  $scope.nextHeight = function() {
      $scope.blockHeight = $scope.blockHeight+1;
      $scope.loadTXByheight();
  };
  var _paginatetx = function(data) {
    $scope.loading = false;

    pagesTotal = data.pagesTotal;
    pageNum += 1;
    data.txs.forEach(function(tx) {
        $scope.htxs.push(tx);
        $scope.excelhtxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),value:tx.valueOut + " BTC",confirmations:tx.confirmations+"个确认数"});
    });
    if (pageNum < pagesTotal) {
      _getcurData();
    }
  };
  // Highlighted txout
  if ($routeParams.v_type == '>' || $routeParams.v_type == '<') {
    $scope.from_vin = $routeParams.v_type == '<' ? true : false;
    $scope.from_vout = $routeParams.v_type == '>' ? true : false;
    $scope.v_index = parseInt($routeParams.v_index);
    $scope.itemsExpanded = true;
  }
  
  //Init without txs
  $scope.txs = [];
  $scope.exceltxs=[];
  $scope.exceladdtxs=[];

  $scope.$on('tx', function(event, txid) {
    _findTx(txid);
  });

});

angular.module('insight.transactions').controller('SendRawTransactionController',
  function($scope, $http, Api) {
  $scope.transaction = '';
  $scope.status = 'ready';  // ready|loading|sent|error
  $scope.txid = '';
  $scope.error = null;

  $scope.formValid = function() {
    return !!$scope.transaction;
  };
  $scope.send = function() {
    var postData = {
      rawtx: $scope.transaction
    };
    $scope.status = 'loading';
    $http.post(Api.apiPrefix + '/tx/send', postData)
      .success(function(data, status, headers, config) {
        if(typeof(data.txid) != 'string') {
          // API returned 200 but the format is not known
          $scope.status = 'error';
          $scope.error = 'The transaction was sent but no transaction id was got back';
          return;
        }

        $scope.status = 'sent';
        $scope.txid = data.txid;
      })
      .error(function(data, status, headers, config) {
        $scope.status = 'error';
        if(data) {
          $scope.error = data;
        } else {
          $scope.error = "No error message given (connection error?)"
        }
      });
  };
});

// Source: public/src/js/services/address.js
angular.module('insight.address').factory('Address',
  function($resource, Api) {
  return $resource(Api.apiPrefix + '/addr/:addrStr/?noTxList=1', {
    addrStr: '@addStr'
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
});

 

// Source: public/src/js/services/api.js
angular.module('insight.api')
  .factory('Service',
    function() {
      return {
        apiPrefix: '/bitcore-service'
      }
    })
  .factory('Api',
    function() {
      return {
        apiPrefix: '/insight-api'
      }
    });

// Source: public/src/js/services/blacklists.js
angular.module('insight.blacklists')
    .factory('BlacklistService',
      function ($resource, Service) {
        console.log("Service:", Service.apiPrefix)
        return $resource(Service.apiPrefix + '/blacklist/blacklists');
      },{})
    // .factory('BlackByAddr',
    //   function ($resource, Service) {
    //     return $resource(Service.apiPrefix + '/blacklist/:addr');
    //   },{
    //     get: {
    //       method: 'GET',
    //       interceptor: {
    //         response: function (res) {
    //           return res.data;
    //         },
    //         responseError: function (res) {
    //           if (res.status === 404) {
    //             return res;
    //           }
    //         }
    //       }
    //     }
    //   });
        // function () {
        //     console.log("blacklists service start");
        //     var k = 'blacklist';
        //
        //     var data = [
        //         {
        //             k: "blacklist.user.1",
        //             id: 31,
        //             addr: "0r935lsfgferogerjgerg43g34",
        //             comment: "这是1的hash",
        //             time: new Date()
        //         },
        //         {
        //             k: "blacklist.user.2",
        //             id: 32,
        //             addr: "1r935lsfgferogerjgerg43g34",
        //             comment: "这是2的hash",
        //             time: new Date()
        //         }
        //     ];
        //     var service = {};
        //
        //     service.getBlacklists = function () {
        //         // $http.get('js/blacklist.json')
        //         //     .success(function (Data) {
        //         //         // $scope.names = Data;
        //         //         console.info(Data);
        //         //         return Data;
        //         //     });
        //         return data;
        //         // ldb.find(k, function (key, value) {
        //         //     if (key === null) {
        //         //         console.log("find Over @", value, " arr=", blacklists);
        //         //         return blacklists;
        //         //     }
        //         //     if (key.startsWith(k)) {
        //         //         blacklists.push(JSON.parse(value));
        //         //     }
        //         //     // console.log(arr.length, ':find ok: ', arr);
        //         // });
        //     };
        //
        //     service.setBlacklists = function () {
        //         console.log('Blacklists service set start');
        //         ldb.put(data[0].k, data[0]);
        //         ldb.put(data[1].k, data[1]);
        //     };
        //
        //     //to create unique blacklist id
        //     var uid = 1;
        //
        //     //blacklists array to hold list of all blacklists
        //     var blacklists = [];
        //
        //     //save method create a new blacklist if not already exists
        //     //else update the existing object
        //     service.save = function (blacklist) {
        //         if (blacklist.id == null) {
        //             //if this blacklist already in the list, ignore it.
        //             for (i in blacklists) {
        //                 if (blacklists[i].addr == blacklist.addr) {
        //                     return;
        //                 }
        //             }
        //             //if this is new blacklist, add it in blacklists array
        //             blacklist.id = uid++;
        //             blacklist.time = new Date();
        //             blacklists.push(blacklist);
        //         } else {
        //             //for existing blacklist, find this blacklist using id
        //             //and update it.
        //             for (i in blacklists) {
        //                 if (blacklists[i].id == blacklist.id) {
        //                     blacklist.time = new Date();
        //                     blacklists[i] = blacklist;
        //                 }
        //             }
        //         }
        //
        //     };
        //
        //     //simply search blacklists list for given id
        //     //and returns the blacklist object if found
        //     service.get = function (id) {
        //         for (i in blacklists) {
        //             if (blacklists[i].id == id) {
        //                 return blacklists[i];
        //             }
        //         }
        //
        //     };
        //
        //     //iterate through blacklists list and delete
        //     //blacklist if found
        //     service.delete = function (id) {
        //         for (i in blacklists) {
        //             if (blacklists[i].id == id) {
        //                 blacklists.splice(i, 1);
        //             }
        //
        //             if (blacklists[i].id > id) {
        //                 blacklists[i].id = blacklists[i].id-1;
        //             }
        //         }
        //         uid--;
        //     };
        //
        //     //simply returns the blacklists list
        //     service.list = function () {
        //         return blacklists;
        //     };
        //
        //     return service;
        // });

// Source: public/src/js/services/blocks.js
angular.module('insight.blocks')
  .factory('Block',
    function($resource, Api) {
    return $resource(Api.apiPrefix + '/block/:blockHash', {
      blockHash: '@blockHash'
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
  .factory('Blocks',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/blocks');
  })
  .factory('BlockByHeight',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/block-index/:blockHeight');
  });

// Source: public/src/js/services/currency.js
angular.module('insight.currency').factory('Currency',
  function($resource, Api) {
    return $resource(Api.apiPrefix + '/currency');
});

// Source: public/src/js/services/global.js
//Global service for global variables
angular.module('insight.system')
  .factory('Global',[
    function() {
    }
  ])
  .factory('Version',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/version');
  });

// Source: public/src/js/services/history.js
angular.module('insight.history')
    .factory('HistoryService',
      function ($resource, Service) {
        // console.log("Service:", Service.apiPrefix)
        return $resource(Service.apiPrefix + '/history/histories');
      })
    .factory('History',
      function ($resource, Service) {
        return $resource(Service.apiPrefix + '/history');
      });

// Source: public/src/js/services/login.js
angular.module('insight.login')
  .factory('CurrentUser',
    function ($resource, Service) {
      // console.log("Service:", Service.apiPrefix)
      return $resource(Service.apiPrefix + '/currentuser');
    })
  .factory('Account',
    function ($resource, Service) {
      // console.log("Service:", Service.apiPrefix)
      return $resource(Service.apiPrefix + '/user');
    });

// Source: public/src/js/services/session.js
/**
 * Created by Administrator on 2017/8/4.
 */

// Source: public/src/js/services/socket.js
var ScopedSocket = function(socket, $rootScope) {
  this.socket = socket;
  this.$rootScope = $rootScope;
  this.listeners = [];
};

ScopedSocket.prototype.removeAllListeners = function(opts) {
  if (!opts) opts = {};
  for (var i = 0; i < this.listeners.length; i++) {
    var details = this.listeners[i];
    if (opts.skipConnect && details.event === 'connect') {
      continue;
    }
    this.socket.removeListener(details.event, details.fn);
  }
  this.listeners = [];
};

ScopedSocket.prototype.on = function(event, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;

  var wrapped_callback = function() {
    var args = arguments;
    $rootScope.$apply(function() {
      callback.apply(socket, args);
    });
  };
  socket.on(event, wrapped_callback);

  this.listeners.push({
    event: event,
    fn: wrapped_callback
  });
};

ScopedSocket.prototype.emit = function(event, data, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;
  var args = Array.prototype.slice.call(arguments);

  args.push(function() {
    var args = arguments;
    $rootScope.$apply(function() {
      if (callback) {
        callback.apply(socket, args);
      }
    });
  });

  socket.emit.apply(socket, args);
};

angular.module('insight.socket').factory('getSocket',
  function($rootScope) {
    var socket = io.connect(null, {
      'reconnect': true,
      'reconnection delay': 500,
    });
    return function(scope) {
      var scopedSocket = new ScopedSocket(socket, $rootScope);
      scope.$on('$destroy', function() {
        scopedSocket.removeAllListeners();
      });
      socket.on('connect', function() {
        scopedSocket.removeAllListeners({
          skipConnect: true
        });
      });
      return scopedSocket;
    };
  });

// Source: public/src/js/services/status.js
angular.module('insight.status')
  .factory('Status',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/status', {
        q: '@q'
      });
    })
  .factory('Sync',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/sync');
    })
  .factory('PeerSync',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/peer');
    });

// Source: public/src/js/services/transactions.js
angular.module('insight.transactions')
  .factory('Transaction',
    function($resource, Api) {
    return $resource(Api.apiPrefix + '/tx/:txId', {
      txId: '@txId'
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
  .factory('TransactionsByBlock',
    function($resource, Api) {
    return $resource(Api.apiPrefix + '/txs', {
      block: '@block'
    });
  })
  .factory('TransactionsByAddress',
    function($resource, Api) {
    return $resource(Api.apiPrefix + '/txs', {
      address: '@address'
    });
  })
  .factory('Transactions',
    function($resource, Api) {
      return $resource(Api.apiPrefix + '/txs');
  });

// Source: public/src/js/directives.js
var ZeroClipboard = window.ZeroClipboard;

angular.module('insight')
  .directive('scroll', function ($window) {
    return function(scope, element, attrs) {
      angular.element($window).bind('scroll', function() {
        if (this.pageYOffset >= 200) {
          scope.secondaryNavbar = true;
        } else {
          scope.secondaryNavbar = false;
        }
        scope.$apply();
      });
    };
  })
  .directive('whenScrolled', function($window) {
    return {
      restric: 'A',
      link: function(scope, elm, attr) {
        var pageHeight, clientHeight, scrollPos;
        $window = angular.element($window);

        var handler = function() {
          pageHeight = window.document.documentElement.scrollHeight;
          clientHeight = window.document.documentElement.clientHeight;
          scrollPos = window.pageYOffset;

          if (pageHeight - (scrollPos + clientHeight) === 0) {
            scope.$apply(attr.whenScrolled);
          }
        };

        $window.on('scroll', handler);

        scope.$on('$destroy', function() {
          return $window.off('scroll', handler);
        });
      }
    };
  })
  .directive('clipCopy', function() {
    ZeroClipboard.config({
      moviePath: '/lib/zeroclipboard/ZeroClipboard.swf',
      trustedDomains: ['*'],
      allowScriptAccess: 'always',
      forceHandCursor: true
    });

    return {
      restric: 'A',
      scope: { clipCopy: '=clipCopy' },
      template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
      link: function(scope, elm) {
        var clip = new ZeroClipboard(elm);

        clip.on('load', function(client) {
          var onMousedown = function(client) {
            client.setText(scope.clipCopy);
          };

          client.on('mousedown', onMousedown);

          scope.$on('$destroy', function() {
            client.off('mousedown', onMousedown);
          });
        });

        clip.on('noFlash wrongflash', function() {
          return elm.remove();
        });
      }
    };
  })
  .directive('focus', function ($timeout) {
    return {
      scope: {
        trigger: '@focus'
      },
      link: function (scope, element) {
        scope.$watch('trigger', function (value) {
          if (value === "true") {
            $timeout(function () {
              element[0].focus();
            });
          }
        });
      }
    };
  });

// Source: public/src/js/filters.js
angular.module('insight')
  .filter('startFrom', function() {
    return function(input, start) {
      start = +start; //parse to int
      return input.slice(start);
    }
  })
  .filter('split', function() {
    return function(input, delimiter) {
      var delimiter = delimiter || ',';
      return input.split(delimiter);
    }
  });

// Source: public/src/js/config.js
//Setting up route
angular.module('insight').config(function($routeProvider) {
  $routeProvider.
    when('/home', {
      templateUrl: 'views/home.html',
      title: 'Home'
    }).
    when('/block/:blockHash', {
      templateUrl: 'views/block.html',
      title: 'Bitcoin Block '
    }).
    when('/block-index/:blockHeight', {
      controller: 'BlocksController',
      templateUrl: 'views/redirect.html',
      title: 'Bitcoin Block '
    }).
    when('/tx/send', {
      templateUrl: 'views/transaction_sendraw.html',
      title: 'Broadcast Raw Transaction'
    }).
    when('/tx/:txId/:v_type?/:v_index?', {
      templateUrl: 'views/transaction.html',
      title: 'Bitcoin Transaction '
    }).
    when('/', {
      templateUrl: 'views/home.html',
      title: 'Home'
    }).
    when('/login', {
      templateUrl: 'views/login.html',
      title: 'Login',
      public: true
    }).
    when('/logout', {
      templateUrl: 'views/login.html',
      title: 'Login',
      public: true
    }).
    when('/blocks', {
      templateUrl: 'views/block_list.html',
      title: 'Blocks'
    }).
     when('/transcations', {
      templateUrl: 'views/transcation_list.html',
      title: 'transcations'
    }).
     when('/blocks-index', {
      templateUrl: 'views/index.html',
      title: 'blocks-index'
    }).
    when('/blocks-date/:blockDate/:startTimestamp?', {
      templateUrl: 'views/block_list.html',
      title: 'Bitcoin Blocks solved '
    }).
    when('/address/:addrStr', {
      templateUrl: 'views/address.html',
      title: 'Bitcoin Address '
    }).
    when('/status', {
      templateUrl: 'views/status.html',
      title: 'Status'
    }).
    when('/history', {
      templateUrl: 'views/history.html',
      title: 'History'
    }).
    when('/blacklists', {
      templateUrl: 'views/blacklists.html',
      title: 'Blacklists'
    }).
    when('/messages/verify', {
      templateUrl: 'views/messages_verify.html',
      title: 'Verify Message'
    })
    .otherwise({
      templateUrl: 'views/404.html',
      title: 'Error'
    });
});

//Setting HTML5 Location Mode
angular.module('insight')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  })
  .run(function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, gettextCatalog, amMoment, CurrentUser) {
    gettextCatalog.currentLanguage = defaultLanguage;
    amMoment.changeLocale(defaultLanguage);
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      var isPublic = next ? next.public : current.public;
      if (!isPublic) {
        CurrentUser.get({},function (res) {
          ngProgress.start();
          $rootScope.$broadcast('userLogin');
        }, function (err) {
          $rootScope.$broadcast('userLogout');
          $location.path('/login');
        });
      }
      
    });

    $rootScope.$on('$routeChangeSuccess', function() {
      ngProgress.complete();

      //Change page title, based on Route information
      $rootScope.titleDetail = '';
      $rootScope.title = $route.current.title;
      $rootScope.isCollapsed = true;
      $rootScope.currentAddr = null;

      $location.hash($routeParams.scrollTo);
      $anchorScroll();
    });
  });

// Source: public/src/js/init.js
angular.element(document).ready(function() {
  // Init the app
  // angular.bootstrap(document, ['insight']);
});

// Source: public/src/js/translations.js
angular.module('insight').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
    gettextCatalog.setStrings('de_DE', {"(Input unconfirmed)":"(Eingabe unbestätigt)","404 Page not found :(":"404 Seite nicht gefunden :(","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong> ist ein <a href=\"http://live.insight.is/\" target=\"_blank\">Open Source Bitcoin Blockchain Explorer</a> mit vollständigen REST und Websocket APIs um eigene Wallets oder Applikationen zu implementieren. Hierbei werden fortschrittlichere Abfragen der Blockchain ermöglicht, bei denen die RPC des Bitcoind nicht mehr ausreichen. Der aktuelle <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">Quellcode</a> ist auf Github zu finden.","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>insight</strong> befindet sich aktuell noch in der Entwicklung. Bitte sende alle gefundenen Fehler (Bugs) und Feedback zur weiteren Verbesserung an unseren <a href=\"https://github.com/bitpay/insight-ui/issues\" target=\"_blank\">Github Issue Tracker</a>.","About":"Über insight","Address":"Adresse","Age":"Alter","Application Status":"Programmstatus","Best Block":"Bester Block","Bitcoin node information":"Bitcoin-Node Info","Block":"Block","Block Reward":"Belohnung","Blocks":"Blöcke","Bytes Serialized":"Serialisierte Bytes","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"Es ist nicht möglich mit Bitcoind zu verbinden um live Aktualisierungen vom P2P Netzwerk zu erhalten. (Verbindungsversuch zu bitcoind an {{host}}:{{port}} ist fehlgeschlagen.)","Can't connect to insight server. Attempting to reconnect...":"Keine Verbindung zum insight-Server möglich. Es wird versucht die Verbindung neu aufzubauen...","Can't connect to internet. Please, check your connection.":"Keine Verbindung zum Internet möglich, bitte Zugangsdaten prüfen.","Complete":"Vollständig","Confirmations":"Bestätigungen","Conn":"Verbindungen","Connections to other nodes":"Verbindungen zu Nodes","Current Blockchain Tip (insight)":"Aktueller Blockchain Tip (insight)","Current Sync Status":"Aktueller Status","Details":"Details","Difficulty":"Schwierigkeit","Double spent attempt detected. From tx:":"Es wurde ein \"double Spend\" Versuch erkannt.Von tx:","Error!":"Fehler!","Fee":"Gebühr","Final Balance":"Schlussbilanz","Finish Date":"Fertigstellung","Go to home":"Zur Startseite","Hash Serialized":"Hash Serialisiert","Height":"Höhe","Included in Block":"Eingefügt in Block","Incoherence in levelDB detected:":"Es wurde eine Zusammenhangslosigkeit in der LevelDB festgestellt:","Info Errors":"Fehlerbeschreibung","Initial Block Chain Height":"Ursprüngliche Blockchain Höhe","Input":"Eingänge","Last Block":"Letzter Block","Last Block Hash (Bitcoind)":"Letzter Hash (Bitcoind)","Latest Blocks":"Letzte Blöcke","Latest Transactions":"Letzte Transaktionen","Loading Address Information":"Lade Adressinformationen","Loading Block Information":"Lade Blockinformation","Loading Selected Date...":"Lade gewähltes Datum...","Loading Transaction Details":"Lade Transaktionsdetails","Loading Transactions...":"Lade Transaktionen...","Loading...":"Lade...","Mined Time":"Block gefunden (Mining)","Mined by":"Gefunden von","Mining Difficulty":"Schwierigkeitgrad","Next Block":"Nächster Block","No Inputs (Newly Generated Coins)":"Keine Eingänge (Neu generierte Coins)","No blocks yet.":"Keine Blöcke bisher.","No matching records found!":"Keine passenden Einträge gefunden!","No. Transactions":"Anzahl Transaktionen","Number Of Transactions":"Anzahl der Transaktionen","Output":"Ausgänge","Powered by":"Powered by","Previous Block":"Letzter Block","Protocol version":"Protokollversion","Proxy setting":"Proxyeinstellung","Received Time":"Eingangszeitpunkt","Redirecting...":"Umleitung...","Search for block, transaction or address":"Suche Block, Transaktion oder Adresse","See all blocks":"Alle Blöcke anzeigen","Show Transaction Output data":"Zeige Abgänge","Show all":"Zeige Alles","Show input":"Zeige Eingänge","Show less":"Weniger anzeigen","Show more":"Mehr anzeigen","Size":"Größe","Size (bytes)":"Größe (bytes)","Skipped Blocks (previously synced)":"Verworfene Blöcke (bereits syncronisiert)","Start Date":"Startdatum","Status":"Status","Summary":"Zusammenfassung","Summary <small>confirmed</small>":"Zusammenfassung <small>bestätigt</small>","Sync Progress":"Fortschritt","Sync Status":"Syncronisation","Sync Type":"Art der Syncronisation","Synced Blocks":"Syncronisierte Blöcke","Testnet":"Testnet aktiv","There are no transactions involving this address.":"Es gibt keine Transaktionen zu dieser Adressse","Time Offset":"Zeitoffset zu UTC","Timestamp":"Zeitstempel","Today":"Heute","Total Amount":"Gesamtsumme","Total Received":"Insgesamt empfangen","Total Sent":"Insgesamt gesendet","Transaction":"Transaktion","Transaction Output Set Information":"Transaktions Abgänge","Transaction Outputs":"Abgänge","Transactions":"Transaktionen","Type":"Typ","Unconfirmed":"Unbestätigt","Unconfirmed Transaction!":"Unbestätigte Transaktion!","Unconfirmed Txs Balance":"Unbestätigtes Guthaben","Value Out":"Wert","Version":"Version","Waiting for blocks...":"Warte auf Blöcke...","Waiting for transactions...":"Warte auf Transaktionen...","by date.":"nach Datum.","first seen at":"zuerst gesehen am","mined":"gefunden","mined on:":"vom:","Waiting for blocks":"Warte auf Blöcke"});
    gettextCatalog.setStrings('es', {"(Input unconfirmed)":"(Entrada sin confirmar)","404 Page not found :(":"404 Página no encontrada :(","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong>  es un <a href=\"http://live.insight.is/\" target=\"_blank\">explorador de bloques de Bitcoin open-source</a> con un completo conjunto de REST y APIs de websockets que pueden ser usadas para escribir monederos de Bitcoins y otras aplicaciones que requieran consultar un explorador de bloques.  Obtén el código en <a href=\"http://github.com/bitpay/insight\" target=\"_blank\">el repositorio abierto de Github</a>.","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>insight</strong> esta en desarrollo aún, por ello agradecemos que nos reporten errores o sugerencias para mejorar el software. <a href=\"https://github.com/bitpay/insight-ui/issues\" target=\"_blank\">Github issue tracker</a>.","About":"Acerca de","Address":"Dirección","Age":"Edad","Application Status":"Estado de la Aplicación","Best Block":"Mejor Bloque","Bitcoin node information":"Información del nodo Bitcoin","Block":"Bloque","Block Reward":"Bloque Recompensa","Blocks":"Bloques","Bytes Serialized":"Bytes Serializados","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"No se pudo conectar a bitcoind para obtener actualizaciones en vivo de la red p2p. (Se intentó conectar a bitcoind de {{host}}:{{port}} y falló.)","Can't connect to insight server. Attempting to reconnect...":"No se pudo conectar al servidor insight. Intentando re-conectar...","Can't connect to internet. Please, check your connection.":"No se pudo conectar a Internet. Por favor, verifique su conexión.","Complete":"Completado","Confirmations":"Confirmaciones","Conn":"Con","Connections to other nodes":"Conexiones a otros nodos","Current Blockchain Tip (insight)":"Actual Blockchain Tip (insight)","Current Sync Status":"Actual Estado de Sincronización","Details":"Detalles","Difficulty":"Dificultad","Double spent attempt detected. From tx:":"Intento de doble gasto detectado. De la transacción:","Error!":"¡Error!","Fee":"Tasa","Final Balance":"Balance Final","Finish Date":"Fecha Final","Go to home":"Volver al Inicio","Hash Serialized":"Hash Serializado","Height":"Altura","Included in Block":"Incluido en el Bloque","Incoherence in levelDB detected:":"Detectada una incoherencia en levelDB:","Info Errors":"Errores de Información","Initial Block Chain Height":"Altura de la Cadena en Bloque Inicial","Input":"Entrada","Last Block":"Último Bloque","Last Block Hash (Bitcoind)":"Último Bloque Hash (Bitcoind)","Latest Blocks":"Últimos Bloques","Latest Transactions":"Últimas Transacciones","Loading Address Information":"Cargando Información de la Dirección","Loading Block Information":"Cargando Información del Bloque","Loading Selected Date...":"Cargando Fecha Seleccionada...","Loading Transaction Details":"Cargando Detalles de la Transacción","Loading Transactions...":"Cargando Transacciones...","Loading...":"Cargando...","Mined Time":"Hora de Minado","Mined by":"Minado por","Mining Difficulty":"Dificultad de Minado","Next Block":"Próximo Bloque","No Inputs (Newly Generated Coins)":"Sin Entradas (Monedas Recién Generadas)","No blocks yet.":"No hay bloques aún.","No matching records found!":"¡No se encontraron registros coincidentes!","No. Transactions":"Nro. de Transacciones","Number Of Transactions":"Número de Transacciones","Output":"Salida","Powered by":"Funciona con","Previous Block":"Bloque Anterior","Protocol version":"Versión del protocolo","Proxy setting":"Opción de proxy","Received Time":"Hora de Recibido","Redirecting...":"Redireccionando...","Search for block, transaction or address":"Buscar bloques, transacciones o direcciones","See all blocks":"Ver todos los bloques","Show Transaction Output data":"Mostrar dato de Salida de la Transacción","Show all":"Mostrar todos","Show input":"Mostrar entrada","Show less":"Ver menos","Show more":"Ver más","Size":"Tamaño","Size (bytes)":"Tamaño (bytes)","Skipped Blocks (previously synced)":"Bloques Saltados (previamente sincronizado)","Start Date":"Fecha de Inicio","Status":"Estado","Summary":"Resumen","Summary <small>confirmed</small>":"Resumen <small>confirmados</small>","Sync Progress":"Proceso de Sincronización","Sync Status":"Estado de Sincronización","Sync Type":"Tipo de Sincronización","Synced Blocks":"Bloques Sincornizados","Testnet":"Red de prueba","There are no transactions involving this address.":"No hay transacciones para esta dirección","Time Offset":"Desplazamiento de hora","Timestamp":"Fecha y hora","Today":"Hoy","Total Amount":"Cantidad Total","Total Received":"Total Recibido","Total Sent":"Total Enviado","Transaction":"Transacción","Transaction Output Set Information":"Información del Conjunto de Salida de la Transacción","Transaction Outputs":"Salidas de la Transacción","Transactions":"Transacciones","Type":"Tipo","Unconfirmed":"Sin confirmar","Unconfirmed Transaction!":"¡Transacción sin confirmar!","Unconfirmed Txs Balance":"Balance sin confirmar","Value Out":"Valor de Salida","Version":"Versión","Waiting for blocks...":"Esperando bloques...","Waiting for transactions...":"Esperando transacciones...","by date.":"por fecha.","first seen at":"Visto a","mined":"minado","mined on:":"minado el:","Waiting for blocks":"Esperando bloques"});
    gettextCatalog.setStrings('ja', {"(Input unconfirmed)":"(入力は未検証です)","404 Page not found :(":"404 ページがみつかりません (´・ω・`)","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong>は、bitcoind RPCの提供するものよりも詳細なブロックチェインへの問い合わせを必要とするウェブウォレットやその他のアプリを書くのに使える、完全なRESTおよびwebsocket APIを備えた<a href=\"http://live.insight.is/\" target=\"_blank\">オープンソースのビットコインブロックエクスプローラ</a>です。<a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">ソースコード</a>を確認","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>insight</strong>は現在開発中です。<a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">githubのissueトラッカ</a>にてバグの報告や改善案の提案をお願いします。","About":"はじめに","Address":"アドレス","Age":"生成後経過時間","An error occured in the verification process.":"検証過程でエラーが発生しました。","An error occured:<br>{{error}}":"エラーが発生しました:<br>{{error}}","Application Status":"アプリケーションの状態","Best Block":"最良ブロック","Bitcoin comes with a way of signing arbitrary messages.":"Bitcoinには任意のメッセージを署名する昨日が備わっています。","Bitcoin node information":"Bitcoinノード情報","Block":"ブロック","Block Reward":"ブロック報酬","Blocks":"ブロック","Broadcast Raw Transaction":"生のトランザクションを配信","Bytes Serialized":"シリアライズ後の容量 (バイト)","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"P2Pネットワークからライブ情報を取得するためにbitcoindへ接続することができませんでした。({{host}}:{{port}} への接続を試みましたが、失敗しました。)","Can't connect to insight server. Attempting to reconnect...":"insight サーバに接続できません。再接続しています...","Can't connect to internet. Please, check your connection.":"インターネットに接続できません。コネクションを確認してください。","Complete":"完了","Confirmations":"検証数","Conn":"接続数","Connections to other nodes":"他ノードへの接続","Current Blockchain Tip (insight)":"現在のブロックチェインのTip (insight)","Current Sync Status":"現在の同期状況","Details":"詳細","Difficulty":"難易度","Double spent attempt detected. From tx:":"二重支払い攻撃をこのトランザクションから検知しました：","Error message:":"エラーメッセージ:","Error!":"エラー！","Fee":"手数料","Final Balance":"最終残高","Finish Date":"終了日時","Go to home":"ホームへ","Hash Serialized":"シリアライズデータのハッシュ値","Height":"ブロック高","Included in Block":"取り込まれたブロック","Incoherence in levelDB detected:":"levelDBの破損を検知しました:","Info Errors":"エラー情報","Initial Block Chain Height":"起動時のブロック高","Input":"入力","Last Block":"直前のブロック","Last Block Hash (Bitcoind)":"直前のブロックのハッシュ値 (Bitcoind)","Latest Blocks":"最新のブロック","Latest Transactions":"最新のトランザクション","Loading Address Information":"アドレス情報を読み込んでいます","Loading Block Information":"ブロック情報を読み込んでいます","Loading Selected Date...":"選択されたデータを読み込んでいます...","Loading Transaction Details":"トランザクションの詳細を読み込んでいます","Loading Transactions...":"トランザクションを読み込んでいます...","Loading...":"ロード中...","Message":"メッセージ","Mined Time":"採掘時刻","Mined by":"採掘者","Mining Difficulty":"採掘難易度","Next Block":"次のブロック","No Inputs (Newly Generated Coins)":"入力なし (新しく生成されたコイン)","No blocks yet.":"ブロックはありません。","No matching records found!":"一致するレコードはありません！","No. Transactions":"トランザクション数","Number Of Transactions":"トランザクション数","Output":"出力","Powered by":"Powered by","Previous Block":"前のブロック","Protocol version":"プロトコルバージョン","Proxy setting":"プロキシ設定","Raw transaction data":"トランザクションの生データ","Raw transaction data must be a valid hexadecimal string.":"生のトランザクションデータは有効な16進数でなければいけません。","Received Time":"受信時刻","Redirecting...":"リダイレクトしています...","Search for block, transaction or address":"ブロック、トランザクション、アドレスを検索","See all blocks":"すべてのブロックをみる","Send transaction":"トランザクションを送信","Show Transaction Output data":"トランザクションの出力データをみる","Show all":"すべて表示","Show input":"入力を表示","Show less":"隠す","Show more":"表示する","Signature":"署名","Size":"サイズ","Size (bytes)":"サイズ (バイト)","Skipped Blocks (previously synced)":"スキップされたブロック (同期済み)","Start Date":"開始日時","Status":"ステータス","Summary":"概要","Summary <small>confirmed</small>":"サマリ <small>検証済み</small>","Sync Progress":"同期の進捗状況","Sync Status":"同期ステータス","Sync Type":"同期タイプ","Synced Blocks":"同期されたブロック数","Testnet":"テストネット","The message failed to verify.":"メッセージの検証に失敗しました。","The message is verifiably from {{verification.address}}.":"メッセージは{{verification.address}}により検証されました。","There are no transactions involving this address.":"このアドレスに対するトランザクションはありません。","This form can be used to broadcast a raw transaction in hex format over\n        the Bitcoin network.":"このフォームでは、16進数フォーマットの生のトランザクションをBitcoinネットワーク上に配信することができます。","This form can be used to verify that a message comes from\n        a specific Bitcoin address.":"このフォームでは、メッセージが特定のBitcoinアドレスから来たかどうかを検証することができます。","Time Offset":"時間オフセット","Timestamp":"タイムスタンプ","Today":"今日","Total Amount":"Bitcoin総量","Total Received":"総入金額","Total Sent":"総送金額","Transaction":"トランザクション","Transaction Output Set Information":"トランザクションの出力セット情報","Transaction Outputs":"トランザクションの出力","Transaction succesfully broadcast.<br>Transaction id: {{txid}}":"トランザクションの配信に成功しました。<br>トランザクションID: {{txid}}","Transactions":"トランザクション","Type":"タイプ","Unconfirmed":"未検証","Unconfirmed Transaction!":"未検証のトランザクションです！","Unconfirmed Txs Balance":"未検証トランザクションの残高","Value Out":"出力値","Verify":"検証","Verify signed message":"署名済みメッセージを検証","Version":"バージョン","Waiting for blocks...":"ブロックを待っています...","Waiting for transactions...":"トランザクションを待っています...","by date.":"日毎。","first seen at":"最初に発見された日時","mined":"採掘された","mined on:":"採掘日時:","(Mainchain)":"(メインチェーン)","(Orphaned)":"(孤立したブロック)","Bits":"Bits","Block #{{block.height}}":"ブロック #{{block.height}}","BlockHash":"ブロックのハッシュ値","Blocks <br> mined on:":"ブロック <br> 採掘日","Coinbase":"コインベース","Hash":"ハッシュ値","LockTime":"ロック時間","Merkle Root":"Merkleルート","Nonce":"Nonce","Ooops!":"おぉっと！","Output is spent":"出力は使用済みです","Output is unspent":"出力は未使用です","Scan":"スキャン","Show/Hide items details":"アイテムの詳細を表示または隠す","Waiting for blocks":"ブロックを待っています","by date. {{detail}} {{before}}":"日時順 {{detail}} {{before}}","scriptSig":"scriptSig","{{tx.confirmations}} Confirmations":"{{tx.confirmations}} 検証","<span class=\"glyphicon glyphicon-warning-sign\"></span> (Orphaned)":"<span class=\"glyphicon glyphicon-warning-sign\"></span> (孤立したブロック)","<span class=\"glyphicon glyphicon-warning-sign\"></span> Incoherence in levelDB detected: {{vin.dbError}}":"<span class=\"glyphicon glyphicon-warning-sign\"></span> Incoherence in levelDB detected: {{vin.dbError}}","Waiting for blocks <span class=\"loader-gif\"></span>":"ブロックを待っています <span class=\"loader-gif\"></span>"});
    gettextCatalog.setStrings('zh', {"(Input unconfirmed)":"输入未确定","404 Page not found :(":"404 页面不存在","<strong>insight</strong>  is an <a href=\"http://live.insight.is/\" target=\"_blank\">open-source Bitcoin blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by bitcoind RPC.  Check out the <a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\">source code</a>.":"<strong>insight</strong>是一个开源的比特币区块链浏览器。<a href=\"http://live.insight.is/\" target=\"_blank\">支持完整的REST和Web Socket API 调用，可用于编写Web钱包和其他需要比bitcoind RPC提供的更高级区块链查询的应用程序。查看源代码</a><a href=\"https://github.com/bitpay/insight-ui\" target=\"_blank\"></a>","<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">github issue tracker</a>.":"<strong>该系统</strong>仍在开发中<a href=\"https://github.com/bitpay/insight/issues\" target=\"_blank\">详情</a>发现问题或提供反馈请报告给我们的开发人员","About":"关于","Address":"地址","Age":"生成时间","An error occured in the verification process.":"验证过程出错","An error occured:<br>{{error}}":"发生错误<br>{{error}}","Application Status":"程序状态","Best Block":"最好的块","Bitcoin comes with a way of signing arbitrary messages.":"Bitcoin可以签名任意消息","Bitcoin node information":"比特币节点信息","Block":"区块","Block Reward":"块报酬","Blocks":"区块","Blocks Num":"区块数","Broadcast Raw Transaction":"广播原始交易","Bytes Serialized":"序列化后的大小 (B)","Can't connect to bitcoind to get live updates from the p2p network. (Tried connecting to bitcoind at {{host}}:{{port}} and failed.)":"无法连接到BitCoin P2P网络。(尝试{{host}}:{{port}} 连接失败)","Can't connect to insight server. Attempting to reconnect...":"无法连接到服务器，正在重试","Can't connect to internet. Please, check your connection.":"无法连接到因特网，请检查连接","Complete":"完成","Confirmations":"个确认","Conn":"连接数","Connections to other nodes":"连接数","Current Blockchain Tip (insight)":"当前区块链Tip(insight)","Current Sync Status":"当前同步状态","Details":"详情","Difficulty":"难度","Double spent attempt detected. From tx:":"检测到双花，来自tx:","Error message:":"错误消息:","Error!":"错误","Fee":"手续费","Final Balance":"钱包余额","Finish Date":"结束日期","Go to home":"回主页","Hash Serialized":"Hash序列化","Height":"高度","BlockHeight":"区块高度","Included in Block":"所在区块","Incoherence in levelDB detected:":"在levelDB中检测到不一致：","Info Errors":"错误信息","Initial Block Chain Height":"最新区块高度","Input":"输入","Last Block":"最新区块信息","Last Block Hash (Bitcoind)":"最新区块哈希(Bitcoind)","Latest Blocks":"最新区块","Latest Transactions":"最新交易","Loading Address Information":"加载地址信息","Loading Block Information":"加载区块信息","Loading Selected Date...":"加载选择日期...","Loading Transaction Details":"加载交易详情","Loading Transactions...":"加载交易...","Loading...":"加载中...","Message":"消息","Mined Time":"挖掘时间","Mined by":"矿池","Mining Difficulty":"挖矿难度","Next Block":"下一个区块","No Inputs (Newly Generated Coins)":"没有输入(新生产的币)","No blocks yet.":"尚无区块","No Transactions.":"尚无交易...","No matching records found!":"没找到匹配的记录","No. Transactions":"交易数量","Number Of Transactions":"交易数目","Output":"输出","Powered by":"Powered by","Previous Block":"上一个区块","Protocol version":"协议版本","Proxy setting":"代理设置","Raw transaction data":"原始交易数据","Raw transaction data must be a valid hexadecimal string.":"原始交易数据必须是有效的十六进制","Received Time":"接收时间","Redirecting...":"重定向中...","Search for block, transaction or address":"查询区块高度、区块哈希、交易哈希或地址","See all blocks":"查看所有区块","See all transcations":"查看所有交易","Send transaction":"发送交易","Show Transaction Output data":"显示交易输出数据","Show all":"显示所有","Show input":"显示输入","Show less":"隐藏","Show more":"显示更多","Signature":"签名","Size":"大小","Size (bytes)":"大小(字节)","Skipped Blocks (previously synced)":"已跳过块数量","Start Date":"开始时间","Status":"状态","Summary":"摘要","Summary <small>confirmed</small>":"摘要<small>已确认</small>","Sync Progress":"同步进度","Sync Status":"同步状态","Sync Type":"同步类型","Synced Blocks":"已同步块数量","Testnet":"Testnet","The message failed to verify.":"验证消息失败","The message is verifiably from {{verification.address}}.":"消息由{{verification.address}}验证","There are no transactions involving this address.":"此地址没有发生过交易","This form can be used to broadcast a raw transaction in hex format over\n        the Bitcoin network.":"此表单可用于以十六进制格式通过比特币网络广播一个原始事务。","This form can be used to verify that a message comes from\n        a specific Bitcoin address.":"此表单可用于验证消息是否来自特定的比特币地址。","Time Offset":"时间偏移","Timestamp":"交易时间","Today":"今天","Total Amount":"总数","Total Received":"总收入","Total Sent":"总支出","Transaction":"交易","Transaction Hash":"交易哈希","Transaction Output Set Information":"交易输出集合信息","Transaction Outputs":"交易输出","Transaction succesfully broadcast.<br>Transaction id: {{txid}}":"交易成功播报，<br>交易ID: {{txid}}","Transactions":"交易","Type":"类别","Unconfirmed":"未确认","Unconfirmed Transaction!":"未确认!","Unconfirmed Txs Balance":"未确认的交易余额","Value Out":"输出值","Verify":"验证","Verify signed message":"验证签名消息","Version":"版本","Waiting for blocks...":"等待区块...","Waiting for transactions...":"等待交易...","by date.":"按日期","first seen at":"最初发现于","mined":"挖掘","mined on:":"挖掘日期","Home":"首页","History":"历史","Blacklist":"黑名单","Network":"网络","syncing":"同步中","synced":"同步完成","Merkle Root":"Merkle根","Nonce":"随机数","Blockhash":"区块哈希","Fee Rate":"费率"});
/* jshint +W100 */
}]);