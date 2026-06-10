/**
 * FICHIER: app.js
 * Rôle: Configuration de l'application Express. Middleware CORS, routes et serveur statique.
 */

// Charger les variables d'environnement en développement
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Configurer CORS pour autoriser les requêtes du frontend
app.use(cors({
  origin: function(origin, callback) {
    // Liste des domaines autorisés
    const allowed = [
      FRONTEND_URL,
      "http://localhost:3000",
      "https://appli-e6-vhar5e03p-fatima774s-projects.vercel.app"
    ];
    // Vérifier si l'origine est dans la liste blanche
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware pour traiter JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers téléchargés (images, photos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Charger toutes les routes
app.use(require("./routes/authRoutes"));
app.use(require("./routes/profileRoutes"));
app.use(require("./routes/logementRoutes"));
app.use(require("./routes/avisRoutes"));
app.use(require("./routes/adminRoutes"));

// Route de santé pour vérifier que l'API fonctionne
app.get("/", (_, res) => res.send("API OK"));

module.exports = app;
