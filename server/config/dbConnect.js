import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error(error);
    }
};

export default dbConnect;