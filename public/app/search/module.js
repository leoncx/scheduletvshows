/*jslint browser: true*/
/*global angular*/

var searchModule = angular.module('stsProvider.search', []);

searchModule
  .filter(
    'stsFilter',
    function () {
      'use strict';
      return function (input, search) {
        if (!input) { return input; }
        if (!search) { return input; }
        var titleSearch = search.name.toLocaleLowerCase();
        var result = [];
        /* Filter by search */
        angular.forEach(input, function (value) {
          var title = value.name.toLocaleLowerCase();
          if (titleSearch !== '' && title.indexOf(titleSearch) === -1) {
            return;
          }
          if (search.genres !== ''
              && value.genres.indexOf(search.genres) === -1) {
            return;
          }
          if (search.ended !== '' && value.ended != search.ended) {
            return;
          }
          if (search.uptodate !== '' && search.uptodate != value.uptodate) {
            return;
          }
          result.push(value);
        });
        return result;
      };
    }
  )
  .provider(
    '$searchService',
    [
      function () {
        'use strict';
        
        this.$get = [
          function () {
            var $search = {};
            $search.showSearch = false;
            $search.searchText = '';
            
            /**
             * Get if the search bar must be  display
             *
             * @return {bool}
             */
            $search.displaySearch = function () {
              return $search.showSearch;
            };
            
            /**
             * Toggle the search bar
             */
            $search.toggleSearch = function () {
              $search.showSearch = !$search.showSearch;
            };
            
            return $search;
          }
        ];
      }
    ]
  )
  .factory(
    '$filters',
    [
      function () {
        'use strict';
        var $filters = {};
        
        $filters.orderby = 'tosee';
        $filters.reverse = true;
        $filters.defaultSearch = {
          name: '',
          genres: '',
          ended: '',
          uptodate: '0'
        };
        
        $filters.search = {
          name: '',
          genres: '',
          ended: '',
          uptodate: '0'
        };
        
        /**
         * Load filters from localStorage or load default
         */
        $filters.loadFilters = function () {
        };
        
        /**
         * Reset the filters to default from app
         */
        $filters.resetFilters = function () {
          angular.forEach($filters.defaultSearch, function (value, key) {
            $filters.search[key] = value;
          });
        };
        
        return $filters;
      }
    ]
  )
  .controller(
    'FilterCtrl',
    [
      '$http',
      '$mdToast',
      '$filters',
      function ($http, $mdToast, $filters) {
        'use strict';
        var self = this;
        
        self.genres = [];
        self.filters = $filters;
        
        self.filters.loadFilters();
        
        /**
         * Load the list of genres
         */
        self.loadGenres = function () {
          $http.get('/api/genre')
            .then(function (data) {
              self.genres = data.data;
            })
            .catch(function (err) {
              var errMessage = 'An error has arrived during getting ' +
                'list of genres.';
              if (err.data.message) {
                errMessage = err.data.message;
              }
              $mdToast.show(
                $mdToast.simple()
                  .content(errMessage)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );
            });
        };
        
        self.loadGenres();
      }
    ]
  );