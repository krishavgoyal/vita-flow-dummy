// It contains the functions related to any user(s).

const {updateUserProfile} = require("../models/userModel");
const {getAllUsers} = require("../models/userModel");

const updateProfile = async (req, res) => {
    try{
        const email = req.user.email; // from JWT

        const {
            name,
            age,
            gender,
            height_cm,
            weight_kg,
            activity_level,
            allergies,
            meal_preferences,
            aim_kg,
            deadline
        } = req.body;

        const {data, error} = await updateUserProfile(email, {
            name,
            age,
            gender,
            height_cm,
            weight_kg,
            activity_level,
            allergies,
            meal_preferences,
            aim_kg,
            deadline
        });

        if(error) return res.status(400).json({error});

        res.json({message: "Profile Updated", data});
    } catch(err){
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