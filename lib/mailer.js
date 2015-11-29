/*jslint node:true*/
/**
 * Module for send emails
 * 
 * Based on https://github.com/RGBboy/express-mailer
 */

/**
 * Module dependencies
 */
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');

exports.version = '2.0.0';

exports.extend = function (app, options) {
  'use strict';

  if (app.mailer) {
    throw new Error('The application have already mailer registred.');
  }

  var sendMail, createSend,
    mailer = {},
    from = options.from,
    templatesDir = options.templatesDir,
    smtpTranport = nodemailer
    .createTransport(options.transport);

  sendMail = function (sendOptions, transport, render, callback) {
    if (sendOptions.template === undefined ||
        sendOptions.macros === undefined ||
        sendOptions.to === undefined) {
      throw new Error('Missing options for send an email.');
    }

    emailTemplates(templatesDir, function (err, template) {
      if (err) {
        console.log(err);
      } else {
        template(sendOptions.template,
                 sendOptions.macros,
                 function (err, html, text) {
            if (err) {
              console.log(err);
            } else {
              smtpTranport.sendMail({
                from: from,
                to: sendOptions.to,
                subject: sendOptions.subject || '',
                html: html,
                text: text
              }, function (err, responseStatus) {
                if (err) {
                  callback(err);
                  return;
                }
                callback(null, responseStatus.message);
              });
            }
          });
      }
    });
  };

  createSend = function (render) {
    return function (sendOptions, callback) {
      sendMail(sendOptions, smtpTranport, render, callback);
    };
  };

  mailer.send = createSend(app.render.bind(app));

  app.mailer = mailer;

  return app;
};