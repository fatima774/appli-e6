/**
 * FICHIER: controllers/adminController.js
 * Rôle: Gérer l'administration (connexion admin, gestion des utilisateurs et logements).
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
const avisModel = require("../models/avisModel");
const logementModel = require("../models/logementModel");

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

/**
 * Connexion administrateur
 * POST /admin/login
 */
async function login(req, res) {
  const { username, password } = req.body;

  // Vérifier les champs obligatoires
  if (!username || !password) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  try {
    // Rechercher l'administrateur dans la base
    const admin = await adminModel.findByUsername(username);
    if (!admin) return res.status(401).json({ error: "Identifiants incorrects" });

    // Comparer le mot de passe avec le hash BCrypt stocké
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Identifiants incorrects" });

    // Générer un JWT avec le rôle admin, valable 24h
    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ message: "Connexion réussie", token });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Récupérer tous les utilisateurs
 * GET /admin/users
 */
async function getUsers(req, res) {
  try {
    res.json(await adminModel.findAllUsers());
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Supprimer un utilisateur (et ses données associées)
 * DELETE /admin/users/:id
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    // Supprimer les avis de l'utilisateur
    await avisModel.deleteByUser(id);
    // Supprimer les likes (favoris) de l'utilisateur
    await adminModel.deleteLikesByUser(id);
    // Supprimer les logements de l'utilisateur
    await adminModel.deleteLogementsByUser(id);
    // Supprimer l'utilisateur
    await adminModel.deleteUser(id);
    res.json({ message: "Utilisateur supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Supprimer un logement (et ses données associées)
 * DELETE /admin/logements/:id
 */
async function deleteLogement(req, res) {
  const { id } = req.params;

  try {
    // Supprimer les avis du logement
    await avisModel.deleteByLogement(id);
    // Supprimer les likes (favoris) du logement
    await logementModel.deleteLikesByLogement(id);
    // Supprimer le logement
    await adminModel.deleteLogement(id);
    res.json({ message: "Logement supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

module.exports = { login, getUsers, deleteUser, deleteLogement };
