'use strict';

angular.module('insight.history').controller('HistoryController',
  function ($scope, $rootScope, $routeParams, HistoryService) {
    console.log("historys controller start");


      //Datepicker
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

    $scope.histories.forEach(function(history,index){
      $scope["datashow"+history.import_time]=true;
      history.idnum=index;
    })
    $scope.params = $routeParams;
    $scope.expand = function(showDiv,num,id){
        $scope["datashow"+showDiv] =!$scope["datashow"+showDiv];
        $scope.histories[id].limitpage=num;
    }
  });
