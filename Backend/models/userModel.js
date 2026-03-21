//This file contains only the DB queries.
const supabase = require("../config/supabaseClient");

const createUser = async (email, password_hash) => {
    return await supabase
    .from("USER_PROFILE")
    .insert([{email, password_hash}]);
};

const findUserByEmail = async(email) => {
    return await supabase
    .from("USER_PROFILE")
    .select("*")
    .eq("email", email)
    .single();
};

const updateUserProfile = async(email, updates) => {
    return await supabase
    .from("USER_PROFILE")
    .update(updates)
    .eq("email", email)
    .select()
    .single();
};

const getAllUsers = async() => {
    return await supabase
    .from("USER_PROFILE")
    .select("*");
};

module.exports = {createUser, findUserByEmail, updateUserProfile, getAllUsers};