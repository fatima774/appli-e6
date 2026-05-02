const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_likes', {
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'utilisateur',
        key: 'id_user'
      }
    },
    id_logement: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'logement',
        key: 'id_logement'
      }
    }
  }, {
    sequelize,
    tableName: 'user_likes',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_user" },
          { name: "id_logement" },
        ]
      },
      {
        name: "id_logement",
        using: "BTREE",
        fields: [
          { name: "id_logement" },
        ]
      },
    ]
  });
};
