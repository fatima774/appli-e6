require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossier uploads accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer configuration pour gérer les fichiers images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, Date.now() + "-" + safeName);
  }
});
const upload = multer({ storage });

// Connexion MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "fatima",
  password: process.env.DB_PASS || "root",
  database: process.env.DB_NAME || "logements_etudiants",
  multipleStatements: false
});
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base :", err);
    return;
  }
  console.log("✅ Connecté à la base logements_etudiants");
});

// =========================
// CONFIG / CONSTANTES
// =========================
const PW_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const JWT_SECRET = process.env.JWT_SECRET || "secret_dev_change_me";
const PORT = process.env.PORT || 3001;

// Nodemailer transporter (configure via .env)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Optional: verify transporter at startup (logs only)
transporter.verify((err, success) => {
  if (err) console.warn("Warning: mailer verify failed:", err.message || err);
  else console.log("Mailer ready");
});

// =========================
// ROUTES LOGEMENTS
// =========================

// Récupérer tous les logements avec leurs photos
app.get("/logements", (req, res) => {
  const sql = `
    SELECT l.id_logement, l.titre, l.ville, l.prix, l.type, l.adresse, l.description, l.date_ajout, p.url_photo
    FROM logement l
    LEFT JOIN photo p ON l.id_logement = p.id_logement
    ORDER BY l.date_ajout DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
    const logements = {};
    rows.forEach(row => {
      if (!logements[row.id_logement]) {
        logements[row.id_logement] = {
          id_logement: row.id_logement,
          titre: row.titre,
          ville: row.ville,
          prix: row.prix,
          type: row.type,
          adresse: row.adresse,
          description: row.description,
          date_ajout: row.date_ajout,
          photos: []
        };
      }
      if (row.url_photo) logements[row.id_logement].photos.push(row.url_photo);
    });
    res.json(Object.values(logements));
  });
});

// Récupérer un logement par id avec ses photos
app.get("/logements/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT l.id_logement, l.titre, l.ville, l.prix, l.type, l.adresse, l.description, l.date_ajout, p.url_photo
    FROM logement l
    LEFT JOIN photo p ON l.id_logement = p.id_logement
    WHERE l.id_logement = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
    if (rows.length === 0) return res.status(404).json({ error: "Logement non trouvé" });
    const logement = {
      id_logement: rows[0].id_logement,
      titre: rows[0].titre,
      ville: rows[0].ville,
      prix: rows[0].prix,
      type: rows[0].type,
      adresse: rows[0].adresse,
      description: rows[0].description,
      date_ajout: rows[0].date_ajout,
      photos: rows.filter(r => r.url_photo).map(r => r.url_photo)
    };
    res.json(logement);
  });
});

// Ajouter un logement avec multi-photos
app.post("/logements", upload.array("images", 8), (req, res) => {
  const { titre, ville, prix, type, adresse, description } = req.body;
  const files = req.files;

  if (!titre || !ville || !prix) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const sqlLogement = `
    INSERT INTO logement (titre, ville, prix, type, adresse, description, date_ajout)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  db.query(sqlLogement, [titre, ville, prix, type, adresse, description], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur SQL logement", details: err });
    const id_logement = result.insertId;
    if (files && files.length > 0) {
      const sqlPhoto = "INSERT INTO photo (url_photo, id_logement) VALUES ?";
      const values = files.map(f => [f.filename, id_logement]);
      db.query(sqlPhoto, [values], (err2) => {
        if (err2) return res.status(500).json({ error: "Erreur SQL photo", details: err2 });
        res.status(201).json({ id_logement, titre, ville, prix, photos: values.map(v => v[0]) });
      });
    } else {
      res.status(201).json({ id_logement, titre, ville, prix, photos: [] });
    }
  });
});

// Modifier un logement (sans gestion avancée des photos ici)
app.put("/logements/:id", (req, res) => {
  const id = req.params.id;
  const { titre, ville, prix, type, adresse, description } = req.body;

  if (!titre || !ville || !prix) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const sql = `
    UPDATE logement
    SET titre = ?, ville = ?, prix = ?, type = ?, adresse = ?, description = ?
    WHERE id_logement = ?
  `;
  db.query(sql, [titre, ville, prix, type, adresse, description, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Logement introuvable" });
    res.json({ message: "Logement mis à jour avec succès" });
  });
});

// Supprimer un logement et ses photos
app.delete("/logements/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT url_photo FROM photo WHERE id_logement = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL", details: err });

    rows.forEach(r => {
      if (r.url_photo) {
        const filePath = path.join(__dirname, "uploads", r.url_photo);
        fs.unlink(filePath, () => {});
      }
    });

    db.query("DELETE FROM photo WHERE id_logement = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: "Erreur SQL", details: err2 });

      db.query("DELETE FROM logement WHERE id_logement = ?", [id], (err3, result) => {
        if (err3) return res.status(500).json({ error: "Erreur SQL", details: err3 });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Logement introuvable" });
        res.json({ message: "Logement et photos supprimés avec succès" });
      });
    });
  });
});

// Statistiques simples
app.get("/stats", (req, res) => {
  db.query("SELECT COUNT(*) AS total, AVG(prix) AS moyenne FROM logement", (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
    res.json(result[0]);
  });
});

// =========================
// ROUTES UTILISATEURS
// =========================

// Inscription avec token de vérification
app.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    if (!PW_POLICY.test(password)) {
      return res.status(400).json({
        error: "Mot de passe trop faible (min 8 caractères, 1 majuscule, 1 chiffre, 1 symbole)"
      });
    }

    db.query("SELECT * FROM utilisateur WHERE email = ?", [email], async (err, existingUsers) => {
      if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Email déjà utilisé" });
      }

// Génération du token et de sa date d’expiration
const verificationToken = crypto.randomBytes(32).toString("hex");
const expires = new Date(Date.now() + 3600000); // expire dans 1h
const expiresSql = expires.toISOString().slice(0, 19).replace('T', ' ');

// Insertion dans la base avec la colonne verification_token_expires
db.query(
  "INSERT INTO utilisateur (nom, prenom, email, password, is_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, ?, ?)",
  [nom, prenom, email, hashedPassword, false, verificationToken, expiresSql],
  (err2, result) => {
    if (err2) return res.status(500).json({ error: "Erreur SQL", details: err2 });

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify?token=${verificationToken}`;
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Vérification de votre compte",
      text: `Bonjour ${prenom},\n\nMerci de vous être inscrit(e). Cliquez sur le lien pour vérifier votre adresse email:\n\n${verifyUrl}\n\nCe lien expire dans 1 heure.`
    };

    transporter.sendMail(mailOptions, (mailErr) => {
      if (mailErr) console.error("Erreur envoi mail vérif:", mailErr);
      res.status(201).json({
        message: "Utilisateur créé. Un email de vérification a été envoyé.",
        id_user: result.insertId
      });
    });
  }
);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur", details: err });
  }
});

// Vérification email
// Vérification email avec contrôle d’expiration
app.get("/verify", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Token manquant");

  db.query("SELECT id_user, verification_token_expires FROM utilisateur WHERE verification_token = ?", [token], (err, rows) => {
    if (err) return res.status(500).send("Erreur SQL");
    if (rows.length === 0) return res.status(400).send("Token invalide ou déjà utilisé");

    const user = rows[0];
    const now = new Date();
    const expires = new Date(user.verification_token_expires);

    if (expires < now) {
      return res.status(400).send("Lien expiré, veuillez vous réinscrire.");
    }

    db.query("UPDATE utilisateur SET is_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id_user = ?", [user.id_user], (err2) => {
      if (err2) return res.status(500).send("Erreur SQL update");
      res.send("✅ Email vérifié avec succès !");
    });
  });
});


// Demande de réinitialisation de mot de passe
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis" });

  // Vérifier si l'email existe d'abord
  db.query("SELECT id_user FROM utilisateur WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("Erreur SQL forgot-password select:", err);
      return res.status(500).json({ error: "Erreur SQL", details: err });
    }

    // Toujours renvoyer un message générique pour ne pas divulguer l'existence d'un compte
    if (rows.length === 0) {
      return res.json({ message: "Email de réinitialisation envoyé si l'adresse existe." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    // Format MySQL DATETIME: YYYY-MM-DD HH:MM:SS
    const expires = new Date(Date.now() + 3600000);
    const expiresSql = expires.toISOString().slice(0, 19).replace('T', ' ');

    db.query("UPDATE utilisateur SET reset_token = ?, reset_expires = ? WHERE email = ?", [token, expiresSql, email], (err2) => {
      if (err2) {
        console.error("Erreur SQL forgot-password update:", err2);
        return res.status(500).json({ error: "Erreur SQL", details: err2 });
      }

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: "Réinitialisation de mot de passe",
        text: `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien pour définir un nouveau mot de passe (valide 1 heure):\n\n${resetUrl}`
      };

      transporter.sendMail(mailOptions, (mailErr) => {
        if (mailErr) console.error("Erreur envoi mail reset:", mailErr);
        res.json({ message: "Email de réinitialisation envoyé si l'adresse existe." });
      });
    });
  });
});

// Réinitialisation du mot de passe
app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token et nouveau mot de passe requis" });

    if (!PW_POLICY.test(newPassword)) {
      return res.status(400).json({ error: "Mot de passe trop faible (min 8 caractères, 1 majuscule, 1 chiffre, 1 symbole)" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    db.query(
      "UPDATE utilisateur SET password = ?, reset_token = NULL, reset_expires = NULL WHERE reset_token = ? AND reset_expires > NOW()",
      [hashed, token],
      (err, result) => {
        if (err) {
          console.error("Erreur SQL reset-password:", err);
          return res.status(500).json({ error: "Erreur SQL", details: err });
        }
        if (result.affectedRows === 0) return res.status(400).json({ error: "Token invalide ou expiré" });
        res.json({ message: "Mot de passe réinitialisé avec succès." });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur", details: err });
  }
});

// Connexion (renvoie token JWT)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    db.query("SELECT * FROM utilisateur WHERE email = ?", [email], async (err, users) => {
      if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
      if (users.length === 0) {
        return res.status(400).json({ error: "Email ou mot de passe incorrect" });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Email ou mot de passe incorrect" });
      }

      // MySQL may return 0/1 for boolean fields; handle both
      const verified = user.is_verified === 1 || user.is_verified === true;
      if (!verified) {
        return res.status(403).json({ error: "Email non vérifié. Vérifiez votre boîte mail." });
      }

      const token = jwt.sign(
        { id_user: user.id_user, email: user.email },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.json({
        message: "Connexion réussie",
        token,
        user: {
          id_user: user.id_user,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email
        }
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur", details: err });
  }
});

// Middleware d'authentification
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

// Route protégée : profil utilisateur
app.get("/profile", auth, (req, res) => {
  db.query("SELECT id_user, nom, prenom, email FROM utilisateur WHERE id_user = ?", [req.user.id_user], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erreur SQL", details: err });
    if (!rows.length) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(rows[0]);
  });
});

// =========================
// Routes utilitaires / health
// =========================
app.get("/", (req, res) => {
  res.send("✅ API Node.js est en ligne !");
});

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

// =========================
// Démarrage du serveur
// =========================
app.listen(PORT, () => console.log(`🚀 API Node.js lancée sur http://localhost:${PORT}`));
