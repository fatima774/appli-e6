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
const fakeLogement = {
  id_logement: 1,
  titre: "Studio moderne",
  ville: "Paris",
  universite: "Sorbonne",
  prix: 800,
  type: "Studio",
  adresse: "10 rue de la Paix",
  description: "Beau studio",
  image: "photo.jpg",
  photos: [],
  id_user: 1,
  likes_count: 0
};

// =========================================================
// GET /logements
// =========================================================
describe("GET /logements", () => {
  beforeEach(() => jest.clearAllMocks());

  test("doit retourner 200 + un tableau", async () => {
    logementModel.findAll.mockResolvedValue([fakeLogement]);

    const res = await request(app).get("/logements");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].titre).toBe("Studio moderne");
  });

  test("doit retourner un tableau vide si aucun logement", async () => {
    logementModel.findAll.mockResolvedValue([]);

    const res = await request(app).get("/logements");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// =========================================================
// GET /logements/:id
// =========================================================
describe("GET /logements/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("id valide → 200 + objet logement", async () => {
    logementModel.findById.mockResolvedValue(fakeLogement);

    const res = await request(app).get("/logements/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id_logement");
    expect(res.body.titre).toBe("Studio moderne");
    expect(res.body.ville).toBe("Paris");
  });

  test("id inexistant → 404", async () => {
    logementModel.findById.mockResolvedValue(null);

    const res = await request(app).get("/logements/9999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// =========================================================
// POST /logements (protégé)
// =========================================================
describe("POST /logements", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sans token → 401", async () => {
    const res = await request(app)
      .post("/logements")
      .send({ titre: "Test", ville: "Lyon", prix: 500 });

    expect(res.status).toBe(401);
  });

  test("avec token mais champs manquants → 400", async () => {
    const res = await request(app)
      .post("/logements")
      .set("Authorization", `Bearer ${tokenUtilisateur}`)
      .field("titre", "Test sans ville");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("avec token et champs valides → 201", async () => {
    logementModel.loadLogementColumns.mockResolvedValue(
      new Set(["titre", "ville", "universite", "prix", "type", "adresse", "description", "image", "id_user"])
    );
    logementModel.buildLogementPayload.mockReturnValue({
      titre: "Studio Lyon",
      ville: "Lyon",
      prix: "500",
      id_user: 1
    });
    logementModel.insert.mockResolvedValue({ insertId: 10 });
    logementModel.normalizeLogementRow.mockReturnValue({
      id_logement: 10,
      titre: "Studio Lyon",
      ville: "Lyon",
      prix: 500,
      photos: []
    });

    const res = await request(app)
      .post("/logements")
      .set("Authorization", `Bearer ${tokenUtilisateur}`)
      .field("titre", "Studio Lyon")
      .field("ville", "Lyon")
      .field("prix", "500");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("logement");
  });
});

// =========================================================
// GET /mes-logements (protégé)
// =========================================================
describe("GET /mes-logements", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sans token → 401", async () => {
    const res = await request(app).get("/mes-logements");
    expect(res.status).toBe(401);
  });

  test("avec token → 200 + tableau", async () => {
    logementModel.findByUserId.mockResolvedValue([fakeLogement]);

    const res = await request(app)
      .get("/mes-logements")
      .set("Authorization", `Bearer ${tokenUtilisateur}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
