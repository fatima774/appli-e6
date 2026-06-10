/**
 * FICHIER: middlewares/authAdmin.js
 * Rôle: Vérifier que l'utilisateur est un administrateur avant d'accéder aux routes d'administration.
 */

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

/**
 * Middleware d'authentification pour les administrateurs
 * Vérifie que le JWT est valide ET que le rôle est "admin"
 */
function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  
  // Vérifier la présence du token
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  
  try {
    // Décoder le JWT
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    
    // Vérifier que le rôle est "admin"
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

module.exports = authAdmin;
