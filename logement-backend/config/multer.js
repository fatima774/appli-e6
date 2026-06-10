/**
 * FICHIER: config/multer.js
 * Rôle: Configurer multer pour gérer le téléchargement de fichiers (photos, images).
 */

const multer = require("multer");

// Configuration du stockage des fichiers téléchargés
const storage = multer.diskStorage({
  // Dossier de destination des fichiers
  destination: "uploads/",
  // Générer un nom unique pour chaque fichier (timestamp + nom original)
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  }
});

// Créer le middleware multer avec la configuration
const upload = multer({ storage });

module.exports = upload;
