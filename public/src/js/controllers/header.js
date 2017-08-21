'use strict';

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
