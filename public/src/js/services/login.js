'use strict';

angular.module('insight.login')
  .factory('Account',
    function ($resource, Service) {
      console.log("Service:", Service.apiPrefix)
      return $resource(Service.apiPrefix + '/user');
    })
  .factory('locals',['$window',function($window){
    return{        //存储单个属性
      set :function(key,value){
        $window.localStorage[key]=value;
      },        //读取单个属性
      get:function(key,defaultValue){
        return  $window.localStorage[key] || defaultValue;
      },        //存储对象，以JSON格式存储
      setObject:function(key,value){
        $window.localStorage[key]=JSON.stringify(value);
      },        //读取对象
      getObject: function (key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }

    }
  }]);
