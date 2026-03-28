const express = require("express");
const router = express.Router();

const {generateWorkoutPlan} = require("../controllers/exerciseController");
const authMiddleware = require("../middlewares/authMiddleware");

//Protected route
router.post("/generate", authMiddleware, generateWorkoutPlan);

module.exports = router;