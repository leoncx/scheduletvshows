/*jslint browser: true*/
/*global angular*/

var showModule = angular.module('stsApp.show', []);

showModule
  .config(
    [
      '$routeProvider',
      '$filterProvider',
      function ($routeProvider, $filterProvider) {
        'use strict';
        $routeProvider
          .when('/show', {
            templateUrl: 'app/show/shows.html',
            controller: 'ShowsCtrl as showsCtrl',
            auth: true
          })
          .when('/proposed', {
            templateUrl: 'app/show/shows.html',
            controller: 'ProposedCtrl as showsCtrl'
          })
          .when('/tonight', {
            templateUrl: 'app/show/shows.html',
            controller: 'TonightCtrl as showsCtrl',
            auth: true
          })
          .when('/show/:slug', {
            templateUrl: 'app/show/show.html',
            controller: 'ShowCtrl as showCtrl',
            auth: true
          });
        $filterProvider.register('basename', function () {
          return function (url) {
            return ((url=/(([^\/\\\.#\? ]+)(\.\w+)*)([?#].+)?$/.exec(url))!= null)? url[1]: '';
          };
        });
      }
    ]
  )
  .factory(
    '$shows',
    [
      '$http',
      '$location',
      '$filter',
      '$mdToast',
      '$filters',
      function ($http, $location, $filter, $mdToast, $filters) {
        'use strict';
        var $shows = {};
        
        $shows.orderBy = $filter('orderBy');
        $shows.filter = $filter('stsFilter');
        $shows.shows = {};
        $shows.listEpisodes = {};
        
        /**
         * Search a new show
         *
         * @param {string} show - The show title to search
         * @return {Promise}
         */
        $shows.search = function (show) {
          return $http.post('/api/show/search', {search: show});
        };
        
        /**
         * Subcribe a show
         *
         * @param {object} show - The show to subcribe
         * @return {Promise}
         */
        $shows.subcribe = function (showId) {
          return $http.put('/api/user/subcribe', { showid: showId});
        };
        
        /**
         * Unsubcribe a Show
         * 
         * @param {object} show - The show object
         * @return {Promise}
         */
        $shows.unsubcribe = function (showId) {
          return $http.delete('/api/user/unsubcribe/' + showId);
        };
        
        /**
         * Load show for an user
         */
        $shows.loadShows = function () {
          $http.get('/api/show')
            .then(function (data) {
              $shows.shows = data.data;
            })
            .catch(function (err) {
              var errMessage = 'An error has arrived during getting your shows list.';
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
        
        /**
         * Get the list of shows for an user
         *
         * @return {array}
         */
        $shows.getShows = function () {
          var shows = $shows.shows;
          shows = $shows.filter(shows, $filters.search);
          return $shows.orderBy(shows, $filters.orderby, $filters.reverse);
        };
        
        /**
         * Load proposed show
         */
        $shows.loadProposed = function () {
          $http.get('/api/show/proposed')
            .then(function (data) {
              $shows.shows = data.data;
            })
            .catch(function (err) {
              var errMessage = 'An error has arrived during getting proposed shows.';
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
        
        /**
         * Load tonight show
         */
        $shows.loadNight = function () {
          $http.get('/api/show/today')
            .then(function (data) {
              $shows.shows = data.data;
            })
            .catch(function (err) {
              var errMessage = 'An error has arrived during getting tonight shows.';
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
        
        /**
         * Reload the list for current page
         */
        $shows.reload = function () {
          if ($location.url() === '/show') {
            $shows.loadShows();
          } else if ($location.url() === '/proposed') {
            $shows.loadProposed();
          } else if ($location.url() === '/tonight') {
            $shows.loadNight();
          }
        };
        
        /**
         * Load the list of episodes for a show
         *
         * @param {string} slug - The show slug name
         */
        $shows.loadEpisodeList = function (slug) {
          $http.get('/api/show/info/' + slug)
            .then(function (data) {
              $shows.listEpisodes = data.data;
            })
            .catch(function (err) {
              var errMessage = 'An error has arrived during getting list of episodes.';
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
        
        /**
         * Get the list of episodes for a show
         *
         * @return {array}
         */
        $shows.getEpisodesList = function () {
          return $shows.listEpisodes;
        };
        
        /**
         * Get current title
         *
         * @return {string}
         */
        $shows.getCurrentTitle = function () {
          if ($shows.listEpisodes.hasOwnProperty('name')) {
            return $shows.listEpisodes.name;
          }
          return '';
        };
        
        /**
         * Get current show id
         *
         * @param {integer}
         */
        $shows.getCurrentShowId = function () {
          if ($shows.listEpisodes.hasOwnProperty('id')) {
            return $shows.listEpisodes.id;
          }
          return 0;
        }
        
        /**
         * Reset the shows list and episodes list
         */
        $shows.reset = function () {
          $shows.shows = {};
          $shows.proposed = {};
          $shows.tonight = {};
          $shows.listEpisodes = {};
        };
        
        /**
         * Set to watch an episode
         *
         * @param {integer} showId - The show Id
         * @param {string} episode - The episode string 
         *                           (next for the next episode or S01E01)
         * @return {Promise}
         */
        $shows.watch = function (showId, episode) {
          return $http.put(
            '/api/show/episode/' + showId,
            {
              episode: episode
            }
          );
        };
        
        /**
         * Set to unwatch an episode
         *
         * @param {integer} showId - The show Id
         * @param {string} episode - The episode string 
         *                           (next for the next episode or S01E01)
         * @return {Promise}
         */
        $shows.unwatch = function (showId, episode) {
          return $http.delete(
            '/api/show/episode/' + showId + '/' + episode
          );
        };
        
        return $shows;
      }
    ]
  )
  .controller(
    'AddShowCtrl',
    [
      '$shows',
      '$mdToast',
      function ($shows, $mdToast) {
        'use strict';
        var self = this;
        self.shows = [];
        
        /**
         * Function for search a new show
         */
        self.search = function () {
          $shows.search(self.searchStr)
            .then(function (data) {
              self.shows = data.data.map(function (show) {
                if (show.subcribed) {
                  show.icon = 'remove_circle_outline';
                } else {
                  show.icon = 'playlist_add';
                }
                return show;
              });
            })
            .catch(function (err) {
              self.shows = [];
              if (err.status === 404) {
                $mdToast.show(
                  $mdToast.simple()
                    .content('No TV Shows found')
                    .position('top right')
                    .hideDelay(2000)
                );
              }
            });
        };
        
        /**
         * Toggle subcribe for a show
         *
         * @param {object} show - The show to subcribe
         */
        self.toggleSubcription = function (show) {
          if (show.subcribed) {
            $shows.unsubcribe(show.id)
              .then(function () {
                show.subcribed = false;
                show.icon = 'playlist_add';
                $shows.reload();
                $mdToast.show(
                  $mdToast.simple()
                    .content('You have unsubcribe to the TVShow ' + show.name)
                    .position('top right')
                    .hideDelay(1500)
                    .theme('success')
                );
              })
              .catch(function (err) {
                $mdToast.show(
                  $mdToast.simple()
                    .content(err.data.message)
                    .position('top right')
                    .hideDelay(1500)
                    .theme('danger')
                );
              });
          } else {
            $shows.subcribe(show.id)
              .then(function () {
                show.subcribed = true;
                show.icon = 'remove_circle_outline';
                $shows.reload();
                $mdToast.show(
                  $mdToast.simple()
                    .content('You have subcribe to the TVShow ' + show.name)
                    .position('top right')
                    .hideDelay(1500)
                    .theme('success')
                );
              })
              .catch(function (err) {
                $mdToast.show(
                  $mdToast.simple()
                    .content(err.data.message)
                    .position('top right')
                    .hideDelay(1500)
                    .theme('danger')
                );
              });
          }
        };
      }
    ]
  )
  .controller(
    'ShowsCtrl',
    [
      '$shows',
      '$auth',
      '$mdToast',
      function ($shows, $auth, $mdToast) {
        'use strict';
        var self = this;
        $shows.reset();
        $shows.loadShows();
        self.getShows = $shows.getShows;
        
        self.isAuthenticated = function () {
          return $auth.isAuthenticated();
        };
        
        /**
         * Unsubcribe a show
         * 
         * @param {object} show - The show to unsubcribe
         */
        self.unsubcribe = function (show) {
          $shows.unsubcribe(show.id)
            .then(function () {
              show.display = false;
            })
            .catch(function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Error when unsubcribe ' + show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );    
            });
        };
        
        /**
         * Watch next episode
         *
         * @param {show} - The show to watch the next episode
         */
        self.next = function (show) {
          $shows.watch(show.id, 'next')
            .then(function (data) {
              show.tosee = show.tosee - 1;
              $mdToast.show(
                $mdToast.simple()
                  .content('Season ' + data.data.season +
                           ' episode ' + data.data.episode +
                           ' of ' + show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('success')
              );
            })
            .catch(function (data) {
              if (data.status === 404) {
                return $mdToast.show(
                  $mdToast.simple()
                    .content('No episode to watch')
                    .position('top right')
                    .hideDelay(1500)
                    .theme('info')
                );
              }
              $mdToast.show(
                $mdToast.simple()
                  .content('Error save to watch the next episode of ' + 
                           show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );
            });
        };
      }
    ]
  )
  .controller(
    'ProposedCtrl',
    [
      '$shows',
      '$auth',
      '$mdToast',
      function ($shows, $auth, $mdToast) {
        'use strict';
        var self = this;
        $shows.reset();
        $shows.loadProposed();
        self.getShows = $shows.getShows;
        
        self.isAuthenticated = function () {
          return $auth.isAuthenticated();
        };
        
        /**
         * Subcribe a show
         * 
         * @param {object} show - The show to subcribe
         */
        self.subcribe = function (show) {
          $shows.subcribe(show.id)
            .then(function () {
              show.display = false;
            })
            .catch(function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Error when subcribe ' + show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );    
            });
        };
      }
    ]
  )
  .controller(
    'TonightCtrl',
    [
      '$shows',
      '$auth',
      '$mdToast',
      function ($shows, $auth, $mdToast) {
        'use strict';
        var self = this;
        $shows.reset();
        $shows.loadNight();
        self.getShows = $shows.getShows;
        
        self.isAuthenticated = function () {
          return $auth.isAuthenticated();
        };
        
        /**
         * Unsubcribe a show
         * 
         * @param {object} show - The show to unsubcribe
         */
        self.unsubcribe = function (show) {
          $shows.unsubcribe(show.id)
            .then(function () {
              show.display = false;
            })
            .catch(function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Error when unsubcribe ' + show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );    
            });
        };
        
        /**
         * Watch next episode
         *
         * @param {show} - The show to watch the next episode
         */
        self.next = function (show) {
          $shows.watch(show.id, 'next')
            .then(function (data) {
              show.tosee = show.tosee - 1;
              $mdToast.show(
                $mdToast.simple()
                  .content('Season ' + data.data.season +
                           ' episode ' + data.data.episode +
                           ' of ' + show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('success')
              );
            })
            .catch(function (data) {
              if (data.status === 404) {
                return $mdToast.show(
                  $mdToast.simple()
                    .content('No episode to watch')
                    .position('top right')
                    .hideDelay(1500)
                    .theme('info')
                );
              }
              $mdToast.show(
                $mdToast.simple()
                  .content('Error save to watch the next episode of ' + 
                           show.name)
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );
            });
        };
      }
    ]
  )
  .controller(
    'ShowCtrl',
    [
      '$routeParams',
      '$shows',
      '$mdToast',
      function ($routeParams, $shows, $mdToast) {
        'use strict';
        var self = this;
        $shows.reset();
        $shows.loadEpisodeList($routeParams.slug);
        self.show = $shows.getEpisodesList;
        
        /**
         * Set to watch an episode
         *
         * @param {integer} season - The season number
         * @param {object} episode - The episode
         */
        self.watch = function (season, episode) {
          var showId = $shows.getCurrentShowId();
          $shows.watch(showId, 'S' + season + 'E' + episode.num)
            .then(function () {
              episode.view = 1;
            })
            .catch(function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Error save the episode watched.')
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );
            });
        };
        
        /**
         * Set to unwatch an episode
         *
         * @param {integer} season - The season number
         * @param {object} episode - The episode
         */
        self.unwatch = function (season, episode) {
          var showId = $shows.getCurrentShowId();
          $shows.unwatch(showId, 'S' + season + 'E' + episode.num)
            .then(function () {
              episode.view = 0;
            })
            .catch(function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Error save the episode not watched.')
                  .position('top right')
                  .hideDelay(1500)
                  .theme('danger')
              );
            });
        };
      }
    ]
  );