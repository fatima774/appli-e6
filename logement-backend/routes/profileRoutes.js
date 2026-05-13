const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const auth = require("../middlewares/auth");
const { getProfile, updateProfile } = require("../controllers/profileController");

router.get("/profile", auth, getProfile);
router.put("/profile", auth, upload.single("photo"), updateProfile);

module.exports = router;
