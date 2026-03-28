const {generateWorkoutPlanDB, getWorkoutPlan, getUserIDByEmail} = require("../models/exerciseModel");

const generateWorkoutPlan = async(req, res) => {
    try{
        const email = req.user.email;

        //Get user ID
        const {data : user, error:userError} = await getUserIDByEmail(email);
        if(userError) return res.status(400).json({error: userError.message});

        // Generate workout plan (RPC)
        const {error: rpcError} = await generateWorkoutPlanDB(user.user_id);
        if(rpcError) return res.status(400).json({error: rpcError.message});

        //Fetch generated plan
        const {data, error} = await getWorkoutPlan(user.user_id);
        if(error) return res.status(400).json({error: error.message});

        res.json({
            message:"Workout Plan Generated Successfully",
            plan: data
        });
    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
};

module.exports = {generateWorkoutPlan};