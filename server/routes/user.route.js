import express from "express"
import auth from "../middleware/auth.js";
import { login, me, signup, updateUser } from "../controllers/user.controller.js";
const userRouter = express.Router();

userRouter.post("/signup" , signup);
userRouter.post("/login" , login);
userRouter.get("/me" , auth ,me)
userRouter.put("/update" , auth , updateUser);

export default userRouter;
