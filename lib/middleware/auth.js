var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('../../config');

/* Middleware for authentication */
var auth = {
  /**
   * Verify an authenticated user
   *
   * @param {Object} req - The HTTP request
   * @param {Object} res - The prepared HTTP response
   * @param {function} next - The callback for continue
   * @return {Object} - Http response
   */
  ensureAuthenticated: function (req, res, next) {
    'use strict';
    if (!req.headers.authorization) {
      return res.status(401)
        .send({
          message: 'Please make sure your request has an Authorization header'
        });
    }
    var token = req.headers.authorization.split(' ')[1];
    var payload = jwt.decode(token, config.token);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({message: 'Token has expired'});
    }
    req.user = payload.user;
    next();
  },
  /**
   * Get the authenticated user
   *
   * @param {Object} req - The HTTP request
   * @return {Object|null} - The logged user
   */
  getUser: function (req) {
    'use strict';
    if (!req.headers.authorization) {
      return null;
    }
    var token = req.headers.authorization.split(' ')[1];
    var payload = jwt.decode(token, config.token);
    if (payload.exp <= moment().unix()) {
      return null;
    }
    return payload.user;
  }
};

module.exports = auth;
