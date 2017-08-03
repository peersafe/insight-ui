'use strict';

angular.module('insight.blacklist').controller('BlacklistController',
  function($scope, $rootScope, $routeParams, $location, Global) {
  $scope.global = Global;
  $scope.loading = false;

  $scope.humanSince = function(time) {
    var m = moment.unix(time).startOf('day');
    var b = moment().startOf('day');
    return m.max().from(b);
  };

  $scope.list = function() {
      console.log('blacklists ctr list start');

      $scope.loading = true;

    $rootScope.titleDetail = $scope.detail;

      console.log('blacklists ctr get res', res);
      $scope.loading = false;
      $scope.blacklists = [
          {
              id: 'blacklist.user.1',
              no: 1,
              addr: 'hash1',
              comment: '备注01',
              time: new Date()
          },
          {
              id: 'blacklist.user.2',
              no: 2,
              addr: 'hash2',
              comment: '备注2',
              time: new Date()
          },
          {
              id: 'blacklist.user.3',
              no: 3,
              addr: 'hash3',
              comment: '备注3',
              time: new Date()
          }];

    // Blacklists.get({
    //     blockDate: $routeParams.blockDate,
    //     startTimestamp: $routeParams.startTimestamp
    // }, function(res) {
    //   console.log('blacklists ctr get res', res);
    //   $scope.loading = false;
    //   $scope.blacklists = res.blacklists;
    //   $scope.pagination = res.pagination;
    // });
  };

  $scope.params = $routeParams;

});
