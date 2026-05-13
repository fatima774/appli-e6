const db = require("../config/db");

function create(userId, logementId, contenu, note) {
  return new Promise((resolve, reject) => {
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

function findById(id) {
  return new Promise((resolve, reject) => {
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

function findByLogement(logementId) {
  return new Promise((resolve, reject) => {
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

function deleteByUser(userId) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM avis WHERE id_user = ?", [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function deleteByLogement(logementId) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM avis WHERE id_logement = ?", [logementId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { create, findById, findByLogement, deleteByUser, deleteByLogement };
