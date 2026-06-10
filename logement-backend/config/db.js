/**
 * FICHIER: config/db.js
 * Rôle: Configurer et créer la connexion à la base de données MySQL.
 */

const mysql = require("mysql2");

// Créer une connexion MySQL avec les paramètres de l'environnement
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "logements_etudiants",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

module.exports = db;
