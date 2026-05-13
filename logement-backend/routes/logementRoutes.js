const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const auth = require("../middlewares/auth");
const { getAll, getOne, getMine, create, update, remove, toggleLike } = require("../controllers/logementController");

router.get("/logements", getAll);
router.get("/logements/:id", getOne);
router.get("/mes-logements", auth, getMine);
router.post("/logements", auth, upload.single("image"), create);
router.put("/logements/:id", auth, upload.single("image"), update);
router.delete("/logements/:id", auth, remove);
router.post("/logements/:id/like", auth, toggleLike);

module.exports = router;
