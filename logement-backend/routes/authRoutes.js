const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { register, login } = require("../controllers/authController");

router.post("/register", upload.single("photo"), register);
router.post("/login", login);

module.exports = router;
