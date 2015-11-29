/*jslint browser: true*/
/*global angular*/

var stsApp = angular.module('stsApp', [
  'ngMaterial',
  'ngRoute',
  'ngAnimate',
  'ngMessages',
  'ngMdIcons',
  'satellizer',
  'angularjs-gravatardirective',
  'angular-loading-bar',
  'nvd3',
  'angulartics',
  'angulartics.google.analytics',
  
  'stsProvider.search',
  'stsDirective.match',
  'stsApp.header',
  'stsApp.user',
  'stsApp.show',
  'stsApp.home'
]);

stsApp
  .config(
    [
      '$mdThemingProvider',
      '$routeProvider',
      '$locationProvider',
      '$authProvider',
      function ($mdThemingProvider, $routeProvider,
                $locationProvider, $authProvider) {
        'use strict';

        /* Initialize material theme */
        $mdThemingProvider.theme('default')
          .primaryPalette('indigo')
          .accentPalette('teal');

        /* Initialize routing */
        $locationProvider.html5Mode(true);
        $routeProvider.otherwise({
          redirectTo: '/'
        });
        
        /* Initialize authentication */
        $authProvider.storageType = 'localStorage';
        /* Configuration for authentication */
        $authProvider.loginOnSignup = false;
        $authProvider.loginRoute = '/signin';
        $authProvider.loginUrl = '/api/user/signin';
        $authProvider.signupUrl = '/api/user/signup';
      }
    ]
  )
  .run(
    [
      '$rootScope',
      '$location',
      '$auth',
      '$mdSidenav',
      function ($rootScope, $location, $auth, $mdSidenav) {
        'use strict';
        
        $rootScope.$on('$routeChangeStart', function (event, next, current) {
          if (next.hasOwnProperty('$$route') && next.$$route.hasOwnProperty('auth')) {
            if (false === next.$$route.auth && $auth.isAuthenticated()) {
              $location.url('/');
            }
            if (true === next.$$route.auth && !$auth.isAuthenticated()) {
              $location.url('/');
            }
          }
        });
      }
    ]
  );