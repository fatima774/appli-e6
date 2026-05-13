const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
const avisModel = require("../models/avisModel");
const logementModel = require("../models/logementModel");

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  try {
    const admin = await adminModel.findByUsername(username);
    if (!admin) return res.status(401).json({ error: "Identifiants incorrects" });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Identifiants incorrects" });

    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ message: "Connexion réussie", token });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function getUsers(req, res) {
  try {
    res.json(await adminModel.findAllUsers());
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    await avisModel.deleteByUser(id);
    await adminModel.deleteLikesByUser(id);
    await adminModel.deleteLogementsByUser(id);
    await adminModel.deleteUser(id);
    res.json({ message: "Utilisateur supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function deleteLogement(req, res) {
  const { id } = req.params;

  try {
    await avisModel.deleteByLogement(id);
    await logementModel.deleteLikesByLogement(id);
    await adminModel.deleteLogement(id);
    res.json({ message: "Logement supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

module.exports = { login, getUsers, deleteUser, deleteLogement };
