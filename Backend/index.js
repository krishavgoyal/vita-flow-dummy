const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const consultantsRoutes = require("./routes/consultantsRoutes");
const dietRoutes = require("./routes/dietRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API running");
})

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/consultants", consultantsRoutes);
app.use("/api/diet", dietRoutes);




app.listen(5000, () => {
    console.log("Server running on port 5000");
})