// It contains the functions related to any user(s).

const {updateUserProfile} = require("../models/userModel");
const {getAllUsers} = require("../models/userModel");

const updateProfile = async (req, res) => {
    try{
        const email = req.user.email; // from JWT
        console.log("=== UPDATE PROFILE CALLED ===");
        console.log("Email from token:", email);
        console.log("Body received:", req.body);

        const {
            name,
            phone,
            age,
            gender,
            height_cm,
            weight_kg,
            activity_level,
            allergies,
            meal_preferences,
            deadline,
            aim_kg
        } = req.body;

        const {data, error} = await updateUserProfile(email, {
            name,
            phone,
            age,
            gender,
            height_cm,
            weight_kg,
            activity_level,
            allergies,
            meal_preferences,
            deadline,
            aim_kg
        });

        console.log("Update data:", data);
        console.log("Update error:", error);

        if(error) return res.status(400).json({error});

        res.json({message: "Profile Updated", data});
    } catch(err){
        console.log("Update exception:", err.message);
        res.status(500).json({error: err.message});
    }
};

const fetchAllUsers = async(req, res) => {
    try{
        const {data, error} = await getAllUsers();
        if(error) return res.status(500).json(error);
        res.json(data);
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};

module.exports = { updateProfile, fetchAllUsers };