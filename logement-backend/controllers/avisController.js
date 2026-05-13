const avisModel = require("../models/avisModel");

async function createAvis(req, res) {
  const { id_logement, contenu, note } = req.body;

  if (!id_logement || !contenu) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  try {
    const result = await avisModel.create(req.user.id_user, id_logement, contenu, note || 5);
    const avis = await avisModel.findById(result.insertId);
    res.status(201).json(avis);
  } catch (err) {
    console.error("Erreur insertion avis:", err);
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function getAvis(req, res) {
  try {
    res.json(await avisModel.findByLogement(req.params.id_logement));
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

module.exports = { createAvis, getAvis };
