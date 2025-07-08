import express from "express"
import dotenv from "dotenv";
import dbConnect from "./config/dbConnect.js";
import userRouter from "./routes/user.route.js";


dotenv.config();
dbConnect();



const app = express();
app.use(express.json());

app.use("/api/v1/user" , userRouter);


console.log(process.env.PORT);
app.listen((process.env.PORT) , ()=>{
    console.log("server start on " +process.env.PORT);
})