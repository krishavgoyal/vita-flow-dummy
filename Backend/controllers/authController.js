//This file contains the User signin and login functions

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {createUser, findUserByEmail} = require("../models/userModel");

//console.log(bcrypt.hashSync("test", 10));

const signUp = async (req, res) => {
    try {
        const {email, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const {data, error} = await createUser(email, hashedPassword);
        if(error) return res.status(400).json({error});
        res.json({message: "User created", data});
    } catch(err){
        res.status(500).json({error: err.message});
    }
};

const login = async(req, res) => {
    try{
        const {email, password} = req.body;
        const {data, error} = await findUserByEmail(email);
        console.log("DATA: ", data);
        if(error || !data) return res.status(400).json({message: "User not found"});
        const isMatch = await bcrypt.compare(password, data.password_hash);
        if(!isMatch) return res.status(400).json({message: "Wrong password"});
        const token = jwt.sign({email: data.email}, 
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

       res.json({ 
  token, 
  user: { email: data.email, id: data.id } // Send user info too!
});
    } catch(err){
        res.status(500).json({error: err.message});
    }
};

module.exports = {signUp, login};