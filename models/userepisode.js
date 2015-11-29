/*jslint node:true*/
module.exports = function (sequelize, Datatypes) {
  "use strict";
  var UserEpisode = sequelize.define("UserEpisode",
    {
      UserId:
        {
          type: Datatypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          model: "Users",
          key: "id",
          onDelete: "cascade"
        },
      ShowId:
        {
          type: Datatypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          model: "Shows",
          key: "id",
          onDelete: "cascade"
        },
      season: { type: Datatypes.INTEGER, allowNull: false, primaryKey: true },
      episode: { type: Datatypes.INTEGER, allowNull: false, primaryKey: true },
      view: { type: Datatypes.BOOLEAN, allowNull: false, default: true }
    },
    {
      timestamps: false,
      paranoid: false
    }
    );

  return UserEpisode;
};