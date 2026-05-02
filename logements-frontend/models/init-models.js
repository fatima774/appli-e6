var DataTypes = require("sequelize").DataTypes;
var _avis = require("./avis");
var _logement = require("./logement");
var _user_likes = require("./user_likes");
var _utilisateur = require("./utilisateur");

function initModels(sequelize) {
  var avis = _avis(sequelize, DataTypes);
  var logement = _logement(sequelize, DataTypes);
  var user_likes = _user_likes(sequelize, DataTypes);
  var utilisateur = _utilisateur(sequelize, DataTypes);

  logement.belongsToMany(utilisateur, { as: 'id_user_utilisateurs', through: user_likes, foreignKey: "id_logement", otherKey: "id_user" });
  utilisateur.belongsToMany(logement, { as: 'id_logement_logements', through: user_likes, foreignKey: "id_user", otherKey: "id_logement" });
  avis.belongsTo(logement, { as: "id_logement_logement", foreignKey: "id_logement"});
  logement.hasMany(avis, { as: "avis", foreignKey: "id_logement"});
  user_likes.belongsTo(logement, { as: "id_logement_logement", foreignKey: "id_logement"});
  logement.hasMany(user_likes, { as: "user_likes", foreignKey: "id_logement"});
  avis.belongsTo(utilisateur, { as: "id_user_utilisateur", foreignKey: "id_user"});
  utilisateur.hasMany(avis, { as: "avis", foreignKey: "id_user"});
  logement.belongsTo(utilisateur, { as: "id_user_utilisateur", foreignKey: "id_user"});
  utilisateur.hasMany(logement, { as: "logements", foreignKey: "id_user"});
  user_likes.belongsTo(utilisateur, { as: "id_user_utilisateur", foreignKey: "id_user"});
  utilisateur.hasMany(user_likes, { as: "user_likes", foreignKey: "id_user"});

  return {
    avis,
    logement,
    user_likes,
    utilisateur,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
