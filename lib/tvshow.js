/*jslint node:true */
/*if (!Promise) {
  var Promise = require("bluebird");
}*/

var TVDBClient = require('node-tvdb');
var moment = require('moment');
var slug = require('slug');
var models = require('../models');
var config = require('../config');

/**
 * Test if a genre is already in database
 * 
 * @param {string} genreName - The genre name
 * @return {Promise}
 */
function testGenre(genreName) {
  'use strict';
  return new Promise(function (resolve, reject) {
    models.Genre
      .findOrCreate({ where: { name: genreName } })
      .spread(function (genre, created) {
        if (created) {
          console.info('Genre ' + genreName + ' has been created.');
        }
        resolve(genre);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

/**
 * Insert a new episode
 * 
 * @param {integer} showid - The show id
 * @param {object} episode - The episode
 * @return {Promise}
 */
function insertEpisode(showid, episode) {
  'use strict';
  return new Promise(function (resolve, reject) {
    var firstAired = null;
    if (episode.FirstAired !== null) {
      firstAired = new Date(episode.FirstAired);
    }
    if (episode.EpisodeName === 'TBA'
       && episode.SeasonNumber == 0
       && episode.EpisodeNumber == 0) {
      resolve();
    }
    models.Episode
      .create(
        {
          ShowId: showid,
          season: episode.SeasonNumber,
          episode: episode.EpisodeNumber,
          title: episode.EpisodeName,
          date: firstAired
        }
      )
      .then(function (episode) {
        resolve(episode);
      })
      .catch(function (err) {
        console.log(episode);
        reject(err);
      });
  });
}

/**
 * Class for tvshow
 * 
 * @class tvshow
 */
var tvshow = {
  /**
   * Add a new show
   * 
   * @param {integer} showid - The show id
   * @return {Promise}
   */
  add: function (showid) {
    'use strict';
    return new Promise(function (resolve, reject) {
      models.Show
        .findById(showid)
        .then(function (show) {
          if (show === null) {
            console.info('Getting TV show from TVDB.');
            var tvdb = new TVDBClient(config.tvdbkey);
            tvdb.getSeriesById(showid)
              .then(function (show) {
                var genresPromises = show.Genre
                  .split('|')
                  .map(function (genre) {
                    if (genre !== '') {
                      return testGenre(genre);
                    }
                  });
                Promise.all(genresPromises)
                  .then(function (genres) {
                    /* Cleanup genres */
                    genres = genres.filter(function (genre) {
                      return genre !== undefined;
                    });
                    var ended = false,
                      started = Date.parse(show.FirstAired);
                    if (started === 'Nan') {
                      started = 0;
                    }
                    if (show.Status === 'Ended') {
                      ended = true;
                    }
                    console.info('Insert the TVShow ' + show.SeriesName);
                    models.Show
                      .create(
                        {
                          id: show.id,
                          name: show.SeriesName,
                          slug: slug(show.SeriesName),
                          image: show.poster,
                          started: moment(started).year(),
                          classification: show.ContentRating,
                          ended: ended,
                          runtime: show.Runtime,
                          imdb_id: show.IMDB_ID
                        }
                      )
                      .then(function (show) {
                        show
                          .setGenres(genres)
                          .then(function () {
                            resolve(show);
                          })
                          .catch(function (err) {
                            reject(err);
                          });
                      })
                      .catch(function (err) {
                        reject(err);
                      });
                  });
              })
              .catch(function (err) {
                reject(err);
              });
          }
        })
        .catch(function (err) {
          reject(err);
        });
    });
  },
  /**
   * Update a show
   * 
   * Update by show id integer or string : Update from TVRage
   * Update by show object : Update with the array of episodes
   * 
   * @param {string|integer|object} show - The show id or the show object
   * @param {object} episodes - The list of episodes to update
   * @return {Promise}
   */
  update: function (show, episodes) {
    'use strict';
    var self = this;
    return new Promise(function (resolve, reject) {
      if (typeof show === 'string' || typeof show === 'number') {
        models.Show
          .findById(show)
          .then(function (show) {
            if (show === null) {
              reject('The show ' + show.name + ' is not registred.');
            } else {
              var tvdb = new TVDBClient(config.tvdbkey);
              tvdb
                .getSeriesAllById(show.id)
                .then(function (episodes) {
                  show.image = episodes.poster;
                  if (episodes.Status === 'Ended') {
                    show.ended = true;
                  }
                  self.update(show, episodes.Episodes)
                    .then(function () {
                      resolve();
                    })
                    .catch(function (err) {
                      reject(err);
                    });
                })
                .catch(function (err) {
                  reject(err);
                });
            }
          })
          .catch(function (err) {
            reject(err);
          });
      } else {
        models.Episode
          .destroy({ where: { ShowId: show.id }})
          .then(function () {
            var episodesPromise = episodes.map(function (episode) {
              if (!episode.EpisodeName) {
                episode.EpisodeName = 'TBA';
              }
              return insertEpisode(show.id, episode);
            });
            Promise.all(episodesPromise)
              .then(function () {
                show.last_update = moment();
                show.save()
                  .then(function () {
                    resolve();  
                  })
                  .catch(function (err) {
                    reject(err);
                  });
              })
              .catch(function (err) {
                reject(err);
              });
          })
          .catch(function (err) {
            reject(err);
          });
      }
    });
  }
};

module.exports = tvshow;
