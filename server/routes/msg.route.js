import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead
} from "../controllers/msg.controller.js";
import auth from "../middleware/auth.js";

const msgRouter = express.Router();
// Message routes
msgRouter.use(auth);
msgRouter.post("/send", sendMessage);
msgRouter.get("/:chatId", getMessages);
msgRouter.put("/read", markAsRead);

export default msgRouter;
