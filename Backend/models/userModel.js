// This file contains the functions of user, like user creation, fetching user, etc, more to be added.
const supabase = require("../config/supabaseClient");

const createUser = async (user, password) => {
    return await supabase
    .from("users")
    .insert([{email, password}]);
};

const findUserByEmail = async(email) => {
    return await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
};

module.exports = {createUser, findUserByEmail};