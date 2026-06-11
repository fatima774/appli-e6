/**
 * FICHIER: controllers/logementController.js
 * Rôle: Gérer les logements (CRUD), affichage et gestion des favoris.
 */

const logementModel = require("../models/logementModel");

/**
 * Récupérer tous les logements
 * GET /logements
 */
async function getAll(req, res) {
  try {
    res.json(await logementModel.findAll());
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Récupérer un logement spécifique
 * GET /logements/:id
 */
async function getOne(req, res) {
  try {
    const logement = await logementModel.findById(req.params.id);
    if (!logement) return res.status(404).json({ error: "Logement non trouvé" });
    res.json(logement);
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Récupérer les logements de l'utilisateur connecté
 * GET /mes-logements
 */
async function getMine(req, res) {
  try {
    res.json(await logementModel.findByUserId(req.user.id_user));
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Créer un nouveau logement
 * POST /logements
 */
async function create(req, res) {
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  // Vérifier les champs obligatoires
  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  try {
    // Charger les colonnes disponibles dans la table
    const columns = await logementModel.loadLogementColumns();
    // Construire le payload avec les informations du logement
    const payload = logementModel.buildLogementPayload(
      { titre, ville, universite, prix, type, adresse, description },
      columns,
      { imageFilenames: image ? [image] : [], ownerId: req.user.id_user }
    );
    const fields = Object.keys(payload);

    // Vérifier que les colonnes obligatoires existent
    if (!fields.includes("titre") || !fields.includes("ville") || !fields.includes("prix")) {
      return res.status(500).json({ error: "Colonnes obligatoires manquantes dans la table logement" });
    }

    // Insérer le logement dans la base de données
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

/**
 * Mettre à jour un logement
 * PUT /logements/:id
 */
async function update(req, res) {
  const { id } = req.params;
  const id_user = req.user.id_user;
  const { titre, ville, universite, prix, type, adresse, description } = req.body;
  const image = req.file ? req.file.filename : undefined;

  // Vérifier les champs obligatoires
  if (!titre || !ville || prix === undefined || prix === null || prix === "") {
    return res.status(400).json({ error: "Titre, ville et prix obligatoires" });
  }

  try {
    const columns = await logementModel.loadLogementColumns();
    const ownerColumn = logementModel.getOwnerColumn(columns);
    if (!ownerColumn) {
      return res.status(500).json({ error: "Colonne proprietaire introuvable dans logement" });
    }

    // Vérifier que le logement existe et appartient à l'utilisateur
    const ownerRow = await logementModel.findOwner(id, ownerColumn);
    if (!ownerRow) return res.status(404).json({ error: "Logement non trouvé" });
    if (String(ownerRow[ownerColumn]) !== String(id_user)) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // Construire le payload de mise à jour
    const payload = logementModel.buildLogementPayload(
      { titre, ville, universite, prix, type, adresse, description },
      columns,
      { imageFilenames: image ? [image] : [] }
    );
    const fields = Object.keys(payload);

    if (fields.length === 0) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }

    // Mettre à jour le logement
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

/**
 * Supprimer un logement
 * DELETE /logements/:id
 */
async function remove(req, res) {
  const { id } = req.params;
  const id_user = req.user.id_user;

  try {
    // Vérifier que le logement existe et appartient à l'utilisateur
    const logement = await logementModel.findById(id);
    if (!logement) return res.status(404).json({ error: "Logement non trouvé" });
    if (logement.id_user !== id_user) return res.status(403).json({ error: "Non autorisé" });

    // Supprimer les favoris associés au logement
    await logementModel.deleteLikesByLogement(id);
    // Supprimer le logement
    await logementModel.deleteById(id);
    res.json({ message: "Logement et favoris associés supprimés avec succès" });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

/**
 * Aimer/Désaimer un logement (ajouter/retirer des favoris)
 * POST /logements/:id/like
 */
async function toggleLike(req, res) {
  const { id } = req.params;
  const id_user = req.user.id_user;

  try {
    // Vérifier si l'utilisateur a déjà aimé ce logement
    const existing = await logementModel.findLike(id_user, id);

    if (existing.length > 0) {
      // Si oui, retirer le like (désaimer)
      await logementModel.removeLike(id_user, id);
      await logementModel.updateLikesCount(id, -1);
    } else {
      // Si non, ajouter le like
      await logementModel.addLike(id_user, id);
      await logementModel.updateLikesCount(id, 1);
    }

    // Retourner le nouveau nombre de likes
    const row = await logementModel.getLikesCount(id);
    if (!row) return res.status(404).json({ error: "Logement non trouvé" });
    res.json({ likes_count: row.likes_count });
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}
/**
 * Récupérer tous les équipements disponibles
 * GET /equipements
 * Rôle : Retourne la liste de tous les équipements (WiFi, Parking...)
 * pour les afficher sous forme de cases à cocher dans le formulaire
 */
async function getEquipements(req, res) {
  try {
    // On appelle le model qui fait le SELECT * FROM equipement
    const equipements = await logementModel.getEquipements();
    // On retourne la liste en JSON au frontend
    res.json(equipements);
  } catch {
    res.status(500).json({ error: "Erreur lors de la récupération des équipements" });
  }
}

/**
 * Sauvegarder les équipements cochés pour un logement
 * 
 * Rôle : Reçoit la liste des équipements cochés et les sauvegarde
 * dans la table associative logement_equipement
 */
async function saveEquipements(req, res) {
  try {
    // On récupère l'id du logement depuis l'URL
    const id_logement = req.params.id;
    // On récupère la liste des ids cochés envoyée par le frontend
    const { ids } = req.body;
    // On appelle le model pour sauvegarder dans logement_equipement
    await logementModel.saveEquipements(id_logement, ids);
    res.json({ message: "Équipements sauvegardés avec succès" });
  } catch {
    res.status(500).json({ error: "Erreur lors de la sauvegarde des équipements" });
  }
}
module.exports = { getAll, getOne, getMine, create, update, remove, toggleLike, getEquipements, saveEquipements  };
