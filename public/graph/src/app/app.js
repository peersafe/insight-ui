/* eslint no-unused-vars: [1, {"args": "after-used"}] */
'use strict'

// HACK to disable transitions
// when the doc is not in view
function flushD3Transitions() {
  var now = Date.now
  Date.now = function() {
    return Infinity
  }

  d3.timer.flush()
  Date.now = now
}

var D3transition = d3.selection.prototype.transition
d3.selection.prototype.transition = function() {
  if (document.hidden) {
    setImmediate(flushD3Transitions)
  }

  return D3transition.apply(this, arguments)
}

// TODO: change landing.js and elsewhere
// to use local version
function commas(number, precision) {
  if (number === 0) {
    return 0
  } else if (!number) {
    return null
  }

  var parts = number.toString().split('.')

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  if (precision && parts[1]) {
    parts[1] = parts[1].substring(0, precision)
    while (precision > parts[1].length) {
      parts[1] += '0'
    }

  } else if (precision === 0) {
    return parts[0]
  }

  return parts.join('.')
}

// load stuff
angular.element(document).ready(function() {
  var api
  var banner
  var wrap
  var maintenance
  var bannerPads
  var started = false

  function checkStatus() {
    var mode = 'normal'
    // start the app
    if (!started && mode !== 'maintenance') {
      angular.bootstrap(document, ['ripplecharts'])
      started = true
    }

    maintenance
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .each('end', function() {
      maintenance.style('display', 'none')
    })

    // hide banner
  
    wrap.transition()
    .duration(1000)
    .style('height', '0px')

    bannerPads.transition()
    .duration(1000)
    .style('height', '0px')

    banner.transition()
    .duration(1000)
    .style('opacity', 0)
    .each('end', function() {
      banner.html('')
    })
  }

  setTimeout(function() {
    api = new ApiHandler(API)
    wrap = d3.select('.banner-wrap')
    banner = wrap.select('.banner')
    maintenance = d3.select('#maintenance')
    bannerPads = d3.selectAll('.banner-pad')
    checkStatus()
  })

  //setInterval(checkStatus, 60 * 1000)


  angular.module('ripplecharts', [
    'templates-app',
    'templates-common',
    'ripplecharts.graph',
    'ui.state',
    'ui.route',
    'rippleName'
  ])
  .config(["$urlRouterProvider", function myAppConfig($urlRouterProvider) {
    $urlRouterProvider.otherwise('/')
  }])
  .run(["$window", "$rootScope", function($window, $rootScope) {
    if (typeof navigator.onLine !== 'undefined') {
      $rootScope.online = navigator.onLine
      $window.addEventListener('offline', function() {
        $rootScope.$apply(function() {
          $rootScope.online = false
        })
      }, false)
      $window.addEventListener('online', function() {
        $rootScope.$apply(function() {
          $rootScope.online = true
        })
      }, false)
    }
  }])
  .controller('AppCtrl', ["$scope", function AppCtrl($scope) {
    $scope.theme = 'dark';
    $scope.$watch('theme', function() {
      store.set('theme', $scope.theme)
    })

    $scope.toggleTheme = function() {
      if ($scope.theme === 'dark') {
        $scope.theme = 'light'
      } else {
        $scope.theme = 'dark'
      }
    }

    $scope.snapOptions = {
      disable: 'right',
      maxPosition: 267
    }

    // disable touch drag for desktop devices
    if (!Modernizr.touch) {
      $scope.snapOptions.touchToDrag = false
    }

    $scope.ledgerLabel = 'connecting...'
    $scope.ledgerIndex = ''
    $scope.connectionStatus = 'disconnected'

  
    var loading = d3.select('#loading')
    loading.transition()
    .duration(600)
    .style('opacity', 0)
    .each('end', function() {
      loading.style('display', 'none')
    })

  }])
})
