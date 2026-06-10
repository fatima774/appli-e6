/**
 * FICHIER: routes/avisRoutes.js
 * Rôle: Définir les routes pour gérer les avis sur les logements.
 */

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { createAvis, getAvis } = require("../controllers/avisController");

// Route pour créer un avis (POST) - protégée par auth
router.post("/avis", auth, createAvis);

// Route pour récupérer les avis d'un logement (GET) - publique
router.get("/avis/:id_logement", getAvis);

module.exports = router;
