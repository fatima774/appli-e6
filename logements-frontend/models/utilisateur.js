const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('utilisateur', {
    id_user: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "email_2"
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp')
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "user"
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 0
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    photo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ecole: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ecole_ville: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    telephone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    adresse: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    date_naissance: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    genre: {
      type: DataTypes.ENUM('Homme','Femme','Autre'),
      allowNull: true
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'utilisateur',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_user" },
        ]
      },
      {
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "email_2",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
    ]
  });
};
