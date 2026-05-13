const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { createAvis, getAvis } = require("../controllers/avisController");

router.post("/avis", auth, createAvis);
router.get("/avis/:id_logement", getAvis);

module.exports = router;
