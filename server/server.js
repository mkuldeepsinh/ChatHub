import express from "express"
import dotenv from "dotenv";
import dbConnect from "./config/dbConnect.js";
import userRouter from "./routes/user.route.js";
import chatRouter from "./routes/chat.route.js";
import msgRouter from "./routes/msg.route.js";


dotenv.config();
dbConnect();

// Initialize Express app
const app = express();
app.use(express.json());

// // Middleware for CORS
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Allow-Methods", "GET, POST, PUT, DELETE");
//     res.setHeader("Allow-Headers", "Content-Type, Authorization");
//     next();
// })
app.use("/api/v1/user" , userRouter);
app.use("/api/v1/chats" , chatRouter);
app.use("/api/v1/message" , msgRouter);


console.log(process.env.PORT);
app.listen((process.env.PORT) , ()=>{
    console.log("server start on " +process.env.PORT);
})