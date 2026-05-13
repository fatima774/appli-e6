const express = require("express");
const router = express.Router();
const authAdmin = require("../middlewares/authAdmin");
const { login, getUsers, deleteUser, deleteLogement } = require("../controllers/adminController");

router.post("/admin/login", login);
router.get("/admin/users", authAdmin, getUsers);
router.delete("/admin/users/:id", authAdmin, deleteUser);
router.delete("/admin/logements/:id", authAdmin, deleteLogement);

module.exports = router;
