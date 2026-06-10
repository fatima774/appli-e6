/**
 * FICHIER: routes/adminRoutes.js
 * Rôle: Définir les routes d'administration (gestion des utilisateurs et logements).
 */

const express = require("express");
const router = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const { login, getUsers, deleteUser, deleteLogement } = require("../controllers/adminController");

// Route de connexion admin (POST) - publique
router.post("/admin/login", login);

// Route pour récupérer tous les utilisateurs (GET) - protégée par authAdmin
router.get("/admin/users", authAdmin, getUsers);

// Route pour supprimer un utilisateur (DELETE) - protégée par authAdmin
router.delete("/admin/users/:id", authAdmin, deleteUser);

// Route pour supprimer un logement (DELETE) - protégée par authAdmin
router.delete("/admin/logements/:id", authAdmin, deleteLogement);

module.exports = router;
