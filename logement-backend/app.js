if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      FRONTEND_URL,
      "http://localhost:3000",
      "https://appli-e6-vhar5e03p-fatima774s-projects.vercel.app"
    ];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(require("./routes/authRoutes"));
app.use(require("./routes/profileRoutes"));
app.use(require("./routes/logementRoutes"));
app.use(require("./routes/avisRoutes"));
app.use(require("./routes/adminRoutes"));

app.get("/", (_, res) => res.send("API OK"));

module.exports = app;
