/**
 * FICHIER: models/avisModel.js
 * Rôle: Fonctions d'accès à la base de données pour les avis sur les logements.
 */

const db = require("../config/db");

/**
 * Créer un nouvel avis
 */
function create(userId, logementId, contenu, note) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour insérer un nouvel avis
    db.query(
      "INSERT INTO avis (id_user, id_logement, contenu, note) VALUES (?, ?, ?, ?)",
      [userId, logementId, contenu, note],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

/**
 * Trouver un avis par son ID
 */
function findById(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour récupérer un avis avec les informations de l'utilisateur
    db.query(
      "SELECT a.*, u.prenom, u.nom FROM avis a JOIN utilisateur u ON a.id_user = u.id_user WHERE a.id_avis = ?",
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

/**
 * Trouver tous les avis d'un logement
 */
function findByLogement(logementId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour récupérer les avis avec les noms des utilisateurs, triés par date
    db.query(
      "SELECT a.*, u.prenom, u.nom FROM avis a JOIN utilisateur u ON a.id_user = u.id_user WHERE a.id_logement = ? ORDER BY a.date DESC",
      [logementId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

/**
 * Supprimer tous les avis d'un utilisateur
 */
function deleteByUser(userId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer les avis de l'utilisateur
    db.query("DELETE FROM avis WHERE id_user = ?", [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Supprimer tous les avis d'un logement
 */
function deleteByLogement(logementId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer tous les avis du logement
    db.query("DELETE FROM avis WHERE id_logement = ?", [logementId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { create, findById, findByLogement, deleteByUser, deleteByLogement };
