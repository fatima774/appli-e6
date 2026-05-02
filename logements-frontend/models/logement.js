const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('logement', {
    id_logement: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    titre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    adresse: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ville: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    prix: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_ajout: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('curdate')
    },
    photo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilisateur',
        key: 'id_user'
      }
    },
    likes_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    universite: {
      type: DataTypes.STRING(150),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'logement',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_logement" },
        ]
      },
      {
        name: "fk_logement_user",
        using: "BTREE",
        fields: [
          { name: "id_user" },
        ]
      },
    ]
  });
};
