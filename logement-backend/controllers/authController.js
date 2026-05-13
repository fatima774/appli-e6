const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const utilisateurModel = require("../models/utilisateurModel");

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

async function register(req, res) {
  try {
    const { nom, prenom, email, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const photoFilename = req.file ? req.file.filename : null;

    const result = await utilisateurModel.create({
      prenom,
      nom,
      email,
      password: hashed,
      photo: photoFilename
    });

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
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }
    console.error("Erreur register:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  utilisateurModel.findByEmail(email)
    .then((user) => {
      if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

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
    })
    .catch(() => res.status(500).json({ error: "Erreur SQL" }));
}

module.exports = { register, login };
