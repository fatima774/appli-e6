/**
 * FICHIER: routes/profileRoutes.js
 * Rôle: Définir les routes pour gérer le profil utilisateur (consultation et modification).
 */

const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const auth = require("../middlewares/auth");
const { getProfile, updateProfile } = require("../controllers/profileController");

// Route pour récupérer le profil de l'utilisateur connecté (GET) - protégée par auth
router.get("/profile", auth, getProfile);

// Route pour mettre à jour le profil (PUT) - protégée par auth, accept une photo en fichier
router.put("/profile", auth, upload.single("photo"), updateProfile);

module.exports = router;
