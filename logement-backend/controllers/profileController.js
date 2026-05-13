const utilisateurModel = require("../models/utilisateurModel");

async function getProfile(req, res) {
  try {
    const user = await utilisateurModel.findById(req.user.id_user);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Erreur SQL" });
  }
}

async function updateProfile(req, res) {
  const id_user = req.user.id_user;
  const hasTextFields = Object.values(req.body).some(v => v !== undefined && v !== "");

  if (!hasTextFields && !req.file) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour" });
  }

  const allowedFields = ["prenom", "nom", "username", "email", "telephone", "date_naissance", "genre"];
  const fields = [];
  const values = [];

  Object.keys(req.body).forEach(field => {
    if (allowedFields.includes(field) && req.body[field] !== undefined && req.body[field] !== "") {
      fields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (req.file) {
    fields.push("photo = ?");
    values.push(req.file.filename);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "Aucun champ valide à mettre à jour" });
  }

  values.push(id_user);

  try {
    const result = await utilisateurModel.update(fields.join(", "), values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json({
      message: "Profil mis à jour avec succès",
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
  } catch (err) {
    console.error("Erreur SQL profil:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email ou username déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
}

module.exports = { getProfile, updateProfile };
