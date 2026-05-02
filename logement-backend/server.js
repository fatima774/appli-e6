if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ======================
// MIDDLEWARES
// ======================
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// NODEMAILER
// ======================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ======================
// DATABASE
// ======================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "logements_etudiants",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

let logementColumnsPromise = null;

function loadLogementColumns(forceRefresh = false) {
  if (!forceRefresh && logementColumnsPromise) {
    return logementColumnsPromise;
  }

  logementColumnsPromise = new Promise((resolve, reject) => {
    db.query("SHOW COLUMNS FROM logement", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(new Set(rows.map((row) => row.Field)));
    });
  });

  return logementColumnsPromise;
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
      photos = photos
        .split(",")
        .map((photo) => photo.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(photos)) {
    photos = [];
  }

  const primaryImage = row.image || row.photo || photos[0] || null;

  return {
    ...row,
    image: primaryImage,
    photos,
  };
}

function getImageColumn(columns) {
  if (columns.has("image")) return "image";
  if (columns.has("photo")) return "photo";
  return null;
}

function serializePhotos(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  return JSON.stringify(files);
}

function getPrimaryPhoto(files) {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  return files[0];
}

function ensureLogementPhotoColumns() {
  return new Promise((resolve, reject) => {
    db.query(
      `
        ALTER TABLE logement
        ADD COLUMN IF NOT EXISTS photos TEXT NULL
      `,
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        loadLogementColumns(true).then(resolve).catch(reject);
      }
    );
  });
}

function setImageFields(payload, columns, files) {
  const imageColumn = getImageColumn(columns);
  const primaryPhoto = getPrimaryPhoto(files);
  const serializedPhotos = serializePhotos(files);

  if (imageColumn && primaryPhoto !== undefined) {
    payload[imageColumn] = primaryPhoto;
  }

  if (columns.has("photos") && serializedPhotos !== null) {
    payload.photos = serializedPhotos;
  }

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
  if (ownerColumn && options.ownerId !== undefined) {
    payload[ownerColumn] = options.ownerId;
  }

  setImageFields(payload, columns, options.imageFilenames || []);

  return payload;
}

function getOwnerColumn(columns) {
  if (columns.has("id_user")) return "id_user";
  if (columns.has("user_id")) return "user_id";
  if (columns.has("id_utilisateur")) return "id_utilisateur";
  if (columns.has("owner_id")) return "owner_id";
  return null;
}

db.connect(err => {
  if (err) {
    console.error("❌ DB error:", err);
    process.exit(1);
  }
  console.log("✅ MySQL connecté");

  // Ajouter colonnes si elles n'existent pas
  db.query(`
    ALTER TABLE utilisateur
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_expires DATETIME
  `, (err) => {
    if (err) console.error("Erreur ajout colonnes reset:", err);
    else console.log("✅ Colonnes reset ajoutées");
  });

  ensureLogementPhotoColumns()
    .then((columns) => {
      console.log("Colonnes logement detectees:", [...columns].join(", "));
    })
    .catch((schemaErr) => {
      console.error("Erreur lecture schema logement:", schemaErr);
    });
});

// ======================
// AUTH MIDDLEWARE
// ======================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    console.log("Decoded token:", decoded);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

// ======================
// MULTER (PHOTO PROFIL)
// ======================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// ======================
// PASSWORD VALIDATION REGEX
// ======================
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

function isPasswordStrong(password) {
  return PASSWORD_REGEX.test(password);
}

// ======================
// REGISTER
// ======================
app.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: "Mot de passe trop faible. Il doit contenir au moins une majuscule, un chiffre, un caractère spécial et faire 8 caractères minimum" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const photoFilename = req.file ? req.file.filename : null;

    console.log("✅ Enregistrement - Photo:", photoFilename || "Aucune");

    db.query(
      `INSERT INTO utilisateur (prenom, nom, username, email, password, photo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [prenom, nom, email, email, hashed, photoFilename],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Email déjà utilisé" });
          }
          console.error("Erreur SQL register:", err);
          return res.status(500).json({ error: "Erreur SQL" });
        }
        const token = jwt.sign({ id_user: result.insertId }, JWT_SECRET, { expiresIn: "24h" });
        res.status(201).json({
          message: "Inscription réussie",
          token,
          user: {
            id_user: result.insertId,
            prenom,
            nom,
            username: email,
            email,
            telephone: null,
            adresse: null,
            ecole: null,
            ecole_ville: null,
            date_naissance: null,
            genre: null,
            photo: photoFilename
          }
        });
      }
    );
  } catch (err) {
    console.error("Erreur enregistrement:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ======================
// LOGIN
// ======================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  db.query("SELECT * FROM utilisateur WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const user = rows[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: "Erreur vérification mot de passe" });
      if (!isMatch) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

      // Générer le token avec id_user
      const token = jwt.sign({ id_user: user.id_user }, JWT_SECRET, { expiresIn: "24h" });
      console.log("Generated token for user ID:", user.id_user);

      res.json({
        token,
        user: {
          id_user: user.id_user,
          nom: user.nom,
          prenom: user.prenom,
          username: user.username,
          email: user.email,
          telephone: user.telephone,
          adresse: user.adresse,
          ecole: user.ecole,
          ecole_ville: user.ecole_ville,
          date_naissance: user.date_naissance,
          genre: user.genre,
          photo: user.photo
        }
      });
    });
  });
});

// =====================================================
// PROFIL — AFFICHAGE
// =====================================================
app.get("/profile", auth, (req, res) => {
  db.query(
    `SELECT id_user, prenom, nom, username, email, telephone,
            adresse, ecole, ecole_ville, date_naissance, genre, photo
     FROM utilisateur
     WHERE id_user = ?`,
    [req.user.id_user],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });
      if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });

      const user = rows[0];

      res.json({
        ...user,
        photo: user.photo ? user.photo : null
      });
    }
  );
});


// =====================================================
// PROFIL — MODIFICATION + PHOTO
// =====================================================
app.put("/profile", auth, upload.single("photo"), (req, res) => {
  const id_user = req.user.id_user;

  console.log("PUT /profile - ID utilisateur:", id_user);
  console.log("PUT /profile - Champs reçus:", Object.keys(req.body));
  console.log("PUT /profile - Fichier photo:", req.file ? req.file.filename : "Aucun");

  // Vérifier qu'au moins un champ est envoyé (texte ou photo)
  const hasTextFields = Object.keys(req.body).some(key => req.body[key] !== undefined && req.body[key] !== "");
  const hasPhoto = req.file ? true : false;

  if (!hasTextFields && !hasPhoto) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour" });
  }

  // Construire dynamiquement la requête UPDATE
  const fields = [];
  const values = [];
  const allowedFields = [
    "prenom",
    "nom",
    "username",
    "email",
    "telephone",
    "date_naissance",
    "genre"
  ];

  // Ajouter UNIQUEMENT les champs qui ont une valeur non vide
  Object.keys(req.body).forEach(field => {
    if (allowedFields.includes(field) && req.body[field] !== undefined && req.body[field] !== "") {
      fields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  // Ajouter la photo si présente
  if (req.file) {
    fields.push("photo = ?");
    values.push(req.file.filename);
    console.log("Photo ajoutée:", req.file.filename);
  }

  // Si aucun champ à mettre à jour, retourner erreur
  if (fields.length === 0) {
    return res.status(400).json({ error: "Aucun champ valide à mettre à jour" });
  }

  // Ajouter l'ID pour la clause WHERE
  values.push(id_user);

  const sql = `UPDATE utilisateur SET ${fields.join(", ")} WHERE id_user = ?`;

  console.log("SQL générée:", sql);
  console.log("Valeurs:", values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Erreur SQL:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email ou username déjà utilisé" });
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    console.log("✅ Profil mis à jour avec succès pour l'utilisateur:", id_user);
    res.json({
      message: "Profil mis à jour avec succès",
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
  });
});

// ======================
// CHANGE PASSWORD
// ======================
app.put("/change-password", auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const id_user = req.user.id_user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Mot de passe actuel et nouveau requis" });
  }

  if (!isPasswordStrong(newPassword)) {
    return res.status(400).json({ error: "Mot de passe trop faible. Il doit contenir au moins une majuscule, un chiffre, un caractère spécial et faire 8 caractères minimum" });
  }

  // Récupérer le mot de passe actuel
  db.query("SELECT password FROM utilisateur WHERE id_user = ?", [id_user], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const hashedPassword = rows[0].password;

    // Vérifier le mot de passe actuel
    bcrypt.compare(currentPassword, hashedPassword, (err, isMatch) => {
      if (err) return res.status(500).json({ error: "Erreur vérification mot de passe" });
      if (!isMatch) return res.status(401).json({ error: "Mot de passe actuel incorrect" });

      // Hasher le nouveau mot de passe
      bcrypt.hash(newPassword, 10, (err, newHashed) => {
        if (err) return res.status(500).json({ error: "Erreur hashage mot de passe" });

        // Mettre à jour en base
        db.query("UPDATE utilisateur SET password = ? WHERE id_user = ?", [newHashed, id_user], (err) => {
          if (err) return res.status(500).json({ error: "Erreur mise à jour mot de passe" });
          res.json({ message: "Mot de passe mis à jour avec succès" });
        });
      });
    });
  });
});

// ======================
// FORGOT PASSWORD
// ======================
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  console.log("POST /forgot-password - email:", email);

  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  db.query("SELECT id_user FROM utilisateur WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("Erreur SQL:", err.sqlMessage);
      return res.status(500).json({ error: "Erreur SQL" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "Email introuvable" });
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 heure

    db.query("UPDATE utilisateur SET reset_token = ?, reset_expires = ? WHERE id_user = ?", [resetToken, expires, user.id_user], (err) => {
      if (err) {
        console.error("Erreur SQL:", err.sqlMessage);
        return res.status(500).json({ error: "Erreur SQL" });
      }

      const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Réinitialisation de mot de passe',
        text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
        html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Erreur envoi email:", error);
          return res.status(500).json({ error: "Erreur envoi email" });
        }
        console.log("Email envoyé:", info.response);
        res.json({ message: `Lien de réinitialisation envoyé à ${email}` });
      });
    });
  });
});

// ======================
// LOGEMENTS — AFFICHAGE
// ======================
app.get("/logements", (req, res) => {
  db.query("SELECT * FROM logement", (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    res.json(rows.map(normalizeLogementRow));
  });
});

app.get("/logements/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM logement WHERE id_logement = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
    res.json(normalizeLogementRow(rows[0]));
  });
});

// ======================
// MES LOGEMENTS
// ======================
app.get("/mes-logements", auth, (req, res) => {
  const id_user = req.user.id_user;
  console.log("GET /mes-logements - User ID:", id_user);
  db.query("SELECT * FROM logement WHERE id_user = ?", [id_user], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    res.json(rows.map(normalizeLogementRow));
  });
});

// ======================
// MODIFIER LOGEMENT
// ======================
app.put("/logements/:id", auth, upload.single("image"), (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  // Vérifier que le logement appartient à l'utilisateur
  return loadLogementColumns()
    .then((columns) => {
      const ownerColumn = getOwnerColumn(columns);
      if (!ownerColumn) {
        return res.status(500).json({ error: "Colonne proprietaire introuvable dans logement" });
      }

      db.query(`SELECT ${ownerColumn} FROM logement WHERE id_logement = ?`, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });
        if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
        if (String(rows[0][ownerColumn]) !== String(id_user)) {
          return res.status(403).json({ error: "Non autorisé" });
        }

        const payload = buildLogementPayload(
          { titre, ville, universite, prix, type, adresse, description },
          columns,
          { imageFilenames: image ? [image] : [] }
        );
        const fields = Object.keys(payload);

        if (fields.length === 0) {
          return res.status(400).json({ error: "Aucune donnee a mettre a jour" });
        }

        const sql = `UPDATE logement SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id_logement = ?`;
        const values = [...fields.map((field) => payload[field]), id];

        db.query(sql, values, (updateErr) => {
          if (updateErr) {
            console.error("Erreur SQL lors de la modification du logement:", updateErr);
            return res.status(500).json({ error: "Erreur SQL" });
          }
          res.json({ message: "Logement mis à jour avec succès" });
        });
      });
    })
    .catch((schemaErr) => {
      console.error("Erreur schema logement:", schemaErr);
      res.status(500).json({ error: "Erreur SQL" });
    });
});

// ======================
// SUPPRIMER LOGEMENT (AVEC CASCADE)
// ======================
app.delete("/logements/:id", auth, (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  // Vérifier propriété
  db.query("SELECT id_user FROM logement WHERE id_logement = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
    if (rows[0].id_user !== id_user) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // Supprimer les favoris associés
    db.query("DELETE FROM user_likes WHERE id_logement = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur SQL lors de la suppression des favoris" });

      // Supprimer le logement
      db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL lors de la suppression du logement" });

        res.json({ message: "Logement et favoris associés supprimés avec succès" });
      });
    });
  });
});

// ======================
// LIKE/UNLIKE LOGEMENT
// ======================
app.post("/logements/:id/like", auth, (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  function respondWithLikesCount() {
    db.query("SELECT likes_count FROM logement WHERE id_logement = ?", [id], (countErr, countRows) => {
      if (countErr) return res.status(500).json({ error: "Erreur SQL" });
      if (countRows.length === 0) return res.status(404).json({ error: "Logement non trouve" });
      res.json({ likes_count: countRows[0].likes_count });
    });
  }

  // Vérifier si déjà liké
  db.query("SELECT * FROM user_likes WHERE id_user = ? AND id_logement = ?", [id_user, id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });

    if (rows.length > 0) {
      // Déjà liké, donc unlike
      db.query("DELETE FROM user_likes WHERE id_user = ? AND id_logement = ?", [id_user, id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });

        // Mettre à jour le compteur de likes
        db.query("UPDATE logement SET likes_count = likes_count - 1 WHERE id_logement = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Erreur SQL" });
          respondWithLikesCount();
        });
      });
    } else {
      // Pas encore liké, donc like
      db.query("INSERT INTO user_likes (id_user, id_logement) VALUES (?, ?)", [id_user, id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });

        // Mettre à jour le compteur de likes
        db.query("UPDATE logement SET likes_count = likes_count + 1 WHERE id_logement = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Erreur SQL" });
          respondWithLikesCount();
        });
      });
    }
  });
});

// ======================
// LOGEMENTS — AJOUT
// ======================
app.post("/logements", auth, upload.single("image"), (req, res) => {
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const id_user = req.user.id_user;
  const image = req.file ? req.file.filename : undefined;

  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  return loadLogementColumns()
    .then((columns) => {
      const payload = buildLogementPayload(
        { titre, ville, universite, prix, type, adresse, description },
        columns,
        { imageFilenames: image ? [image] : [], ownerId: id_user }
      );
      const fields = Object.keys(payload);

      if (!fields.includes("titre") || !fields.includes("ville") || !fields.includes("prix")) {
        return res.status(500).json({ error: "Colonnes obligatoires manquantes dans la table logement" });
      }

      const sql = `INSERT INTO logement (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;
      const values = fields.map((field) => payload[field]);

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("Erreur SQL lors de l'ajout de logement:", err);
          return res.status(500).json({ error: "Erreur SQL" });
        }
        res.status(201).json({
          message: "Logement ajouté avec succès",
          logement: normalizeLogementRow({
            id_logement: result.insertId,
            ...payload
          })
        });
      });
    })
    .catch((schemaErr) => {
      console.error("Erreur schema logement:", schemaErr);
      res.status(500).json({ error: "Erreur SQL" });
    });
});

// ======================
// AVIS
// ======================
app.post("/avis", auth, (req, res) => {
  const { id_logement, contenu, note } = req.body;
  const id_user = req.user.id_user;

  if (!id_logement || !contenu) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  db.query(
    "INSERT INTO avis (id_user, id_logement, contenu, note) VALUES (?, ?, ?, ?)",
    [id_user, id_logement, contenu, note || 5],
    (err, result) => {
      if (err) {
        console.error("Erreur insertion avis:", err);
        return res.status(500).json({ error: "Erreur SQL" });
      }
      // Récupérer l'avis inséré
      db.query(
        `SELECT a.*, u.prenom, u.nom FROM avis a JOIN utilisateur u ON a.id_user = u.id_user WHERE a.id_avis = ?`,
        [result.insertId],
        (err2, rows) => {
          if (err2) {
            console.error("Erreur récupération avis:", err2);
            return res.status(500).json({ error: "Erreur récupération avis" });
          }
          res.status(201).json(rows[0]);
        }
      );
    }
  );
});

app.get("/avis/:id_logement", (req, res) => {
  const { id_logement } = req.params;
  db.query(
    `SELECT a.*, u.prenom, u.nom FROM avis a JOIN utilisateur u ON a.id_user = u.id_user WHERE a.id_logement = ? ORDER BY a.date DESC`,
    [id_logement],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });
      res.json(rows);
    }
  );
});

// ======================
app.get("/", (_, res) => res.send("API OK"));

app.listen(PORT, () =>
  console.log(`🚀 API lancée sur le port ${PORT}`)
);