const express = require("express");
const router = express.Router();

const {generateDietPlan} = require("../controllers/dietController");
const authMiddleware = require("../middlewares/authMiddleware");

//Protected route
router.post("/generate", authMiddleware, generateDietPlan);

module.exports = router;