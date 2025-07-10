// auth middleware
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";

const auth = async (req, res, next) => {
    try {
        // Check for token in Authorization header first, then cookies
        let token = req.headers.authorization?.replace('Bearer ', '') || 
                   req.headers.token || 
                   req.cookies?.token;

        if (!token) {
            throw new Error("No token provided");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            throw new Error("User not found");
        }
        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(401).send({ error: "Please authenticate." });
    }
};

export default auth;