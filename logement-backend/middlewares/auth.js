/**
 * FICHIER: middlewares/auth.js
 * Rôle: Vérifier que l'utilisateur est authentifié avec un JWT valide avant d'accéder aux routes protégées.
 */

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du JWT dans le header Authorization
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  
  // Vérifier que le header Authorization existe et commence par "Bearer "
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  
  try {
    // Vérifier et décoder le JWT
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    // Retourner une erreur si le token est invalide ou expiré
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

module.exports = auth;
