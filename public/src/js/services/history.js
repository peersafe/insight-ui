'use strict';

angular.module('insight.history')
    .factory('HistoryService',
      function ($resource, Service) {
        // console.log("Service:", Service.apiPrefix)
        return $resource(Service.apiPrefix + '/history/histories');
      })
    .factory('History',
      function ($resource, Service) {
        return $resource(Service.apiPrefix + '/history');
      });
