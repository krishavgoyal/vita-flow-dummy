// This file create the routes or the API end points.

const express = require("express");
const router = express.Router();

const {signup, login} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);

router.get("/dashboard", authMiddleware, (req, res)=>{
    res.json({message: "Welcome " + req.user.email});
});

module.exports = router;