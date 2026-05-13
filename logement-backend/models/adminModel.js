const db = require("../config/db");

function findByUsername(username) {
  return new Promise((resolve, reject) => {
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

function findAllUsers() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id_user, nom, prenom, email FROM utilisateur ORDER BY id_user",
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function deleteUser(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM utilisateur WHERE id_user = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function deleteLikesByUser(userId) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM user_likes WHERE id_user = ?", [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function deleteLogementsByUser(userId) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM logement WHERE id_user = ?", [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function deleteLogement(id) {
  return new Promise((resolve, reject) => {
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
