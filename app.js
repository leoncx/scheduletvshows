/*jslint node: true */

var fs = require('fs');
var express = require('express');
var session = require('express-session');
var path = require('path');
var csrf = require('csurf');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require(path.join(__dirname, 'config'));

var app = express();

/* Initialize mailer */
var mailer = require(path.join(__dirname, 'lib/mailer'));

config.mail.templatesDir = path.join(__dirname, 'mails');

mailer.extend(app, config.mail);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/* Init session */
app.use(session({
  secret: config.session.token,
  resave: false,
  saveUninitialized: false
}));

/* Init csrf security */
app.use(csrf());

app.use(function (err, req, res, next) {
  'use strict';
  if (err.code !== 'EBADCSRFTOKEN') {
    next(err);
  }
  
  res.status(403).send('Session token expired');
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  'use strict';
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

/* Api router */
var routerApi = express.Router();

var user = require(path.join(__dirname, 'routes/user'));
routerApi.use('/user', user);
var show = require(path.join(__dirname, 'routes/show'));
routerApi.use('/show', show);
var genre = require(path.join(__dirname, 'routes/genre'));
routerApi.use('/genre', genre);

routerApi.use('*', function (req, res, next) {
  'use strict';
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use('/api', routerApi);

app.use('*', function (req, res, next) {
  'use static';
  res.sendFile(__dirname + '/public/index.html');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  'use strict';
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;