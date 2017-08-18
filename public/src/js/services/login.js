'use strict';

angular.module('insight.login')
  .factory('CurrentUser',
    function ($resource, Service) {
      // console.log("Service:", Service.apiPrefix)
      return $resource(Service.apiPrefix + '/currentuser');
    })
  .factory('Account',
    function ($resource, Service) {
      // console.log("Service:", Service.apiPrefix)
      return $resource(Service.apiPrefix + '/user');
    });
