'use strict';

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
