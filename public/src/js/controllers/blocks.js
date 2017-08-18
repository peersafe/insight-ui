'use strict';

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
