const logementModel = require("../models/logementModel");

async function getAll(req, res) {
  try {
    res.json(await logementModel.findAll());
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function getOne(req, res) {
  try {
    const logement = await logementModel.findById(req.params.id);
    if (!logement) return res.status(404).json({ error: "Logement non trouvé" });
    res.json(logement);
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function getMine(req, res) {
  try {
    res.json(await logementModel.findByUserId(req.user.id_user));
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function create(req, res) {
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  try {
    const columns = await logementModel.loadLogementColumns();
    const payload = logementModel.buildLogementPayload(
      { titre, ville, universite, prix, type, adresse, description },
      columns,
      { imageFilenames: image ? [image] : [], ownerId: req.user.id_user }
    );
    const fields = Object.keys(payload);

    if (!fields.includes("titre") || !fields.includes("ville") || !fields.includes("prix")) {
      return res.status(500).json({ error: "Colonnes obligatoires manquantes dans la table logement" });
    }

    const result = await logementModel.insert(fields, fields.map(f => payload[f]));
    res.status(201).json({
      message: "Logement ajouté avec succès",
      logement: logementModel.normalizeLogementRow({ id_logement: result.insertId, ...payload })
    });
  } catch (err) {
    console.error("Erreur SQL ajout logement:", err);
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const id_user = req.user.id_user;
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  try {
    const columns = await logementModel.loadLogementColumns();
    const ownerColumn = logementModel.getOwnerColumn(columns);
    if (!ownerColumn) {
      return res.status(500).json({ error: "Colonne proprietaire introuvable dans logement" });
    }

    const ownerRow = await logementModel.findOwner(id, ownerColumn);
    if (!ownerRow) return res.status(404).json({ error: "Logement non trouvé" });
    if (String(ownerRow[ownerColumn]) !== String(id_user)) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const payload = logementModel.buildLogementPayload(
      { titre, ville, universite, prix, type, adresse, description },
      columns,
      { imageFilenames: image ? [image] : [] }
    );
    const fields = Object.keys(payload);

    if (fields.length === 0) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }

    await logementModel.update(
      fields.map(f => `${f} = ?`).join(", "),
      [...fields.map(f => payload[f]), id]
    );
    res.json({ message: "Logement mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur SQL modification logement:", err);
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  const id_user = req.user.id_user;

  try {
    const logement = await logementModel.findById(id);
    if (!logement) return res.status(404).json({ error: "Logement non trouvé" });
    if (logement.id_user !== id_user) return res.status(403).json({ error: "Non autorisé" });

    await logementModel.deleteLikesByLogement(id);
    await logementModel.deleteById(id);
    res.json({ message: "Logement et favoris associés supprimés avec succès" });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function toggleLike(req, res) {
  const { id } = req.params;
  const id_user = req.user.id_user;

  try {
    const existing = await logementModel.findLike(id_user, id);

    if (existing.length > 0) {
      await logementModel.removeLike(id_user, id);
      await logementModel.updateLikesCount(id, -1);
    } else {
      await logementModel.addLike(id_user, id);
      await logementModel.updateLikesCount(id, 1);
    }

    const row = await logementModel.getLikesCount(id);
    if (!row) return res.status(404).json({ error: "Logement non trouvé" });
    res.json({ likes_count: row.likes_count });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

module.exports = { getAll, getOne, getMine, create, update, remove, toggleLike };
