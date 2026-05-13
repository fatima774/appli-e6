const db = require("../config/db");

function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM utilisateur WHERE email = ?", [email], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || null);
    });
  });
}

function create({ prenom, nom, email, password, photo }) {
  return new Promise((resolve, reject) => {
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

function findById(id) {
  return new Promise((resolve, reject) => {
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

function update(setClause, values) {
  return new Promise((resolve, reject) => {
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
