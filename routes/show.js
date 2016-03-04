var moment = require('moment');
var express = require('express');
var config = require('../config');
var router = express.Router();
var TVDBClient = require('node-tvdb');
var authMiddleware = require('../lib/middleware/auth');
var models = require('../models');

router.post(
  '/search',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var search = req.body.search;
    var tvdb = new TVDBClient(config.tvdbkey);

    tvdb.getSeriesByName(search)
      .then(function (response) {
        if (response === null) {
          return res.status(404).send('No TV Shows found.');
        }
        models.User
          .findById(req.user.id)
          .then(function (user) {
            var shows = [];
            user
              .getShows()
              .then(function (userShows) {
                var subcribed;
                var i = 0;
                var j = 0;
                for (i = 0; i < response.length; i++) {
                  subcribed = false;
                  for (j = 0; j < userShows.length; j++) {
                    if (userShows[j].id === response[i].seriesid) {
                      subcribed = true;
                      break;
                    }
                  }
                  shows.push({
                    id: response[i].seriesid,
                    name: response[i].SeriesName,
                    link: 'http://www.imdb.com/title/' + response[i].IMDB_ID,
                    started: response[i].FirstAired,
                    subcribed: subcribed
                  });
                }

                return res.json(shows);
              })
              .catch(function (err) {
                console.log(err);
                return res.status(404).send('No TV Shows found.');
              });
          })
          .catch(function (err) {
            console.error(err);
            return res.status(404).send('No TV Shows found.');
          });
      })
      .catch(function (err) {
        console.error(err);
        return res.status(409).send('Error during external search.');
      });
  }
);

router.get('/proposed', function (req, res) {
  'use strict';
  var proposedQuery;
  var subProposedQuery;
  var subOrder = 'ORDER BY RAND() LIMIT 3';
  var user = authMiddleware.getUser(req);

  subProposedQuery =
    'SELECT s.id, s.name, s.slug, s.image, s.imdb_id, s.ended FROM Shows s';

  if (user !== null) {
    subProposedQuery += ' WHERE s.id NOT IN ' +
      '(SELECT ShowId FROM UserShow WHERE UserId = ' + user.id + ')';
  }
  proposedQuery =
    'SELECT sf.id, sf.name, sf.slug, sf.image, ' +
    'sf.imdb_id, sf.ended, g.name as genre FROM (' +
    subProposedQuery + ' ' + subOrder +
    ') as sf, Genres g, ShowGenre sg ' +
    'WHERE sf.id = sg.ShowId AND g.id = sg.GenreId';
  models.sequelize
    .query(proposedQuery, {type: models.sequelize.QueryTypes.SELECT})
    .then(function (shows) {
      var showsPromise;
      var finalShows = {};
      var i = 0;
      for (i = 0; i < shows.length; i++) {
        if (finalShows.hasOwnProperty(shows[i].slug) === false) {
          finalShows[shows[i].slug] = {
            id: shows[i].id,
            name: shows[i].name,
            slug: shows[i].slug,
            img: shows[i].image,
            imdb_tt: shows[i].imdb_id,
            ended: shows[i].ended,
            genres: [],
            nextep: null,
            nextairdate: null,
            tosee: null,
            uptodate: 0,
            subcribe: true,
            display: true
          };
        }
        finalShows[shows[i].slug].genres.push(shows[i].genre);
      }

      shows = Object.keys(finalShows).map(function (key) {
        return finalShows[key];
      });

      showsPromise = shows.map(function (show) {
        return new Promise(function (resolve, reject) {
          models.sequelize
            .query(
              'SELECT season, MAX(episode) as episode, date, ' +
                '(SELECT COUNT(episode) FROM Episodes ' +
                'WHERE ShowId = ' + show.id + ') as nbEp ' +
                'FROM Episodes ' +
                'WHERE ShowId = ' + show.id + ' AND season = ' +
                '(SELECT MAX(season) ' +
                'FROM Episodes WHERE ShowId = ' + show.id + ')',
              {type: models.sequelize.QueryTypes.SELECT}
            )
            .then(function (result) {
              if (result[0].season !== null && result[0].episode !== null) {
                show.nextep = 'S' + result[0].season + 'E' + result[0].episode;
              }
              if (result.date !== null) {
                show.nextairdate = new Date(result[0].date).toISOString()
                  .substring(0, 10);
              }
              show.tosee = result[0].nbEp;
              resolve(show);
            })
            .catch(function (err) {
              reject(err);
            });
        });
      });

      Promise.all(showsPromise)
        .then(function (shows) {
          res.json(shows);
        })
        .catch(function (err) {
          console.error(err);
          res.status(500).send('Error when getting proposed TV Shows.');
        });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Error when getting proposed TV Shows.');
    });
});

router.get('/today',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var today = moment();
    models.sequelize
      .query(
        'SELECT s.id, s.name, s.slug, s.image, s.ended, s.imdb_id, ' +
          '(SELECT COUNT(*) FROM Episodes WHERE ShowId = s.id) as showep, ' +
          '(SELECT COUNT(*) ' +
          'FROM UserEpisodes ' +
          'WHERE ShowId = s.id AND UserId = us.UserId) as userep, ' +
          'e.episode, e.title, e.date, e.season, g.name as genre ' +
          'FROM Shows s, Episodes e, UserShow us, Genres g, ShowGenre sg ' +
          'WHERE e.ShowId = s.id AND date = "' +
          today.format('YYYY-MM-DD 00:00:00') +
          '" AND us.ShowId = s.id AND us.UserId = ' + req.user.id + ' AND ' +
          'g.id = sg.GenreId AND sg.ShowId = s.id',
        {type: models.sequelize.QueryTypes.SELECT}
      )
      .then(function (shows) {
        if (shows === null) {
          res.status(404).send('No show diffused today.');
        }

        var nextEp;
        var nextDate;
        var finalShows = {};
        var i = 0;
        for (i = 0; i < shows.length; i++) {
          if (finalShows.hasOwnProperty(shows[i].slug) === false) {
            nextEp = null;
            if (shows[i].season !== null && shows[i].episode !== null) {
              nextEp = 'S' + shows[i].season + 'E' + shows[i].episode;
            }
            nextDate = null;
            if (shows[i].date !== null) {
              nextDate = new Date(shows[i].date).toISOString().substring(0, 10);
            }

            finalShows[shows[i].slug] = {
              id: shows[i].id,
              name: shows[i].name,
              slug: shows[i].slug,
              img: shows[i].image,
              ended: shows[i].ended,
              imdb_tt: shows[i].imdb_id,
              genres: [],
              nextep: nextEp,
              nextairdate: nextDate,
              tosee: shows[i].showep - shows[i].userep,
              uptodate: ((shows[i].showep - shows[i].userep) === 0 ? 1 : 0),
              subcribe: false,
              display: true
            };
          }
          finalShows[shows[i].slug].genres.push(shows[i].genre);
        }

        shows = Object.keys(finalShows).map(function (key) {
          return finalShows[key];
        });

        res.json(shows);
      })
      .catch(function (err) {
        console.error(err);
        res.status(500).send('Error when getting today diffusion shows.');
      });
  }
  );

router.get('/',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    models.sequelize
      .query(
        'SELECT s.id, s.name, s.slug, s.image, s.ended, s.imdb_id, ' +
          'e.season, e.episode, e.date, g.name as genre, ' +
          '(SELECT COUNT(*) FROM Episodes WHERE ShowId = s.id ' +
          'AND `date` < NOW()) as showep, ' +
          '(SELECT COUNT(*) ' +
          'FROM UserEpisodes ' +
          'WHERE ShowId = s.id AND UserId = us.UserId) as userep ' +
          'FROM UserShow us, Genres g, ShowGenre sg, Shows s ' +
          'LEFT JOIN (SELECT ShowId, season, episode, MIN(`date`) as `date` ' +
          'FROM Episodes WHERE `date` > NOW()) e ' +
          'ON s.id = e.ShowId WHERE g.id = sg.GenreId ' +
          'AND sg.ShowId = s.id AND s.id = us.ShowId ' +
          'AND us.UserId = ' + req.user.id,
        {type: models.sequelize.QueryTypes.SELECT}
      )
      .then(function (shows) {
        var nextEp;
        var nextDate;
        var finalShows = {};
        var i = 0;
        for (i = 0; i < shows.length; i++) {
          if (finalShows.hasOwnProperty(shows[i].slug) === false) {
            nextEp = null;
            if (shows[i].season !== null && shows[i].episode !== null) {
              nextEp = 'S' + shows[i].season + 'E' + shows[i].episode;
            }
            nextDate = null;
            if (shows[i].date !== null) {
              nextDate = new Date(shows[i].date).toISOString().substring(0, 10);
            }

            finalShows[shows[i].slug] = {
              id: shows[i].id,
              name: shows[i].name,
              slug: shows[i].slug,
              img: shows[i].image,
              ended: shows[i].ended,
              imdb_tt: shows[i].imdb_id,
              genres: [],
              nextep: nextEp,
              nextairdate: nextDate,
              tosee: shows[i].showep - shows[i].userep,
              uptodate: ((shows[i].showep - shows[i].userep) === 0 ? 1 : 0),
              subcribe: false,
              display: true
            };
          }
          finalShows[shows[i].slug].genres.push(shows[i].genre);
        }

        shows = Object.keys(finalShows).map(function (key) {
          return finalShows[key];
        });

        res.json(shows);
      })
      .catch(function (err) {
        console.error(err);
        res.status(500).send('Error when user show shows.');
      });
  });

router.get('/info/:slug',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    models.sequelize
      .query(
        'SELECT s.id, s.name, s.image, e.season, e.episode, ' +
          'e.title, e.date, ue.view ' +
          'FROM Shows s, Episodes e LEFT JOIN UserEpisodes ue ' +
          'ON ue.ShowId = e.ShowId AND e.season = ue.season ' +
          'AND e.episode = ue.episode AND ue.UserId = :user ' +
          'WHERE s.id = e.ShowId AND s.slug = :slug ' +
          'ORDER BY e.season DESC, e.episode DESC', {
            replacements: {
              user: req.user.id,
              slug: req.params.slug
            },
            type: models.sequelize.QueryTypes.SELECT
          }
      )
      .then(function (episodes) {
        /* Transforms for return */
        var show = {};
        var season = {
          num: null,
          episodes: []
        };
        var seasonCurrent = null;
        var i = 0;
        for (i; i < episodes.length; i++) {
          if (i === 0) {
            show = {
              id: episodes[i].id,
              name: episodes[i].name,
              image: episodes[i].image,
              seasons: []
            };
          }
          if (seasonCurrent !== episodes[i].season) {
            if (season.episodes.length > 0) {
              show.seasons.push(season);
            }
            season = {
              num: episodes[i].season,
              episodes: []
            };
            seasonCurrent = episodes[i].season;
          }
          season.episodes.push({
            num: episodes[i].episode,
            title: episodes[i].title,
            date: episodes[i].date,
            view: episodes[i].view == 1
          });
        }
        show.seasons.push(season);

        res.json(show);
      })
      .catch(function (err) {
        console.error(err);
        res.status(500).send('Error when get list of episodes.');
      });
  });

router.put('/episode/:showId',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var showId = req.params.showId;
    var episode = req.body.episode;

    /**
     * Function for set to watched an episode
     *
     * @param {integer} season - The season number
     * @param {integer} episode - The episode number
     */
    var seeEpisode = function (season, episode) {
      models.sequelize
        .query(
          'INSERT INTO UserEpisodes ' +
            '(UserId, ShowId, season, episode, view) ' +
            'VALUES (:userId, :showId, :season, :episode, 1)', {
              replacements: {
                userId: req.user.id,
                showId: showId,
                season: season,
                episode: episode
              },
              type: models.sequelize.QueryTypes.INSERT
            }
        )
        .then(function () {
          res.json({
            season: season,
            episode: episode
          });
        })
        .catch(function (err) {
          console.error(err);
          res.status(500).send('Error to set at watched the episode.');
        });
    };

    /* If the episode argument is 'next' get the next episode and set it to watch */
    if (episode === 'next') {
      models.sequelize
        .query(
          'SELECT ShowId, season, episode ' +
            'FROM Episodes e ' +
            'WHERE NOT EXISTS (SELECT ' +
              'ShowId, season, episode ' +
              'FROM UserEpisodes ue ' +
              'WHERE e.ShowId = ue.ShowId ' +
                'AND e.season = ue.season ' +
                'AND e.episode = ue.episode ' +
                'AND ue.UserId = :userId) ' +
            'AND e.ShowId = :showId ' +
            'ORDER BY e.date ASC', {
              replacements: {
                userId: req.user.id,
                showId: showId
              },
              type: models.sequelize.QueryTypes.SELECT
            }
        )
        .then(function (episodes) {
          var episodeInfo;
          if (episodes === null) {
            return res.status(404).send('No episode to watch');
          }
          episodeInfo = episodes[0];
          seeEpisode(episodeInfo.season, episodeInfo.episode);
        })
        .catch(function (err) {
          console.error(err);
          res.status(500).send('Error to set at watched the episode.');
        });
    } else {
      /* Parse the episode string (S00E00) for get season and episode number */
      var episodeInfo = episode.substr(1).split('E');
      var seasonNum;
      var episodeNum;
      if (episodeInfo.length !== 2) {
        res.status(400).send('Bad argument for set a episode to watch');
        return;
      }
      seasonNum = parseInt(episodeInfo[0], 10);
      episodeNum = parseInt(episodeInfo[1], 10);
      if (isNaN(seasonNum) || isNaN(episodeNum)) {
        res.status(400).send('Bad argument for set a episode to watch');
        return;
      }
      seeEpisode(seasonNum, episodeNum);
    }
  });

router.delete('/episode/:showId/:episode',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var showId = req.params.showId;
    var episode = req.params.episode;

    /* Parse the episode string (S00E00) for get season and episode number */
    var episodeInfo = episode.substr(1).split('E');
    var seasonNum;
    var episodeNum;
    if (episodeInfo.length !== 2) {
      res.status(400).send('Bad argument for set a episode to watch');
      return;
    }
    seasonNum = parseInt(episodeInfo[0], 10);
    episodeNum = parseInt(episodeInfo[1], 10);
    if (isNaN(seasonNum) || isNaN(episodeNum)) {
      res.status(400).send('Bad argument for set a episode to watch');
      return;
    }

    models.sequelize
      .query(
        'DELETE FROM UserEpisodes WHERE UserId = :userId AND ShowId = :showId ' +
          'AND season = :season AND episode = :episode', {
            replacements: {
              userId: req.user.id,
              showId: showId,
              season: seasonNum,
              episode: episodeNum
            },
            type: models.sequelize.QueryTypes.DELETE
          }
      )
      .then(function () {
        res.json('Ok');
      })
      .catch(function () {
        res.status(500).send('Error to set at unwatched the episode.');
      });
  });

module.exports = router;
