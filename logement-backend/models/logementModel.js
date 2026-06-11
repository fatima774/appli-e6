/**
 * FICHIER: models/logementModel.js
 * Rôle: Fonctions d'accès à la base de données pour les logements (CRUD), gestion des favoris et photos.
 */

const db = require("../config/db");

// =====================
// HELPERS SCHEMA - Fonctions utilitaires pour gérer les colonnes de la table
// =====================

let logementColumnsPromise = null;

/**
 * Charger les noms de colonnes de la table logement (en cache)
 */
function loadLogementColumns(forceRefresh = false) {
  if (!forceRefresh && logementColumnsPromise) return logementColumnsPromise;
  logementColumnsPromise = new Promise((resolve, reject) => {
    // Requête SQL pour récupérer les colonnes de la table logement
    db.query("SHOW COLUMNS FROM logement", (err, rows) => {
      if (err) return reject(err);
      // Retourner un Set pour une recherche rapide
      resolve(new Set(rows.map((row) => row.Field)));
    });
  });
  return logementColumnsPromise;
}

/**
 * Ajouter la colonne 'photos' si elle n'existe pas
 */
function ensureLogementPhotoColumns() {
  return new Promise((resolve, reject) => {
    // Requête SQL pour créer la colonne photos si elle n'existe pas
    db.query(
      "ALTER TABLE logement ADD COLUMN IF NOT EXISTS photos TEXT NULL",
      (err) => {
        if (err) return reject(err);
        loadLogementColumns(true).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * Trouver le nom de la colonne propriétaire (selon le schéma)
 */
function getOwnerColumn(columns) {
  if (columns.has("id_user")) return "id_user";
  if (columns.has("user_id")) return "user_id";
  if (columns.has("id_utilisateur")) return "id_utilisateur";
  if (columns.has("owner_id")) return "owner_id";
  return null;
}

/**
 * Trouver le nom de la colonne image (selon le schéma)
 */
function getImageColumn(columns) {
  if (columns.has("image")) return "image";
  if (columns.has("photo")) return "photo";
  return null;
}

/**
 * Normaliser une valeur optionnelle (null, undefined ou chaîne vide)
 */
function normalizeOptionalValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/**
 * Normaliser un logement (traiter les photos JSON ou délimitées par virgules)
 */
function normalizeLogementRow(row) {
  if (!row) return row;
  let photos = row.photos;
  if (typeof photos === "string") {
    try {
      // Essayer de parser en JSON
      photos = JSON.parse(photos);
    } catch {
      // Sinon, diviser par virgule
      photos = photos.split(",").map((p) => p.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(photos)) photos = [];
  const primaryImage = row.image || row.photo || photos[0] || null;
  return { ...row, image: primaryImage, photos };
}

/**
 * Sérialiser les photos en JSON
 */
function serializePhotos(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  return JSON.stringify(files);
}

/**
 * Obtenir la première photo (image principale)
 */
function getPrimaryPhoto(files) {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  return files[0];
}

/**
 * Ajouter les colonnes image et photos au payload
 */
function setImageFields(payload, columns, files) {
  const imageColumn = getImageColumn(columns);
  const primaryPhoto = getPrimaryPhoto(files);
  const serializedPhotos = serializePhotos(files);
  if (imageColumn && primaryPhoto !== undefined) payload[imageColumn] = primaryPhoto;
  if (columns.has("photos") && serializedPhotos !== null) payload.photos = serializedPhotos;
  return payload;
}

/**
 * Construire le payload pour créer/mettre à jour un logement
 */
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
// REQUÊTES SQL - Fonctions pour interagir avec la base de données
// =====================

/**
 * Récupérer tous les logements
 */
function findAll() {
  return new Promise((resolve, reject) => {
    // Requête SQL pour lister tous les logements
    db.query("SELECT * FROM logement", (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(normalizeLogementRow));
    });
  });
}

/**
 * Récupérer un logement par son ID
 */
function findById(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour trouver un logement spécifique
    db.query("SELECT * FROM logement WHERE id_logement = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] ? normalizeLogementRow(rows[0]) : null);
    });
  });
}

/**
 * Récupérer tous les logements d'un utilisateur
 */
function findByUserId(userId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour lister les logements de l'utilisateur
    db.query("SELECT * FROM logement WHERE id_user = ?", [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(normalizeLogementRow));
    });
  });
}

/**
 * Récupérer le propriétaire d'un logement
 */
function findOwner(id, ownerColumn) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour vérifier le propriétaire
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

/**
 * Insérer un nouveau logement
 */
function insert(fields, values) {
  return new Promise((resolve, reject) => {
    // Construire dynamiquement la requête SQL INSERT avec les champs fournis
    const sql = `INSERT INTO logement (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;
    db.query(sql, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Mettre à jour un logement
 */
function update(setClause, values) {
  return new Promise((resolve, reject) => {
    // Requête SQL dynamique pour mettre à jour les champs fournis
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

/**
 * Supprimer un logement
 */
function deleteById(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer un logement
    db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Supprimer tous les favoris associés à un logement
 */
function deleteLikesByLogement(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer les likes du logement
    db.query("DELETE FROM user_likes WHERE id_logement = ?", [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Vérifier si un utilisateur a aimé un logement
 */
function findLike(userId, logementId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour vérifier l'existence d'un favori
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

/**
 * Ajouter un logement aux favoris
 */
function addLike(userId, logementId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour insérer un like
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

/**
 * Retirer un logement des favoris
 */
function removeLike(userId, logementId) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour supprimer un like
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

/**
 * Mettre à jour le nombre de likes d'un logement
 */
function updateLikesCount(id, delta) {
  // Incrémenter ou décrémenter le compteur
  const op = delta > 0 ? "likes_count + 1" : "likes_count - 1";
  return new Promise((resolve, reject) => {
    // Requête SQL pour mettre à jour le compteur
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

/**
 * Récupérer le nombre de likes d'un logement
 */
function getLikesCount(id) {
  return new Promise((resolve, reject) => {
    // Requête SQL pour lire le compteur de likes
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
/**
 * FONCTION 1 : Récupérer tous les équipements disponibles
 *
 *
 *
 * */
function getEquipements() {
  return new Promise((resolve, reject) => {
    //requete sql pour récupérer tous les équipements disponibles
    db.query("SELECT * FROM equipement", (err, rows) => {
      //si erreur , on l'envoie au controller
      if (err) return reject(err);
      //sinon on retourne les équipements
      resolve(rows);
    });
  });
}

/**
 * FONCTION 2 : Récupérer les équipements d'un logement précis
 *
 */function getEquipementsByLogement(id_logement) {
  return new Promise((resolve, reject) => {
    // On fait une jointure entre les deux tables :
    // logement_equipement nous dit quels équipements appartiennent au logement
    // equipement nous donne le libellé (WiFi, Parking...)
    db.query(
      `SELECT equipement.* 
       FROM equipement 
       JOIN logement_equipement 
       ON equipement.id_equipement = logement_equipement.id_equipement 
       WHERE logement_equipement.id_logement = ?`,
      [id_logement],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

/**
 * FONCTION 3 : Sauvegarder les équipements cochés par l'utilisateur

 */
function saveEquipements(id_logement, ids) {
  return new Promise((resolve, reject) => {
    // Étape 1 : On supprime les anciens équipements du logement
    db.query(
      "DELETE FROM logement_equipement WHERE id_logement = ?",
      [id_logement],
      (err) => {
        if (err) return reject(err);
        // Si aucun équipement coché, on s'arrête là
        if (!ids || ids.length === 0) return resolve();
        // Étape 2 : On insère les nouveaux équipements cochés
        // values = [[1,1], [1,3]] par exemple pour le logement 1 avec WiFi et Meublé
        const values = ids.map(id => [id_logement, id]);
        db.query(
          "INSERT INTO logement_equipement (id_logement, id_equipement) VALUES ?",
          [values],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
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
  getLikesCount,
  getEquipements,
getEquipementsByLogement,
saveEquipements
};
