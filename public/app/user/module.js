/*jslint browser: true*/
/*global angular*/

var userModule = angular.module('stsApp.user', []);

userModule
  .config(
    [
      '$routeProvider',
      function ($routeProvider) {
        'use strict';
        $routeProvider
          .when('/signin', {
            templateUrl: 'app/user/signin.html',
            controller: 'SigninCtrl as signinCtrl',
            auth: false
          })
          .when('/signup', {
            templateUrl: 'app/user/signup.html',
            controller: 'SignupCtrl as signupCtrl',
            auth: false
          })
          .when('/profile', {
            templateUrl: 'app/user/profile.html',
            controller: 'ProfileCtrl as profileCtrl',
            auth: true
          })
          .when('/validate', {
            templateUrl: 'app/user/validate.html',
            controller: 'ValidateCtrl as validateCtrl',
            auth: false
          });
      }
    ]
  )
  .controller(
    'SigninCtrl',
    [
      '$auth',
      '$location',
      function ($auth, $location) {
        'use strict';
        var self = this;
        self.error = '';
        
        /**
         * Submit form for signin
         */
        self.signin = function () {
          self.error = '';
          if (!self.signinForm.$valid) {
            self.error = 'Email or password are malformated.';
            return;
          }
          $auth
            .login({
              email: self.user.email,
              password: self.user.password
            })
            .then(function () {
              $location.url('/');
            })
            .catch(function (resp) {
              if (resp.data.message) {
                self.error = resp.data.message;
              } else {
                self.error = resp.data;
              }
            });
        };
      }
    ]
  )
  .controller(
    'SignupCtrl',
    [
      '$auth',
      function ($auth) {
        'use strict';
        var self = this;
        self.error = '';
        self.success = '';
        
        /**
         * Submit form for signup
         */
        self.signup = function () {
          self.error = '';
          self.success = '';
          if (!self.signupForm.$valid) {
            self.error = 'A field is malformated.';
            setDirty(self.signupForm);
            return;
          }
          $auth
            .signup({
              email: self.user.email,
              password: self.user.password
            })
            .then(function () {
              self.success = "Your account has been created. You must receive an email for account activation.";
            })
            .catch(function (resp) {
              if (resp.data.message) {
                self.error = resp.data.message;
              } else {
                self.error = resp.data;
              }
            });
        };
        
        /**
         * Reset form for signup
         */
        self.reset = function () {
          self.error = '';
          self.success = '';
          setPristine(self.signupForm);
        };
      }
    ]
  )
  .controller(
    'ProfileCtrl',
    [
      '$http',
      function ($http) {
        'use strict';
        var self = this;
        var intFormat = function (d) {
          return d3.format('d')(d);
        };
        var chartColors = [
          '#80CBC4',
          '#4DB6AC',
          '#26A69A',
          '#009688',
          '#00897B',
          '#00796B',
          '#00695C',
          '#004D40'
        ];
        d3.scale.chartColor = function() {
          return d3.scale.ordinal().range(chartColors);
        };
        self.error = '';
        self.success = '';
        
        self.configChart = {
          refreshDataOnly: false,
          deepWatchData: true
        };
        
        self.chart = {
          watched: {
            chart: {
              type: 'pieChart',
              showLabels: true,
              transitionDuration: 500,
              x: function (d) { return d.key; },
              y: function (d) { return d.value; },
              valueFormat: intFormat,
              height: 250,
              color: d3.scale.chartColor().range()
            }
          },
          ended: {
            chart: {
              type: 'pieChart',
              showLabels: true,
              transitionDuration: 500,
              x: function (d) { return d.key; },
              y: function (d) { return d.value; },
              valueFormat: intFormat,
              height: 250,
              color: d3.scale.chartColor().range()
            }
          },
          genres: {
            chart: {
              type: 'discreteBarChart',
              showLabels: true,
              transitionDuration: 500,
              x: function (d) { return d.name; },
              y: function (d) { return d.nb; },
              valueFormat: intFormat,
              height: 250,
              showValues: true,
              color: d3.scale.chartColor().range()
            }
          }
        };
        
        self.data = {
          watched: [],
          genres: [],
          ended: []
        };
        
        $http.get('/api/user/stats')
          .then(function (data) {
            /* Data for watched episodes chart */
            self.data.watched.push({
              key: 'Watched',
              value: data.data.episodes.watched
            });
            self.data.watched.push({
              key: 'To watch',
              value: data.data.episodes.total - data.data.episodes.watched
            });
          
            /* Data for ended or update TV Shows */
            self.data.ended.push({
              key: 'Ended and uptodate',
              value: data.data.statusShows.ended.uptodate
            });
            self.data.ended.push({
              key: 'Ended and not uptodate',
              value: data.data.statusShows.ended.notUptodate
            });
            self.data.ended.push({
              key: 'In diffusion and uptodate',
              value: data.data.statusShows.inDiffusion.uptodate
            });
            self.data.ended.push({
              key: 'In diffusion and not uptodate',
              value: data.data.statusShows.inDiffusion.notUptodate
            });
          
            /* Data for genres charts */
            self.data.genres = [
              {
                key: "Genres",
                values: data.data.genres
              }
            ];
          });
        
        /* Submit change password */
        self.save = function () {
          self.error = '';
          self.success = '';
          if (!self.profileForm.$valid) {
            self.error = 'A field is malformated.';
            setDirty(self.profileForm);
            return;
          }
          $http
            .patch(
              '/api/user',
              {
                password: self.user.password
              }
            )
            .then(function () {
              self.user.password = null;
              self.user.confirm = null;
              /* TODO Problem to setPristine */
              setPristine(self.profileForm);
              self.success = 'Your profile has be saved.'
            })
            .catch(function () {
              self.error = 'Error to save your profile.';
            });
        };
        
        /**
         * Reset form for signup
         */
        self.reset = function () {
          self.error = '';
          self.success = '';
          setPristine(self.profileForm);
        };
      }
    ]
  )
  .controller(
    'ValidateCtrl',
    [
      '$http',
      '$location',
      function ($http, $location) {
        'use strict';
        var self = this;
        var token = ($location.search()).token;
        self.success = '';
        self.error = '';
        
        $http.get('/api/user/validate?token=' + token)
          .then(function () {
            self.success = 'Your account is validated.';
          })
          .catch(function (resp) {
            self.error = resp.data.message;
          });
      }
    ]
  );