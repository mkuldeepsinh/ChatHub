// auth middleware
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";

const auth = async (req, res, next) => {
    try {
        const token = req.headers.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(401).send({ error: "Please authenticate." });
    }
};

export default auth;