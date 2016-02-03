/*jslint browser: true*/
/*global angular*/

var headerModule = angular.module('stsApp.header', []);

headerModule
  .controller(
    'HeaderCtrl',
    [
      '$window',
      '$auth',
      '$searchService',
      '$mdSidenav',
      '$mdBottomSheet',
      '$location',
      '$rootScope',
      '$shows',
      function ($window, $auth, $searchService, $mdSidenav,
                $mdBottomSheet, $location, $rootScope, $shows) {
        'use strict';
        var self = this;
        this.showSearch = $searchService.displaySearch;
        this.toggleSearch = $searchService.toggleSearch;
        this.tabSelected = -1;
        this.$shows = $shows;
                
        /**
         * Return if the user is authenticated
         *
         * @return {boolean}
         */
        this.isAuthenticated = function () {
          return $auth.isAuthenticated();
        };
        
        /**
         * If display tab sub toolbar
         *
         * @return {boolean}
         */
        this.displayTabs = function () {
          var notDisplay = [
            '/signin',
            '/signup',
            '/validate'
          ];
          
          if (notDisplay.indexOf($location.path()) !== -1) {
            return false;
          }
          return true;
        };
        
        /**
         * Toggle the filters side bar
         */
        this.toggleFilters = function () {
          $mdSidenav('filters')
            .toggle();
        };
        
        /**
         * Signout action
         */
        this.signout = function () {
          $auth
            .logout()
            .then(function () {
              $location.url('/');
            });
        };
        
        /**
         * Display the add form show
         */
        this.addShow = function () {
          $mdBottomSheet.show({
            templateUrl: 'app/show/add-form.html',
            controller: 'AddShowCtrl as addShowCtrl'
          });
        };
        
        /**
         * Go to the url
         *
         * @param {string} url - The url to switch
         */
        this.go = function (url) {
          $location.url(url);
        };
        
        this.back = function () {
          if ($window.history.length > 0) {
            $window.history.back();
          }
          $location.url('/');
        };
        
        $rootScope.$on('$locationChangeSuccess', function () {
          var path = $location.path();
          var other = [
            '/profile',
            '/about'
          ];
          if (path === '/show') {
            self.tabSelected = 0;
            return;
          }
          if (path === '/proposed') {
            self.tabSelected = 1;
            return;
          }
          if (path === '/tonight') {
            self.tabSelected = 2;
            return;
          }
          if (other.indexOf(path) !== -1) {
            self.tabSelected = -1;
            return;
          }
          self.tabSelected = -2;
        });
      }
    ]
  )
  .controller(
    'SearchCtrl',
    [
      '$searchService',
      '$filters',
      function ($searchService, $filters) {
        'use strict';
        this.filters = $filters;
        this.showSearch = $searchService.displaySearch;
        this.toggleSearch = function () {
          if ($searchService.displaySearch()) {
            this.filters.search.name = '';
          }
          $searchService.toggleSearch();
        };
      }
    ]
  );