import express from "express"
import auth from "../middleware/auth";
import { login, signup, updateUser } from "../controllers/user.controller";
const userRouter = express.Router();

userRouter.post("/signup" , signup);
userRouter.post("/login" , login);
userRouter.get("/me" , auth , (req , res) => {
    res.send(req.user);
})
userRouter.put("/update" , auth , updateUser);

export default userRouter;
