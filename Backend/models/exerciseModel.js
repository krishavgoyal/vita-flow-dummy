const supabase = require("../config/supabaseClient");

// Call PostgreSQL function
const generateWorkoutPlanDB = async(uid) => {
    return await supabase.rpc("generate_full_workout_plan", {uid});
};

// Fetch generated workout plan
const getWorkoutPlan = async (uid) => {
    return await supabase
    .from("USER_PROFILE")
    .select("workout_plan")
    .eq("user_id", uid)
    .single();
};

// Get user_id from email (reuse same logic)
const getUserIDByEmail = async(email) => {
    return await supabase
    .from("USER_PROFILE")
    .select("user_id")
    .eq("email", email)
    .single();
};

module.exports = {
    generateWorkoutPlanDB,
    getWorkoutPlan,
    getUserIDByEmail
};