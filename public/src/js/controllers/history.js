'use strict';

angular.module('insight.history').controller('HistoryController',
  function ($scope, $rootScope, $routeParams, HistoryService, locals) {
    $scope.isLogin = locals.get('isLogin')

    //Datepicker
    console.log("historys controller start",$scope.isLogin);


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
          console.log($scope.histories)
        }
      });
    }
    $scope.list();

    $scope.expand = function (num, id) {
      $scope.histories[id].limitpage = num;
      console.log('$scope.histories[id]=', $scope.histories[id])
    }

    $scope.params = $routeParams;

  });
