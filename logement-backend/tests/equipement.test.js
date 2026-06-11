const request = require("supertest");
const jwt = require("jsonwebtoken");

// Empêche toute connexion MySQL réelle
jest.mock("../config/db", () => ({ query: jest.fn(), connect: jest.fn() }));

// Mock du model logement
jest.mock("../models/logementModel");
const logementModel = require("../models/logementModel");

const app = require("../app");

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

// Token utilisateur valide pour les tests protégés
const tokenUtilisateur = jwt.sign({ id_user: 1 }, JWT_SECRET, { expiresIn: "1h" });

// Données de test réutilisables
const fakeEquipements = [
  { id_equipement: 1, libelle: "WiFi" },
  { id_equipement: 2, libelle: "Parking" },
  { id_equipement: 3, libelle: "Meublé" },
  { id_equipement: 4, libelle: "Ascenseur" }
];

// =========================================================
// GET /equipements
// =========================================================
describe("GET /equipements", () => {
  beforeEach(() => jest.clearAllMocks());

  // Test 1 : Récupérer tous les équipements disponibles
  // Cette route est publique, pas besoin de token
  // Elle doit retourner 200 et un tableau avec au moins 1 équipement
  test("doit retourner 200 + un tableau avec les équipements", async () => {
    // On simule le comportement du model qui retourne la liste des équipements
    logementModel.getEquipements.mockResolvedValue(fakeEquipements);

    // On appelle la route GET /equipements
    const res = await request(app).get("/equipements");

    // On vérifie que la requête est réussie (200)
    expect(res.status).toBe(200);
    // On vérifie que la réponse est un tableau
    expect(Array.isArray(res.body)).toBe(true);
    // On vérifie qu'il y a au moins 1 équipement
    expect(res.body.length).toBeGreaterThan(0);
    // On vérifie que le premier équipement a les bonnes propriétés
    expect(res.body[0]).toHaveProperty("id_equipement");
    expect(res.body[0]).toHaveProperty("libelle");
    // On vérifie que les données correspondent
    expect(res.body[0].libelle).toBe("WiFi");
  });
});

// =========================================================
// POST /logements/:id/equipements
// =========================================================
describe("POST /logements/:id/equipements", () => {
  beforeEach(() => jest.clearAllMocks());

  // Test 2 : Essayer de sauvegarder des équipements sans token
  // Cette route est protégée, elle doit retourner 401 Unauthorized si pas de token
  test("sans token → doit retourner 401", async () => {
    // On appelle la route POST /logements/1/equipements SANS token
    const res = await request(app)
      .post("/logements/1/equipements")
      .send({ ids: [1, 2] });

    // On vérifie que la requête est rejetée (401 = non autorisé)
    expect(res.status).toBe(401);
  });

  // Test 3 : Sauvegarder les équipements cochés avec un token valide
  // Cette route doit retourner 200 et un message de succès
  test("avec token valide et ids → doit retourner 200 + message succès", async () => {
    // On simule le comportement du model qui sauvegarde les équipements
    logementModel.saveEquipements.mockResolvedValue();

    // On appelle la route POST /logements/1/equipements AVEC token et ids
    const res = await request(app)
      .post("/logements/1/equipements")
      .set("Authorization", `Bearer ${tokenUtilisateur}`)
      .send({ ids: [1, 2] }); // L'utilisateur a coché WiFi (1) et Parking (2)

    // On vérifie que la requête est réussie (200)
    expect(res.status).toBe(200);
    // On vérifie que la réponse contient un message de succès
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("succès");
  });
});
