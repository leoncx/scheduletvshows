/*jslint node:true*/
module.exports = function (sequelize, Datatypes) {
  "use strict";
  var Episode = sequelize.define("Episode",
    {
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
      title: { type: Datatypes.STRING, allowNull: false },
      date: { type: Datatypes.DATE }
    },
    {
      timestamps: false,
      paranoid: false
    }
    );

  return Episode;
};