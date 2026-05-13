const db = require("../config/db");

// =====================
// HELPERS SCHEMA
// =====================

let logementColumnsPromise = null;

function loadLogementColumns(forceRefresh = false) {
  if (!forceRefresh && logementColumnsPromise) return logementColumnsPromise;
  logementColumnsPromise = new Promise((resolve, reject) => {
    db.query("SHOW COLUMNS FROM logement", (err, rows) => {
      if (err) return reject(err);
      resolve(new Set(rows.map((row) => row.Field)));
    });
  });
  return logementColumnsPromise;
}

function ensureLogementPhotoColumns() {
  return new Promise((resolve, reject) => {
    db.query(
      "ALTER TABLE logement ADD COLUMN IF NOT EXISTS photos TEXT NULL",
      (err) => {
        if (err) return reject(err);
        loadLogementColumns(true).then(resolve).catch(reject);
      }
    );
  });
}

function getOwnerColumn(columns) {
  if (columns.has("id_user")) return "id_user";
  if (columns.has("user_id")) return "user_id";
  if (columns.has("id_utilisateur")) return "id_utilisateur";
  if (columns.has("owner_id")) return "owner_id";
  return null;
}

function getImageColumn(columns) {
  if (columns.has("image")) return "image";
  if (columns.has("photo")) return "photo";
  return null;
}

function normalizeOptionalValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

function normalizeLogementRow(row) {
  if (!row) return row;
  let photos = row.photos;
  if (typeof photos === "string") {
    try {
      photos = JSON.parse(photos);
    } catch {
      photos = photos.split(",").map((p) => p.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(photos)) photos = [];
  const primaryImage = row.image || row.photo || photos[0] || null;
  return { ...row, image: primaryImage, photos };
}

function serializePhotos(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  return JSON.stringify(files);
}

function getPrimaryPhoto(files) {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  return files[0];
}

function setImageFields(payload, columns, files) {
  const imageColumn = getImageColumn(columns);
  const primaryPhoto = getPrimaryPhoto(files);
  const serializedPhotos = serializePhotos(files);
  if (imageColumn && primaryPhoto !== undefined) payload[imageColumn] = primaryPhoto;
  if (columns.has("photos") && serializedPhotos !== null) payload.photos = serializedPhotos;
  return payload;
}

function buildLogementPayload(body, columns, options = {}) {
  const payload = {};
  const entries = [
    ["titre", body.titre],
    ["ville", body.ville],
    ["universite", body.universite],
    ["prix", body.prix],
    ["type", body.type],
    ["adresse", body.adresse],
    ["description", body.description]
  ];
  entries.forEach(([field, rawValue]) => {
    if (!columns.has(field)) return;
    payload[field] = field === "prix" ? rawValue : normalizeOptionalValue(rawValue);
  });
  const ownerColumn = getOwnerColumn(columns);
  if (ownerColumn && options.ownerId !== undefined) payload[ownerColumn] = options.ownerId;
  setImageFields(payload, columns, options.imageFilenames || []);
  return payload;
}

// =====================
// REQUÊTES SQL
// =====================

function findAll() {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM logement", (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(normalizeLogementRow));
    });
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM logement WHERE id_logement = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] ? normalizeLogementRow(rows[0]) : null);
    });
  });
}

function findByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM logement WHERE id_user = ?", [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(normalizeLogementRow));
    });
  });
}

function findOwner(id, ownerColumn) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${ownerColumn} FROM logement WHERE id_logement = ?`,
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

function insert(fields, values) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO logement (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;
    db.query(sql, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function update(setClause, values) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE logement SET ${setClause} WHERE id_logement = ?`,
      values,
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function deleteById(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function deleteLikesByLogement(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM user_likes WHERE id_logement = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function findLike(userId, logementId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM user_likes WHERE id_user = ? AND id_logement = ?",
      [userId, logementId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function addLike(userId, logementId) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO user_likes (id_user, id_logement) VALUES (?, ?)",
      [userId, logementId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function removeLike(userId, logementId) {
  return new Promise((resolve, reject) => {
    db.query(
      "DELETE FROM user_likes WHERE id_user = ? AND id_logement = ?",
      [userId, logementId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function updateLikesCount(id, delta) {
  const op = delta > 0 ? "likes_count + 1" : "likes_count - 1";
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE logement SET likes_count = ${op} WHERE id_logement = ?`,
      [id],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function getLikesCount(id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT likes_count FROM logement WHERE id_logement = ?",
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

module.exports = {
  loadLogementColumns,
  ensureLogementPhotoColumns,
  normalizeLogementRow,
  buildLogementPayload,
  getOwnerColumn,
  findAll,
  findById,
  findByUserId,
  findOwner,
  insert,
  update,
  deleteById,
  deleteLikesByLogement,
  findLike,
  addLike,
  removeLike,
  updateLikesCount,
  getLikesCount
};
