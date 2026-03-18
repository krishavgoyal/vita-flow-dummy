const express = require("express");
const router = express.Router();
const supabase = require("../db/supabaseClient");

router.get("/users", async(req, res) => {
    const {data, error} = await supabase
    .from("users")
    .select("*")

    if(error) return res.status(500).json(error)

    res.json(data)
});

module.exports = router;