'use strict';

angular.module('insight.login').controller('loginController',
  function ($scope, $rootScope, $routeParams, $location, Account, locals) {
    $scope.isLogin = locals.get('isLogin');
    console.log('$routeParams=',$routeParams)
    console.log('login.isLogin=',$scope.isLogin)
    // $scope.$emit('loginpage', true)


    //依赖注入的内容 作用域 本地 账户信息 弹出提示 状态值
    $scope.login = function () {

      // $scope.verifyError = "";
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
          if (res.code === -101) {
            $scope.accountError = "账号不存在"
            $scope.passwordError = ""
            $scope.user.name = '';
          } else if (res.code === -102) {
            $scope.accountError = ""
            $scope.passwordError = "密码错误"
            $scope.user.password = '';
          } else if (res.code === 0) {
            //存储数据
            locals.set("isLogin", true);
            //读取数据
            console.log('local:islogin ===',locals.get("isLogin"));
            $location.path('/home');
            $scope.$emit('isLogin', true);
            $scope.isLogin = true;
          }

        });

      }
      else {
        //SweetAlert.swal("", "请重新输入用户名或密码", "warning");
      }
    }
  })