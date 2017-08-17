'use strict';

angular.module('insight.system').controller('HeaderController',
  function($scope, $rootScope, $modal, getSocket, Global, Block, locals) {
    $scope.global = Global;
    $scope.isLogin = locals.get('isLogin');

    $scope.$on('isLogin', function(d, data) {
      if (data === true) {
        $scope.isLogin = locals.get('isLogin');
        console.log('HEADER.isLogin=',$scope.isLogin)
      }
    });
    // $scope.$on('loginpage', function(d, data) {
    //   if (data === true) {
    //     $scope.isLogin = false;
    //     console.log('HEADER.loginpage.isLogin=',$scope.isLogin)
    //   }
    // });
    console.log('header.isLogin=',$scope.isLogin)

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
