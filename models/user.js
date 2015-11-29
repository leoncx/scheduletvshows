/*jslint node:true*/
var crypto = require("crypto");

/* Global variable for crypto */
var SALTLEN = 64;
var KEYLEN = 64;
var ITERATIONS = 10000;
var ALGORITHM = "sha256";
var ENCODING = "hex";

function generateSalt(saltlen) {
  "use strict";
  var s = "";
  saltlen = saltlen || SALTLEN;
  try {
    s = new Buffer(crypto.randomBytes(saltlen >> 1)).toString(ENCODING);
  } catch (e) {
    console.error(e);
  }
  return s;
}

function hash(string, salt, iterations, keylen) {
  "use strict";
  iterations = iterations || ITERATIONS;
  keylen = keylen || KEYLEN;
  return crypto.pbkdf2Sync(string, salt, iterations, keylen).toString(ENCODING);
}

function hashPassword(password) {
  "use strict";
  var salt = generateSalt(),
    hashed = hash(password, salt);
  return salt + "::" + ITERATIONS + "::" + hashed;
}

module.exports = function (sequelize, Datatypes) {
  "use strict";
  var User = sequelize.define("User",
    {
      id: { type: Datatypes.INTEGER, autoIncrement: true, primaryKey: true },
      email:
        {
          type: Datatypes.STRING,
          allowNull: false,
          unique: true,
          validate: { isEmail: true }
        },
      password: { type: Datatypes.STRING, allowNull: false },
      google: { type: Datatypes.STRING, unique: true },
      facebook: { type: Datatypes.STRING, unique: true },
      is_activated: { type: Datatypes.BOOLEAN, allowNull: false, defaultValue: false },
      show_proposed: { type: Datatypes.BOOLEAN, allowNull: false, defaultValue: true },
      show_day: { type: Datatypes.BOOLEAN, allowNull: false, defaultValue: true },
      token: { type: Datatypes.STRING, unique: true }
    },
    {
      classMethods: {
        associate: function (models) {
          User.hasMany(models.UserEpisode);
          //User.belongsToMany(models.Show, { as: "show", through: "UserShow" });
          User.belongsToMany(models.Show, { through: "UserShow" });
        }
      },
      instanceMethods:
        {
          verifyPassword: function (password) {
            var info = this.password.split("::");
            if (info[2] === hash(password, info[0], parseInt(info[1], 10))) {
              return true;
            } else {
              return false;
            }
          },
          setToken: function () {
            this.token = require("crypto").randomBytes(48).toString("hex");
            return this;
          },
          verifyToken: function (token) {
            if (token === this.token) {
              return true;
            }
            return false;
          }
        },
      hooks:
        {
          beforeCreate: function (user, options, fn) {
            user.password = hashPassword(user.password);
            fn(null, user);
          },
          beforeUpdate: function (user, options, fn) {
            if (user.changed("password")) {
              user.password = hashPassword(user.password);
            }
            fn(null, user);
          }
        }
    }
    );

  return User;
};