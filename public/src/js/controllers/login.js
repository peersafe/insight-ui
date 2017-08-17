'use strict';

angular.module('insight.login').controller('loginController',
  function ($scope, $rootScope, $routeParams, $location, Account, locals) {
    $scope.isLogin = locals.get('isLogin');
    console.log('$routeParams=',$routeParams)
    console.log('login.isLogin=',$scope.isLogin)



    //依赖注入的内容 作用域 本地 账户信息 弹出提示 状态值
    $scope.login = function () {

      $scope.verifyError = "";
      $scope.accountError = "";
      $scope.passwordError = "";

      // console.log('login user info:', $scope.user.name, $scope.user.password);
      if(!$scope.user.name){
        $scope.accountError = "请填写账号"
      }
      if(!$scope.user.password){
        $scope.passwordError = "请填写密码"
      }
      if ($scope.user && $scope.user.name && $scope.user.password) {
        Account.get({
          name: $scope.user.name,
          password: $scope.user.password
        }, function(res) {
          // console.log('res',res)
          if (res.code != 0) {
            $scope.verifyError = "账号或密码错误";
            $scope.user.name = '';
            $scope.user.password = '';
          } else {
            //存储数据
            locals.set("isLogin", true);
            //读取数据
            console.log('local:islogin ===',locals.get("isLogin"));
            $location.path('/home');
          }

        });

      }
      else {
        //SweetAlert.swal("", "请重新输入用户名或密码", "warning");
      }
    }
  })