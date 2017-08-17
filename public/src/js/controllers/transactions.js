'use strict';

angular.module('insight.transactions',['ngSanitize', 'ngCsv']).controller('transactionsController',
function($scope, $rootScope, $routeParams, $location, Global, Transaction, TransactionsByBlock, TransactionsByAddress,BlockByHeight,Blocks,Block,BlacklistService,Address,Status) {
  $scope.global = Global;
  $scope.loading = false;
  $scope.loadedBy = null;
  $scope.youShow=true;
  $scope.zuoShow=true;

  $scope.$on('isLogin', function(d, data) {
    if (data === true) {
      $scope.isLogin = locals.get('isLogin');
      console.log('HOME.isLogin=',$scope.isLogin)
    }
  });
  $scope.isLogin=locals.get('isLogin');
  console.log('home.islogin=',$scope.isLogin)
  console.log("transaction controller start",$scope.isLogin);


  var txdirection_you=true;
  var txdirection_zuo=true;

  var pageNum = 0;
  var pagesTotal = 1;
  var COIN = 100000000;
  var isHome=false;
 
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

  $scope.searchByAddr = function(){
      isHome=true;
      $scope.txs=[];
      pageNum = 0;
      _blackAddr();
     _byAddress();
  }

  var _blackAddr = function(){
      var addr = $scope.$$childHead.searchAddr;
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
      console.log("$scope.stime "+$scope.stime);
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
        items[i].notAddr = true;
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
    $scope.loading = false;

    pagesTotal = data.pagesTotal;
    pageNum += 1;
    data.txs.forEach(function(tx) {
      if(isHome){
        _processTX(tx);
        $scope.txs.push(tx);
      }else{
        //console.log("_Txdirection "+_Txdirection(tx));
        if(_Txdirection(tx)){
          _processTX(tx);
          $scope.txs.push(tx);
          $scope.exceltxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),value:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认数"});
          console.log(tx.time);
          $scope.exceladdtxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),valueIn:tx.valueIn + " BTC",valueOut:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认数"});
        }
      }
     
    });
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
                $scope.exceltxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),value:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认数"});
                $scope.exceladdtxs.push({hash:tx.txid,time:_formatTime(new Date(tx.time * 1000)),valueIn:tx.valueIn + " BTC",valueOut:tx.valueOut + " BTC",confirmations:tx.confirmations + "个确认数"});
             }
          }
      })
      if(txCount<10&&pageNum<Math.round(pagesTotal/10)){
        _byAddress();
      }else{
         $scope.loading = false;
      }
  }
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
      address = $scope.$$childHead.searchAddr;
    }
    TransactionsByAddress.get({
      address: address,
      pageNum: pageNum
    }, function(data) {
      if($scope.stime!=undefined||$scope.etime!=undefined){
        _TxByDate(data);
      }else{
        _paginate(data);
      }

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
      _initData();
  };
   //Load transactions for pagination
  $scope.loadTXByheight = function() {
      $scope.iscurheight = false;
      $scope.htxs= [];
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
      var m = moment.unix(time);
      return m.max().fromNow();
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
