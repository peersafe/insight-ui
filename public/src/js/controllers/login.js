'use strict';

angular.module('insight.login').controller('loginController',
    function($scope, $rootScope, $routeParams, $location,Account) {
    $rootScope.isLogin=false;
//依赖注入的内容 作用域 本地 账户信息 弹出提示 状态值
    $scope.login = function () {
      
       if ($scope.user && $scope.user.name && $scope.user.password) { //如果用户和用户名及密码都是正确的
         $location.path('/home');  
         $rootScope.isLogin=true;
          /*  Account.signIn($scope.user, function (data) {   //account.signIn是登录方法 登录后本地获取用户信息
                  console.log(data);
                    $localStorage.userId = data.userId;
                    $localStorage.username = data.name;
                    $localStorage.telephone = data.phone;
                    $location.path('/home');    //登录成功跳转页面
                },function(data){
                    if (data.code !== 200) {
                       // SweetAlert.swal("", "用户名或密码错误", "warning");
                        console.log(data);
                    }
                })
*/
        }
        else {
            //SweetAlert.swal("", "请重新输入用户名或密码", "warning");
        }
    }
})