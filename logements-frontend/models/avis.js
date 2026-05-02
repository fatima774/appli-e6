const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('avis', {
    id_avis: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    note: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp')
    },
    id_logement: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'logement',
        key: 'id_logement'
      }
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'utilisateur',
        key: 'id_user'
      }
    }
  }, {
    sequelize,
    tableName: 'avis',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_avis" },
        ]
      },
      {
        name: "avis_logement_fk",
        using: "BTREE",
        fields: [
          { name: "id_logement" },
        ]
      },
      {
        name: "avis_user_fk",
        using: "BTREE",
        fields: [
          { name: "id_user" },
        ]
      },
    ]
  });
};
