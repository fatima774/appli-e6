if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
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
  origin: function(origin, callback) {
    const allowed = [
      FRONTEND_URL,
      "http://localhost:3000",
      "https://appli-e6-vhar5e03p-fatima774s-projects.vercel.app"
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// NODEMAILER
// ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
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
  if (!forceRefresh && logementColumnsPromise) return logementColumnsPromise;
  logementColumnsPromise = new Promise((resolve, reject) => {
    db.query("SHOW COLUMNS FROM logement", (err, rows) => {
      if (err) return reject(err);
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
      photos = photos.split(",").map((p) => p.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(photos)) photos = [];
  const primaryImage = row.image || row.photo || photos[0] || null;
  return { ...row, image: primaryImage, photos };
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
      "ALTER TABLE logement ADD COLUMN IF NOT EXISTS photos TEXT NULL",
      (err) => {
        if (err) return reject(err);
        loadLogementColumns(true).then(resolve).catch(reject);
      }
    );
  });
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

  db.query(`
    ALTER TABLE utilisateur
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_expires DATETIME
  `, (err) => {
    if (err) console.error("Erreur ajout colonnes reset:", err);
  });

  ensureLogementPhotoColumns().catch((err) => {
    console.error("Erreur lecture schema logement:", err);
  });
});

// ======================
// AUTH MIDDLEWARES
// ======================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

// ======================
// MULTER
// ======================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  }
});
const upload = multer({ storage });

// ======================
// PASSWORD
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

    db.query(
      "INSERT INTO utilisateur (prenom, nom, username, email, password, photo) VALUES (?, ?, ?, ?, ?, ?)",
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

      const token = jwt.sign({ id_user: user.id_user }, JWT_SECRET, { expiresIn: "24h" });
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

// ======================
// PROFIL
// ======================
app.get("/profile", auth, (req, res) => {
  db.query(
    `SELECT id_user, prenom, nom, username, email, telephone,
            adresse, ecole, ecole_ville, date_naissance, genre, photo
     FROM utilisateur WHERE id_user = ?`,
    [req.user.id_user],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });
      if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });
      res.json(rows[0]);
    }
  );
});

app.put("/profile", auth, upload.single("photo"), (req, res) => {
  const id_user = req.user.id_user;
  const hasTextFields = Object.values(req.body).some(v => v !== undefined && v !== "");

  if (!hasTextFields && !req.file) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour" });
  }

  const allowedFields = ["prenom", "nom", "username", "email", "telephone", "date_naissance", "genre"];
  const fields = [];
  const values = [];

  Object.keys(req.body).forEach(field => {
    if (allowedFields.includes(field) && req.body[field] !== undefined && req.body[field] !== "") {
      fields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (req.file) {
    fields.push("photo = ?");
    values.push(req.file.filename);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "Aucun champ valide à mettre à jour" });
  }

  values.push(id_user);

  db.query(`UPDATE utilisateur SET ${fields.join(", ")} WHERE id_user = ?`, values, (err, result) => {
    if (err) {
      console.error("Erreur SQL profil:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email ou username déjà utilisé" });
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
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

  db.query("SELECT password FROM utilisateur WHERE id_user = ?", [id_user], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });

    bcrypt.compare(currentPassword, rows[0].password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: "Erreur vérification mot de passe" });
      if (!isMatch) return res.status(401).json({ error: "Mot de passe actuel incorrect" });

      bcrypt.hash(newPassword, 10, (err, newHashed) => {
        if (err) return res.status(500).json({ error: "Erreur hashage mot de passe" });

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

  if (!email) {
    return res.status(400).json({ error: "Email requis" });
  }

  db.query("SELECT id_user FROM utilisateur WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Email introuvable" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    db.query(
      "UPDATE utilisateur SET reset_token = ?, reset_expires = ? WHERE id_user = ?",
      [resetToken, expires, rows[0].id_user],
      (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });

        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Réinitialisation de mot de passe",
          text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
          html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>`
        }, (error) => {
          if (error) {
            console.error("Erreur envoi email:", error);
            return res.status(500).json({ error: "Erreur envoi email" });
          }
          res.json({ message: `Lien de réinitialisation envoyé à ${email}` });
        });
      }
    );
  });
});

// ======================
// LOGEMENTS
// ======================
app.get("/logements", (req, res) => {
  db.query("SELECT * FROM logement", (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    res.json(rows.map(normalizeLogementRow));
  });
});

app.get("/logements/:id", (req, res) => {
  db.query("SELECT * FROM logement WHERE id_logement = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
    res.json(normalizeLogementRow(rows[0]));
  });
});

app.get("/mes-logements", auth, (req, res) => {
  db.query("SELECT * FROM logement WHERE id_user = ?", [req.user.id_user], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    res.json(rows.map(normalizeLogementRow));
  });
});

app.post("/logements", auth, upload.single("image"), (req, res) => {
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  return loadLogementColumns()
    .then((columns) => {
      const payload = buildLogementPayload(
        { titre, ville, universite, prix, type, adresse, description },
        columns,
        { imageFilenames: image ? [image] : [], ownerId: req.user.id_user }
      );
      const fields = Object.keys(payload);

      if (!fields.includes("titre") || !fields.includes("ville") || !fields.includes("prix")) {
        return res.status(500).json({ error: "Colonnes obligatoires manquantes dans la table logement" });
      }

      const sql = `INSERT INTO logement (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;

      db.query(sql, fields.map((f) => payload[f]), (err, result) => {
        if (err) {
          console.error("Erreur SQL ajout logement:", err);
          return res.status(500).json({ error: "Erreur SQL" });
        }
        res.status(201).json({
          message: "Logement ajouté avec succès",
          logement: normalizeLogementRow({ id_logement: result.insertId, ...payload })
        });
      });
    })
    .catch((err) => {
      console.error("Erreur schema logement:", err);
      res.status(500).json({ error: "Erreur SQL" });
    });
});

app.put("/logements/:id", auth, upload.single("image"), (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

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
          return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
        }

        const sql = `UPDATE logement SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id_logement = ?`;

        db.query(sql, [...fields.map((f) => payload[f]), id], (err) => {
          if (err) {
            console.error("Erreur SQL modification logement:", err);
            return res.status(500).json({ error: "Erreur SQL" });
          }
          res.json({ message: "Logement mis à jour avec succès" });
        });
      });
    })
    .catch((err) => {
      console.error("Erreur schema logement:", err);
      res.status(500).json({ error: "Erreur SQL" });
    });
});

app.delete("/logements/:id", auth, (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  db.query("SELECT id_user FROM logement WHERE id_logement = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
    if (rows[0].id_user !== id_user) return res.status(403).json({ error: "Non autorisé" });

    db.query("DELETE FROM user_likes WHERE id_logement = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });

      db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });
        res.json({ message: "Logement et favoris associés supprimés avec succès" });
      });
    });
  });
});

// ======================
// LIKE / UNLIKE
// ======================
app.post("/logements/:id/like", auth, (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  function respondWithLikesCount() {
    db.query("SELECT likes_count FROM logement WHERE id_logement = ?", [id], (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });
      if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
      res.json({ likes_count: rows[0].likes_count });
    });
  }

  db.query("SELECT * FROM user_likes WHERE id_user = ? AND id_logement = ?", [id_user, id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });

    if (rows.length > 0) {
      db.query("DELETE FROM user_likes WHERE id_user = ? AND id_logement = ?", [id_user, id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });
        db.query("UPDATE logement SET likes_count = likes_count - 1 WHERE id_logement = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Erreur SQL" });
          respondWithLikesCount();
        });
      });
    } else {
      db.query("INSERT INTO user_likes (id_user, id_logement) VALUES (?, ?)", [id_user, id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });
        db.query("UPDATE logement SET likes_count = likes_count + 1 WHERE id_logement = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Erreur SQL" });
          respondWithLikesCount();
        });
      });
    }
  });
});

// ======================
// AVIS
// ======================
app.post("/avis", auth, (req, res) => {
  const { id_logement, contenu, note } = req.body;

  if (!id_logement || !contenu) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  db.query(
    "INSERT INTO avis (id_user, id_logement, contenu, note) VALUES (?, ?, ?, ?)",
    [req.user.id_user, id_logement, contenu, note || 5],
    (err, result) => {
      if (err) {
        console.error("Erreur insertion avis:", err);
        return res.status(500).json({ error: "Erreur SQL" });
      }
      db.query(
        "SELECT a.*, u.prenom, u.nom FROM avis a JOIN utilisateur u ON a.id_user = u.id_user WHERE a.id_avis = ?",
        [result.insertId],
        (err, rows) => {
          if (err) return res.status(500).json({ error: "Erreur récupération avis" });
          res.status(201).json(rows[0]);
        }
      );
    }
  );
});

app.get("/avis/:id_logement", (req, res) => {
  db.query(
    "SELECT a.*, u.prenom, u.nom FROM avis a JOIN utilisateur u ON a.id_user = u.id_user WHERE a.id_logement = ? ORDER BY a.date DESC",
    [req.params.id_logement],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });
      res.json(rows);
    }
  );
});

// ======================
// ADMIN
// ======================
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  db.query("SELECT password_hash FROM admin_user WHERE username = ?", [username], async (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    if (rows.length === 0) return res.status(401).json({ error: "Identifiants incorrects" });

    const isMatch = await bcrypt.compare(password, rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ error: "Identifiants incorrects" });

    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ message: "Connexion réussie", token });
  });
});

app.get("/admin/users", authAdmin, (req, res) => {
  db.query("SELECT id_user, nom, prenom, email FROM utilisateur ORDER BY id_user", (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });
    res.json(rows);
  });
});

app.delete("/admin/users/:id", authAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM avis WHERE id_user = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });

    db.query("DELETE FROM user_likes WHERE id_user = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });

      db.query("DELETE FROM logement WHERE id_user = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });

        db.query("DELETE FROM utilisateur WHERE id_user = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Erreur SQL" });
          res.json({ message: "Utilisateur supprimé" });
        });
      });
    });
  });
});

app.delete("/admin/logements/:id", authAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM avis WHERE id_logement = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur SQL" });

    db.query("DELETE FROM user_likes WHERE id_logement = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur SQL" });

      db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });
        res.json({ message: "Logement supprimé" });
      });
    });
  });
});

// ======================
app.get("/", (_, res) => res.send("API OK"));

app.listen(PORT, () => console.log(`🚀 API lancée sur le port ${PORT}`));
