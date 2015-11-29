/*jslint node:true*/
module.exports = function (sequelize, Datatypes) {
  "use strict";
  var Show = sequelize.define("Show",
    {
      id: { type: Datatypes.INTEGER, allowNull: false, primaryKey: true },
      name: { type: Datatypes.STRING, allowNull: false },
      slug: { type: Datatypes.STRING, allowNull: false, unique: true },
      image: { type: Datatypes.STRING },
      started: { type: Datatypes.INTEGER, allowNull: false },
      classification: { type: Datatypes.STRING },
      ended: { type: Datatypes.BOOLEAN, defaultValue: false },
      runtime: { type: Datatypes.INTEGER },
      last_update: { type: Datatypes.DATE, defaultValue: Datatypes.NOW },
      imdb_id: { type: Datatypes.STRING },
      network: { type: Datatypes.STRING }
    },
    {
      timestamps: false,
      paranoid: false,
      classMethods: {
        associate: function (models) {
          //Show.belongsToMany(models.Genre, { as: "genre", through: "ShowGenre" });
          Show.belongsToMany(models.Genre, { through: "ShowGenre" });
          //Show.belongsToMany(models.User, { as: "user", through: "UserShow" });
          Show.belongsToMany(models.User, { through: "UserShow" });
          Show.hasMany(models.Episode);
        }
      }
    }
    );

  return Show;
};