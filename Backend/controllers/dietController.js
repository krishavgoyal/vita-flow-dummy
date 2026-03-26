const { rpc } = require("../config/supabaseClient");
const {generatePlanDB, getDietPlan, getUserIdByEmail} = require("../models/dietModel");

const generateDietPlan = async(req, res) => {
    try {
        const email = req.user.email;

        // Get user id
        const {data:user, error:userError} = await getUserIdByEmail(email);
        if(userError) return res.status(400).json({error: userError.message});

        // Generate Plan
        const {error: rpcError} = await generatePlanDB(user.user_id);
        if(rpcError) return res.status(400).json({error: rpcError.message});

        // Fetch generated Plan
        const {data, error} = await getDietPlan(user.user_id);
        if(error) return res.status(400).json({error: error.message});

        res.json({
            message: "Diet Plan Generated Successfully",
            plan: data
        });
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};

module.exports = {generateDietPlan};