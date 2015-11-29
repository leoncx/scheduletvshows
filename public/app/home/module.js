/*jslint browser: true*/
/*global angular*/

var homeModule = angular.module('stsApp.home', []);

homeModule
  .config(
    [
      '$routeProvider',
      function ($routeProvider) {
        'use strict';
        $routeProvider
          .when('/', {
            template: '',
            controller: 'HomeCtrl as homeCtrl'
          })
          .when('/about', {
            templateUrl: 'app/home/about.html',
            controller: 'AboutCtrl as aboutCtrl'
          })
      }
    ]
  )
  .controller(
    'HomeCtrl',
    [
      '$auth',
      '$location',
      function ($auth, $location) {
        if ($auth.isAuthenticated()) {
          $location.url('/show');
        } else {
          $location.url('/proposed');
        }
      }
    ]
  )
  .controller(
    'AboutCtrl',
    [
      function () {
      }
    ]
  );