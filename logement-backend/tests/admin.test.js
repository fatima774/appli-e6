const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Empêche toute connexion MySQL réelle
jest.mock("../config/db", () => ({ query: jest.fn(), connect: jest.fn() }));

// Mock des models
jest.mock("../models/adminModel");
jest.mock("../models/avisModel");
jest.mock("../models/logementModel");
const adminModel = require("../models/adminModel");
const avisModel = require("../models/avisModel");
const logementModel = require("../models/logementModel");

const app = require("../app");

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

// =========================================================
// POST /admin/login
// =========================================================
describe("POST /admin/login", () => {
  beforeEach(() => jest.clearAllMocks());

  test("bon username et bon mot de passe → 200 + token", async () => {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    adminModel.findByUsername.mockResolvedValue({ password_hash: hashedPassword });

    const res = await request(app)
      .post("/admin/login")
      .send({ username: "admin", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.message).toBe("Connexion réussie");

    // Vérifier que le token contient bien le rôle admin
    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.role).toBe("admin");
  });

  test("mauvais mot de passe → 401", async () => {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    adminModel.findByUsername.mockResolvedValue({ password_hash: hashedPassword });

    const res = await request(app)
      .post("/admin/login")
      .send({ username: "admin", password: "mauvaismdp" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Identifiants incorrects");
  });

  test("username inexistant → 401", async () => {
    adminModel.findByUsername.mockResolvedValue(null);

    const res = await request(app)
      .post("/admin/login")
      .send({ username: "inconnu", password: "admin123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Identifiants incorrects");
  });

  test("champs manquants → 400", async () => {
    const res = await request(app).post("/admin/login").send({});
    expect(res.status).toBe(400);
  });
});

// =========================================================
// GET /admin/users
// =========================================================
describe("GET /admin/users", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sans token → 401", async () => {
    const res = await request(app).get("/admin/users");
    expect(res.status).toBe(401);
  });

  test("avec token utilisateur (non admin) → 403", async () => {
    const tokenUser = jwt.sign({ id_user: 1 }, JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${tokenUser}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Accès réservé aux administrateurs");
  });

  test("avec token admin valide → 200 + tableau", async () => {
    const tokenAdmin = jwt.sign({ role: "admin", username: "admin" }, JWT_SECRET, { expiresIn: "1h" });

    adminModel.findAllUsers.mockResolvedValue([
      { id_user: 1, nom: "Dupont", prenom: "Marie", email: "marie@test.com" },
      { id_user: 2, nom: "Martin", prenom: "Pierre", email: "pierre@test.com" }
    ]);

    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty("email");
  });
});

// =========================================================
// DELETE /admin/users/:id
// =========================================================
describe("DELETE /admin/users/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sans token → 401", async () => {
    const res = await request(app).delete("/admin/users/1");
    expect(res.status).toBe(401);
  });

  test("avec token admin → 200", async () => {
    const tokenAdmin = jwt.sign({ role: "admin", username: "admin" }, JWT_SECRET, { expiresIn: "1h" });

    avisModel.deleteByUser.mockResolvedValue();
    adminModel.deleteLikesByUser.mockResolvedValue();
    adminModel.deleteLogementsByUser.mockResolvedValue();
    adminModel.deleteUser.mockResolvedValue();

    const res = await request(app)
      .delete("/admin/users/1")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Utilisateur supprimé");
  });
});
