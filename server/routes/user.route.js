import express from "express"
import auth from "../middleware/auth.js";
import { login, me, search, signup, updateUser, logout, sendVerificationCode, verifyEmailCode } from "../controllers/user.controller.js";

// User routes for authentication and user management
const userRouter = express.Router();

userRouter.post("/signup" , signup);
userRouter.post("/login" , login);
userRouter.post("/logout" , logout);
userRouter.post("/send-verification-code", sendVerificationCode);
userRouter.post("/verify-code", verifyEmailCode);
userRouter.get("/me" , auth ,me)
userRouter.put("/update" , auth , updateUser);
userRouter.get("/search" , auth , search)

export default userRouter;
