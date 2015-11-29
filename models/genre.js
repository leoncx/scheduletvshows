/*jslint node:true*/
module.exports = function (sequelize, Datatypes) {
  "use strict";
  var Genre = sequelize.define("Genre",
    {
      id: { type: Datatypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Datatypes.STRING, allowNull: false, unique: true }
    },
    {
      timestamps: false,
      paranoid: false,
      associate: function (models) {
        //Genre.belongsToMany(models.Show, { as: "show", through: "ShowGenre" })
        Genre.belongsToMany(models.Show, { through: "ShowGenre" });
      }
    }
    );

  return Genre;
};