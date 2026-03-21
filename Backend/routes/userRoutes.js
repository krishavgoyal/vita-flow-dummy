const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");
const {updateProfile, fetchAllUsers} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.put("/profile", authMiddleware, updateProfile); // Middleware creates protection

router.get("/users", fetchAllUsers);

module.exports = router;