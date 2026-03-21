// This file contains the middleware of token creation.

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if(!authHeader)
        return res.status(401).json({message: "No token"});

    try{
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({message: "Invalid token"});
    }
};

module.exports = authMiddleware;