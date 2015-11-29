/*jslint node: true*/
var express = require('express');
var moment = require('moment');
var jwt = require('jwt-simple');
var config = require('../config');
var authMiddleware = require('../lib/middleware/auth');
var tvshow = require('../lib/tvshow');
var models = require('../models');
var router = express.Router();

/**
 * Create a JWT Token
 * 
 * @param {User} user The user to get a token
 * @return {String}
 */
function createToken(user) {
  'use strict';
  var userInfos = {
    id: user.id,
    email: user.email,
    show_proposed: user.show_proposed,
    show_day: user.show_day
  };
  var payload = {
    user: userInfos,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.token);
}

/**
 * Route for sign up
 */
router.post(
  '/signup',
  function (req, res) {
    'use strict';
    models.User
      .find({ where: { email: req.body.email }})
      .then(function (user) {
        if (user !== null) {
          return res.status(409).send({ message: 'Email is already taken.'});
        }
        models.User
          .create({
            email: req.body.email,
            password: req.body.password
          })
          .then(function (user) {
            user
              .setToken()
              .save()
              .then(function () {
                /* Send email for validation */
                req.app.mailer.send({
                  to: user.email,
                  subject: 'Schedule TV Shows : Confirm sign up',
                  template: 'confirm',
                  macros: {
                    token: user.token
                  }
                }, function (err) {
                  if (err) {
                    console.error(err);
                  }
                  return res.send({ token: createToken(user) });  
                });
                return res.send({ token: createToken(user) });  
              })
              .catch(function (err) {
                console.error(err);
                return res
                  .status(409)
                  .send({ message: 'Problem when create your account.' });
              });
          })
          .catch(function (err) {
            console.error(err);
            return res
              .status(409)
              .send({ message: 'Problem when create your account.' });
          });
      })
      .catch(function (err) {
        console.error(err);
        return res
          .status(409)
          .send({ message: 'Problem when create your account.' });
      });
  }
);

/**
 * Route for Sign In to the application
 */
router.post(
  '/signin',
  function (req, res) {
    'use strict';
    models.User
      .find({ where: { email: req.body.email } })
      .then(function (user) {
        if (user === null) {
          return res
            .status(401)
            .send({ message: 'Wrong email and/or password.' });
        }
        if (false === user.verifyPassword(req.body.password)) {
          return res
            .status(401)
            .send({ message: 'Wrong email and/or password.' });
        }
        if (false === user.is_activated) {
          return res
            .status(403)
            .send({ message: 'This user is not activated.'});
        }
        return res.send({ token: createToken(user) });
      }).catch(function (err) {
        console.error(err);
        return res
          .status(401)
          .send({ message: 'Wrong email and/or password.' });
      });
  }
);

/**
 * Route for subcribe to a TV Show
 */
router.put(
  '/subcribe',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var showid = req.body.showid;
    var userid = req.user.id;
    models.User
      .findById(userid)
      .then(function (user) {
        if (user === null) {
          console.error('User not in database.');
          return res
            .status(409)
            .send({ message: 'Error to subcribe to the TVShow.'});
        } else {
          models.Show
            .findById(showid)
            .then(function (show) {
              if (show === null) {
                tvshow.add(showid)
                  .then(function (show) {
                    tvshow.update(showid)
                      .then(function () {
                        user.addShow(show)
                          .then(function () {
                            return res
                              .send({
                                message: 'Success to subcribe to the TVShow.'
                              });
                          })
                          .catch(function (err) {
                            console.error(err);
                            return res
                              .status(409)
                              .send({
                                message: 'Error to subcribe to the TVShow.'
                              });
                          });
                      })
                      .catch(function (err) {
                        console.error(err);
                        return res
                          .status(409)
                          .send({ message: 'Error to subcribe to the TVShow.'});
                      });
                  })
                  .catch(function (err) {
                    console.error(err);
                    return res
                      .status(409)
                      .send({ message: 'Error to subcribe to the TVShow.'});
                  });
              } else {
                user.addShow(show)
                  .then(function () {
                    return res
                      .send({ message: 'Success to subcribe to the TVShow.'});
                  })
                  .catch(function (err) {
                    console.error(err);
                    return res
                      .status(409)
                      .send({ message: 'Error to subcribe to the TVShow.'});
                  });
              }
            })
            .catch(function (err) {
              console.error(err);
              return res
                .status(409)
                .send({ message: 'Error to subcribe to the TVShow.'});
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return res
          .status(409)
          .send({ message: 'Error to subcribe to the TVShow.'});
      });
  }
);

/**
 * Route for unsubcribe a TV Show
 */
router.delete(
  '/unsubcribe/:showid',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var showid = req.params.showid;
    var userid = req.user.id;
    models.User.findById(userid)
      .then(function (user) {
        if (user === null) {
          console.error('User not in database.');
          return res
            .status(409)
            .send({ message: 'Error to subcribe to the TVShow.'});
        } else {
          models.Show.findById(showid)
            .then(function (show) {
              if (show === null) {
                console.error('Show not in database.');
                return res
                  .status(409)
                  .send({ message: 'Error to subcribe to the TVShow.'});
              } else {
                user.removeShow(show)
                  .then(function () {
                    models.UserEpisode
                      .destroy(
                        {
                          where: {
                            UserId: userid,
                            ShowId: showid
                          }
                        }
                      )
                      .then(function () {
                        return res
                          .send({
                            message: 'Success to unsubcribe to the TVShow.'
                          });
                      })
                      .catch(function (err) {
                        console.error(err);
                        return res
                          .status(409)
                          .send({
                            message: 'Error to unsubcribe to the TVShow.'
                          });
                      });
                  })
                  .catch(function (err) {
                    console.error(err);
                    return res
                      .status(409)
                      .send({ message: 'Error to unsubcribe to the TVShow.'});
                  });
              }
            })
            .catch(function (err) {
              console.error(err);
              return res
                .status(409)
                .send({ message: 'Error to unsubcribe to the TVShow.'});
            });
        }
      })
      .catch(function (err) {
        console.error(err);
        return res
          .status(409)
          .send({ message: 'Error to unsubcribe to the TVShow.'});
      });
  }
);

/**
 * Route for change password a TV Show
 */
router.patch(
  '/',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var userid = req.user.id;
    models.User.findById(userid)
      .then(function (user) {
        if (req.body.password !== undefined && req.body.password !== '') {
          console.log('Change password');
          user.password = req.body.password;
        }
        user
          .save()
          .then(function (user) {
            res.send({token: createToken(user)});
          });
      })
      .catch(function (err) {
        console.error(err);
        return res.status(409).send({ message: 'Error to save your profile.'});
      });
  }
);

/**
 * Route for get user statistics
 */
router.get(
  '/stats',
  authMiddleware.ensureAuthenticated,
  function (req, res) {
    'use strict';
    var userid = req.user.id;
    var jobs = [];
    var returnValues = {
      episodes: {
        total: 0,
        watched: 0
      },
      statusShows: {
        ended: {
          uptodate: 0,
          notUptodate: 0
        },
        inDiffusion: {
          uptodate: 0,
          notUptodate: 0
        }
      },
      genres: []
    };
    
    /* Get number episode views on number episode subcribe */
    jobs.push(new Promise(function (resolve, reject) {
      models.sequelize
        .query(
          'SELECT COUNT(*) as nbEp FROM UserEpisodes ' +
            'WHERE view = 1 AND UserId = ' + userid,
          { type: models.sequelize.QueryTypes.SELECT }
        )
        .then(function (countEpisode) {
          returnValues.episodes.watched = countEpisode[0].nbEp;
          resolve();
        })
        .catch(function (err) {
          reject(err);
        });
    }));
    
    /* Get total episodes subcribe by user */
    jobs.push(new Promise(function (resolve, reject) {
      models.sequelize
        .query(
          'SELECT COUNT(e.ShowId) as nbEp FROM Episodes e, UserShow us ' +
            'WHERE e.ShowId = us.ShowId AND us.UserId = ' + userid,
          { type: models.sequelize.QueryTypes.SELECT }
        )
        .then(function (countEpisode) {
          returnValues.episodes.total = countEpisode[0].nbEp;
          resolve();
        })
        .catch(function (err) {
          reject(err);
        });
    }));
    
    /* Get ended or uptodate show */
    jobs.push(new Promise(function (resolve, reject) {
      models.sequelize
        .query(
          'SELECT s.id, s.ended, ' +
            '(SELECT COUNT(e.ShowId) FROM  Episodes e ' +
              'WHERE e.ShowId = us.ShowId) as totalEp, ' +
            '(SELECT COUNT(ue.ShowId) FROM UserEpisodes ue ' +
              'WHERE ue.ShowId = us.ShowId) as watchedEp ' +
            'FROM Shows s,  UserShow us ' +
            'WHERE s.id = us.ShowId AND us.UserId = ' + userid,
          { type: models.sequelize.QueryTypes.SELECT }
        )
        .then(function (shows) {
          var i = 0;
          for (i; i < shows.length; i = i + 1) {
            if (shows[i].ended) {
              if (shows[i].totalEp === shows[i].watchedEp) {
                returnValues.statusShows.ended.uptodate++;
              } else {
                returnValues.statusShows.ended.notUptodate++;
              }
            } else {
              if (shows[i].totalEp === shows[i].watchedEp) {
                returnValues.statusShows.inDiffusion.uptodate++;
              } else {
                returnValues.statusShows.inDiffusion.notUptodate++;
              }
            }
          }
          resolve();
        })
        .catch(function (err) {
          reject(err);
        });
    }));
    
    /* Get count by genre */
    jobs.push(new Promise(function (resolve, reject) {
      models.sequelize
        .query(
          'SELECT COUNT(gs.GenreId) as nbShow, g.name ' +
            'FROM Genres g, ShowGenre gs, UserShow us ' +
            'WHERE g.id = gs.GenreId AND gs.ShowId = us.ShowId AND us.UserId = ' +
            userid + ' GROUP BY g.name',
          { type: models.sequelize.QueryTypes.SELECT }
        )
        .then(function (genres) {
          var i = 0;
          for (i; i < genres.length; i = i + 1) {
            returnValues.genres.push({
              name: genres[i].name,
              nb: genres[i].nbShow
            });
          }
          resolve();
        })
        .catch(function (err) {
          reject(err);
        });
    }));
    
    Promise.all(jobs)
      .then(function () {
        res.json(returnValues);
      })
      .catch(function (err) {
        console.error(err);
        return res
          .status(500)
          .send({message: 'Error to getting user statistics.'});
      });
  }
);

/**
 * Route for validate
 */
router.get(
  '/validate',
  function (req, res) {
    'use strict';
    var token = req.query.token;
    models.User
      .findOne(
        {
          where: {
            token: token
          }
        }
      )
      .then(function (user) {
        if (user === null) {
          return res.status(404).send({message: 'No user to validate.'});
        }
        user.token = null;
        user.is_activated = true;
        user.save()
          .then(function () {
            res.json({success: true});
          })
          .catch(function (err) {
            console.log(err);
            return res
              .status(500)
              .send({message: 'Error in validate your user.'});
          });
      })
      .catch(function (err) {
        console.error(err);
        return res
          .status(500)
          .send({message: 'Error in validate your user.'});
      });
  }
);

module.exports = router;