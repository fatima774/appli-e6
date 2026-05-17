const request = require("supertest");
const bcrypt = require("bcryptjs");

// Empêche toute connexion MySQL réelle
jest.mock("../config/db", () => ({ query: jest.fn(), connect: jest.fn() }));

// Mock du model utilisateur
jest.mock("../models/utilisateurModel");
const utilisateurModel = require("../models/utilisateurModel");

const app = require("../app");

// =========================================================
// POST /login
// =========================================================
describe("POST /login", () => {
  beforeEach(() => jest.clearAllMocks());

  test("connexion avec bon email et bon mot de passe → 200 + token", async () => {
    const hashedPassword = await bcrypt.hash("Password1!", 10);

    utilisateurModel.findByEmail.mockResolvedValue({
      id_user: 1,
      nom: "Dupont",
      prenom: "Marie",
      username: "marie@test.com",
      email: "marie@test.com",
      password: hashedPassword,
      telephone: null,
      adresse: null,
      ecole: null,
      ecole_ville: null,
      date_naissance: null,
      genre: null,
      photo: null
    });

    const res = await request(app)
      .post("/login")
      .send({ email: "marie@test.com", password: "Password1!" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("marie@test.com");
  });

  test("connexion avec mauvais mot de passe → 401", async () => {
    const hashedPassword = await bcrypt.hash("Password1!", 10);

    utilisateurModel.findByEmail.mockResolvedValue({
      id_user: 1,
      email: "marie@test.com",
      password: hashedPassword
    });

    const res = await request(app)
      .post("/login")
      .send({ email: "marie@test.com", password: "MauvaisMotDePasse!" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  test("connexion avec email inexistant → 401", async () => {
    utilisateurModel.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post("/login")
      .send({ email: "inexistant@test.com", password: "Password1!" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  test("connexion sans champs → 400", async () => {
    const res = await request(app).post("/login").send({});
    expect(res.status).toBe(400);
  });
});

// =========================================================
// POST /register
// =========================================================
describe("POST /register", () => {
  beforeEach(() => jest.clearAllMocks());

  test("inscription avec email déjà utilisé → 400", async () => {
    utilisateurModel.create.mockRejectedValue({ code: "ER_DUP_ENTRY" });

    const res = await request(app)
      .post("/register")
      .field("nom", "Dupont")
      .field("prenom", "Jean")
      .field("email", "existant@test.com")
      .field("password", "Password1!");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email déjà utilisé");
  });

  test("inscription avec champs manquants → 400", async () => {
    const res = await request(app)
      .post("/register")
      .field("email", "nouveau@test.com");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("inscription réussie → 201 + token", async () => {
    utilisateurModel.create.mockResolvedValue({ insertId: 42 });

    const res = await request(app)
      .post("/register")
      .field("nom", "Martin")
      .field("prenom", "Sophie")
      .field("email", "sophie@test.com")
      .field("password", "Password1!");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.id_user).toBe(42);
  });
});
