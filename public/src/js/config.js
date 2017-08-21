'use strict';

//Setting up route
angular.module('insight').config(function($routeProvider) {
  $routeProvider.
    when('/home', {
      templateUrl: 'views/home.html',
      title: 'Home'
    }).
    when('/block/:blockHash', {
      templateUrl: 'views/block.html',
      title: 'Bitcoin Block '
    }).
    when('/block-index/:blockHeight', {
      controller: 'BlocksController',
      templateUrl: 'views/redirect.html',
      title: 'Bitcoin Block '
    }).
    when('/tx/send', {
      templateUrl: 'views/transaction_sendraw.html',
      title: 'Broadcast Raw Transaction'
    }).
    when('/tx/:txId/:v_type?/:v_index?', {
      templateUrl: 'views/transaction.html',
      title: 'Bitcoin Transaction '
    }).
    when('/', {
      templateUrl: 'views/home.html',
      title: 'Home'
    }).
    when('/login', {
      templateUrl: 'views/login.html',
      title: 'Login',
      public: true
    }).
    when('/logout', {
      templateUrl: 'views/login.html',
      title: 'Login',
      public: true
    }).
    when('/blocks', {
      templateUrl: 'views/block_list.html',
      title: 'Blocks'
    }).
     when('/transcations', {
      templateUrl: 'views/transcation_list.html',
      title: 'transcations'
    }).
     when('/blocks-index', {
      templateUrl: 'views/index.html',
      title: 'blocks-index'
    }).
    when('/blocks-date/:blockDate/:startTimestamp?', {
      templateUrl: 'views/block_list.html',
      title: 'Bitcoin Blocks solved '
    }).
    when('/address/:addrStr', {
      templateUrl: 'views/address.html',
      title: 'Bitcoin Address '
    }).
    when('/status', {
      templateUrl: 'views/status.html',
      title: 'Status'
    }).
    when('/history', {
      templateUrl: 'views/history.html',
      title: 'History'
    }).
    when('/blacklists', {
      templateUrl: 'views/blacklists.html',
      title: 'Blacklists'
    }).
    when('/messages/verify', {
      templateUrl: 'views/messages_verify.html',
      title: 'Verify Message'
    })
    .otherwise({
      templateUrl: 'views/404.html',
      title: 'Error'
    });
});

//Setting HTML5 Location Mode
angular.module('insight')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  })
  .run(function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, gettextCatalog, amMoment, CurrentUser) {
    gettextCatalog.currentLanguage = defaultLanguage;
    amMoment.changeLocale(defaultLanguage);
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      var isPublic = next ? next.public : current.public;
      console.log('#######', isPublic);
      if (!isPublic) {
        CurrentUser.get({},function (res) {
          ngProgress.start();
          $rootScope.$broadcast('userLogin');
        }, function (err) {
          $rootScope.$broadcast('userLogout');
          $location.path('/login');
        });
      }
      
    });

    $rootScope.$on('$routeChangeSuccess', function() {
      ngProgress.complete();

      //Change page title, based on Route information
      $rootScope.titleDetail = '';
      $rootScope.title = $route.current.title;
      $rootScope.isCollapsed = true;
      $rootScope.currentAddr = null;

      $location.hash($routeParams.scrollTo);
      $anchorScroll();
    });
  });
