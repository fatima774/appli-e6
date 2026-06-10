/**
 * FICHIER: server.js
 * Rôle: Point d'entrée principal de l'application. Démarrage du serveur et connexion à la base de données.
 */

// Charger les variables d'environnement du fichier .env en mode développement
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");
const db = require("./config/db");
const { ensureLogementPhotoColumns } = require("./models/logementModel");

// Port du serveur (par défaut 3001)
const PORT = process.env.PORT || 3001;

// Établir la connexion à la base de données MySQL
db.connect(err => {
  if (err) {
    console.error("❌ DB error:", err);
    process.exit(1);
  }
  console.log("✅ MySQL connecté");

  // Vérifier et créer les colonnes nécessaires pour les photos de logements
  ensureLogementPhotoColumns().catch(err => {
    console.error("Erreur lecture schema logement:", err);
  });
});

// Démarrer le serveur Express
app.listen(PORT, () => console.log(`🚀 API lancée sur le port ${PORT}`));
