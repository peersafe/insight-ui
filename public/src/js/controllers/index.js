'use strict';

var TRANSACTION_DISPLAYED = 6;
var BLOCKS_DISPLAYED = 8;

angular.module('insight.system').controller('IndexController',
  function($scope, Global, getSocket,Block, Blocks,Status,TransactionsByBlock/*,BlackByAddr*/) {
    $scope.global = Global;
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



    $scope.humanSince = function(time) {
      var m = moment.unix(time);
      return m.max().fromNow();
    };

    $scope.index = function() {
      //_getBlocks();
       _initData();
      _startSocket();
    };

    $scope.txs = [];
    $scope.blocks = [];
  });
