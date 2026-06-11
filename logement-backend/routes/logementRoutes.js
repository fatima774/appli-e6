/**
 * FICHIER: routes/logementRoutes.js
 * Rôle: Définir les routes pour gérer les logements (CRUD et favoris).
 */

const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const auth = require("../middlewares/auth");
const { getAll, getOne, getMine, create, update, remove, toggleLike, getEquipements, saveEquipements } = require("../controllers/logementController");

// Route pour récupérer tous les logements (GET) - publique
router.get("/logements", getAll);

// Route pour récupérer un logement spécifique (GET) - publique
router.get("/logements/:id", getOne);

// Route pour récupérer mes logements (GET) - protégée par auth
router.get("/mes-logements", auth, getMine);

// Route pour créer un logement (POST) - protégée par auth, accept une image
router.post("/logements", auth, upload.single("image"), create);

// Route pour modifier un logement (PUT) - protégée par auth, accept une image
router.put("/logements/:id", auth, upload.single("image"), update);

// Route pour supprimer un logement (DELETE) - protégée par auth
router.delete("/logements/:id", auth, remove);

// Route pour aimer/désaimer un logement (POST) - protégée par auth
router.post("/logements/:id/like", auth, toggleLike);

// Route pour récupérer tous les équipements disponibles (GET) - publique
router.get("/equipements", getEquipements);

// Route pour sauvegarder les équipements d'un logement (POST) - protégée par auth
router.post("/logements/:id/equipements", auth, saveEquipements);
module.exports = router;
