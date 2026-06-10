/**
 * FICHIER: controllers/avisController.js
 * Rôle: Gérer la création et la consultation des avis sur les logements.
 */

const avisModel = require("../models/avisModel");

/**
 * Créer un nouvel avis
 * POST /avis
 */
async function createAvis(req, res) {
  const { id_logement, contenu, note } = req.body;

  // Vérifier les champs obligatoires
  if (!id_logement || !contenu) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  try {
    // Insérer l'avis dans la base de données
    const result = await avisModel.create(req.user.id_user, id_logement, contenu, note || 5);
    // Récupérer l'avis créé avec les infos utilisateur
    const avis = await avisModel.findById(result.insertId);
    res.status(201).json(avis);
  } catch (err) {
    console.error("Erreur insertion avis:", err);
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Récupérer tous les avis d'un logement
 * GET /avis/:id_logement
 */
async function getAvis(req, res) {
  try {
    // Lister tous les avis du logement avec les noms des utilisateurs
    res.json(await avisModel.findByLogement(req.params.id_logement));
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

module.exports = { createAvis, getAvis };
