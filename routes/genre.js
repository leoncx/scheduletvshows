/*jslint node: true*/
'use strict';

var express = require('express');
var router = express.Router();
var models = require('../models');

/**
 * Get the list of genres
 */
router.get('/', function (req, res) {
  models.Genre
    .findAll({
      order: 'name ASC'
    })
    .then(function (genres) {
      res.json(genres.map(function (genre) {
        return genre.name;
      }));
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Error when getting genres');
    });
});

module.exports = router;