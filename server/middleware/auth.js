// auth middleware
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const auth = async (req, res, next) => {
    try {
        const token = req.header.token;
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

module.exports = auth;