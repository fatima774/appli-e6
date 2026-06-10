/**
 * FICHIER: routes/authRoutes.js
 * Rôle: Définir les routes pour l'authentification (inscription et connexion).
 */

const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { register, login } = require("../controllers/authController");

// Route d'inscription (POST) - accepte une photo en fichier
router.post("/register", upload.single("photo"), register);

// Route de connexion (POST)
router.post("/login", login);

module.exports = router;
