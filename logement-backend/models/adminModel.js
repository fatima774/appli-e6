/**
 * FICHIER: models/adminModel.js
 * Rôle: Fonctions d'accès à la base de données pour l'administration (utilisateurs et logements).
 */

const db = require("../config/db");

/**
 * Rechercher un administrateur par son nom d'utilisateur
 */
function findByUsername(username) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour trouver un admin
    db.query(
      "SELECT password_hash FROM admin_user WHERE username = ?",
      [username],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

/**
 * Récupérer tous les utilisateurs
 */
function findAllUsers() {
  return new Promise((resolve, reject) => {
    // Requête SQL pour lister tous les utilisateurs
    db.query(
      "SELECT id_user, nom, prenom, email FROM utilisateur ORDER BY id_user",
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

/**
 * Supprimer un utilisateur
 */
function deleteUser(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer un utilisateur
    db.query("DELETE FROM utilisateur WHERE id_user = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Supprimer tous les favoris d'un utilisateur
 */
function deleteLikesByUser(userId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer les likes associés à l'utilisateur
    db.query("DELETE FROM user_likes WHERE id_user = ?", [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Supprimer tous les logements d'un utilisateur
 */
function deleteLogementsByUser(userId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer tous les logements de l'utilisateur
    db.query("DELETE FROM logement WHERE id_user = ?", [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Supprimer un logement spécifique
 */
function deleteLogement(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer un logement
    db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  findByUsername,
  findAllUsers,
  deleteUser,
  deleteLikesByUser,
  deleteLogementsByUser,
  deleteLogement
};
