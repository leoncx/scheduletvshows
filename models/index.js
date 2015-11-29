/*jslint node:true*/
var fs = require("fs");
var path = require("path");
var basename = path.basename(module.filename);
var Sequelize = require("sequelize");
var config = require(__dirname + "/../config");
var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);
var db = {};

fs.readdirSync(__dirname)
  .filter(function (file) {
    "use strict";
    return (file.indexOf(".") !== 0) && (file !== basename);
  })
  .forEach(function (file) {
    "use strict";
    var model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  "use strict";
  if (db[modelName].hasOwnProperty("associate")) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;