/**
 * FICHIER: models/utilisateurModel.js
 * Rôle: Fonctions d'accès à la base de données pour les utilisateurs (CRUD).
 */

const db = require("../config/db");

/**
 * Rechercher un utilisateur par email
 */
function findByEmail(email) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour trouver un utilisateur
    db.query("SELECT * FROM utilisateur WHERE email = ?", [email], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || null);
    });
  });
}

/**
 * Créer un nouvel utilisateur dans la base de données
 */
function create({ prenom, nom, email, password, photo }) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour insérer un nouvel utilisateur
    db.query(
      "INSERT INTO utilisateur (prenom, nom, username, email, password, photo) VALUES (?, ?, ?, ?, ?, ?)",
      [prenom, nom, email, email, password, photo],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

/**
 * Rechercher un utilisateur par son ID
 */
function findById(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour récupérer les informations de l'utilisateur
    db.query(
      `SELECT id_user, prenom, nom, username, email, telephone,
              adresse, ecole, ecole_ville, date_naissance, genre, photo
       FROM utilisateur WHERE id_user = ?`,
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

/**
 * Mettre à jour les informations d'un utilisateur
 */
function update(setClause, values) {
  return new Promise((resolve, reject) => {
    // Requête SQL dynamique pour mettre à jour les champs fournis
    db.query(
      `UPDATE utilisateur SET ${setClause} WHERE id_user = ?`,
      values,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

module.exports = { findByEmail, create, findById, update };
