/*jslint node:true*/
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('../../config');

/* Middleware for authentication */
var auth = {
  /**
   * Verify an authenticated user
   *
   * @param {object} req - The HTTP request
   * @param {object} res - The prepared HTTP response
   * @param {function} next - The callback for continue
   */
  ensureAuthenticated: function (req, res, next) {
    'use strict';
    if (!req.headers.authorization) {
      return res.status(401)
        .send({
          message: 'Please make sure your request has an Authorization header'
        });
    }
    var token = req.headers.authorization.split(' ')[1],
      payload = jwt.decode(token, config.token);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({ message: 'Token has expired' });
    }
    req.user = payload.user;
    next();
  },
  /**
   * Get the authenticated user
   *
   * @param {object} req - The HTTP request
   * @return {object}
   */
  getUser: function (req) {
    'use strict';
    if (!req.headers.authorization) {
      return null;
    }
    var token = req.headers.authorization.split(' ')[1],
      payload = jwt.decode(token, config.token);
    if (payload.exp <= moment().unix()) {
      return null;
    }
    return payload.user;
  }
};

module.exports = auth;