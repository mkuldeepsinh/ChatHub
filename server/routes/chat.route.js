import express from "express";
import auth from "../middleware/auth.js";
import { createChat, createGroupChat, getUserChats, searchChat } from "../controllers/chat.controller.js";

// Chat routes
const chatRouter = express.Router();

chatRouter.use(auth); // Apply authentication middleware to all routes
chatRouter.post("/create"  , createChat);
chatRouter.get("/get"  , getUserChats);
chatRouter.get("/search"  , searchChat);
chatRouter.post("/createGroup"  , createGroupChat);

export default chatRouter;