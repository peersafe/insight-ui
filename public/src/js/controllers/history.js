'use strict';

angular.module('insight.history').controller('HistoryController',
  function ($scope, $rootScope, $routeParams, HistoryService) {

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

  });
