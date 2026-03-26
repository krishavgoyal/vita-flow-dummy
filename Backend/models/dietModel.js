const supabase = require("../config/supabaseClient");

//Call PostgreSQL function
const generatePlanDB = async (uid) => {
    return await supabase.rpc("generate_full_plan", {uid});
};

//Fetch generated diet plan
const getDietPlan = async (uid) => {
    return await supabase
    .from("USER_PROFILE")
    .select("diet_plan_breakfast, diet_plan_lunch, diet_plan_dinner")
    .eq("user_id", uid)
    .single();
};

//Get user_id from email
const getUserIdByEmail = async (email) => {
    return await supabase
    .from("USER_PROFILE")
    .select("user_id")
    .eq("email", email)
    .single();
};

module.exports = {
    generatePlanDB,
    getDietPlan,
    getUserIdByEmail
};