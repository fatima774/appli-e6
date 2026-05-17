// package.json = liste des dépendances installées avec npm install
// package-lock.json = généré automatiquement par npm, verrouille les versions exactes, ne pas modifier
// node_modules = dossier des dépendances, ignoré par git
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");
const db = require("./config/db");
const { ensureLogementPhotoColumns } = require("./models/logementModel");

const PORT = process.env.PORT || 3001;

db.connect(err => {
  if (err) {
    console.error("❌ DB error:", err);
    process.exit(1);
  }
  console.log("✅ MySQL connecté");

  ensureLogementPhotoColumns().catch(err => {
    console.error("Erreur lecture schema logement:", err);
  });
});

app.listen(PORT, () => console.log(`🚀 API lancée sur le port ${PORT}`));
