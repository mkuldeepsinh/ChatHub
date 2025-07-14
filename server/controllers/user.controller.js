import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import { User } from "../models/user.model.js";



export const signup = async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        // check if user already exists by username, email, or phone
        const checkUser = await User.findOne({
            $or: [{ email }, { username }, { phone }]
        });
        if (checkUser) {
            if (checkUser.username === username) {
                return res.status(400).json({ message: "Username already exists" });
            }
            if (checkUser.email === email) {
                return res.status(400).json({ message: "Email already exists" });
            }
            if (checkUser.phone === phone) {
                return res.status(400).json({ message: "Phone number already exists" });
            }
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            phone,
            password: hashPassword,
        });

        //save user
        await newUser.save();
        res.status(201).json({ 
            message: "User registered successfully" 
        });
        
    } catch (e) {
        console.error("Register error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        //chekc if user exists
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        //check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        //create token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Set token in cookie (not httpOnly for dev, not secure for localhost)
        res.cookie('token', token, {
            httpOnly: false, // <--- must be false for frontend JS to read it!
            secure: false,   // <--- must be false for localhost (no https)
            sameSite: 'lax', // or 'strict'
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        res.status(200).json({ 
            message: "Login successful",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                profilePicture: user.profilePicture,
                about: user.about,
                isOnline: user.isOnline
            }
        });
    } catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logout = async (req, res) => {
    try {
        // Clear the JWT cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        
        res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        console.error("Logout error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const me = async(req , res) =>{
    try{
        // auth middleware
        const user = req.user;
        res.status(200).json(user);
    }catch(e){
        console.error("me error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const search = async(req , res)=>{
   try{ 
        const { username } = req.query;
        const users = await User.find({ username: { $regex: username, $options: "i" } });
        res.status(200).json(users);
   }catch(e){
        console.error("Search error:", e);
        res.status(500).json({ message: "Internal server error" });
   }
}

export const updateUser = async(req , res)=>{
    try{
        const userId = req.user._id;
        const { username, email, phone, profilePicture, about } = req.body;

        // check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // update user
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.profilePicture = profilePicture || user.profilePicture;
        user.about = about || user.about;

        await user.save();
        
        res.status(200).json({ message: "User updated successfully", user });
    }catch(e){
        console.error("Update user error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}