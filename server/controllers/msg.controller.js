import Msg from "../models/msg.model.js";
import { Chat } from "../models/chat.model.js";

// create msg 
export const sendMessage = async(req , res)=>{
    try{
        const { chatId, content, messageType, mediaUrl } = req.body;
        const senderId = req.user._id;

        if (!chatId) {
            return res.status(400).json({ message: "Chat ID is required" });
        }

        // Validate based on type
        const allowedMediaTypes = ["image", "video", "audio", "file"];

        if (messageType === "text" && !content) {
        return res.status(400).json({ message: "Text message content is required" });
        }

        if (allowedMediaTypes.includes(messageType) && !mediaUrl) {
        return res.status(400).json({ message: `${messageType} message requires a media URL` });
        }

        if (!content && !mediaUrl) {
        return res.status(400).json({ message: "Message must contain text or media" });
        }

        const newMessage = await Msg.create({
            sender: senderId,
            chat: chatId,
            content,
            messageType,
            mediaUrl,
            readBy: [senderId],
          });
      
          await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id });
      
          const populatedMsg = await Msg.findById(newMessage._id)
            .populate("sender", "username profilePicture")
            .populate("chat");
      
          res.status(201).json(populatedMsg);

    }catch(e){
        console.error("sendMessage error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get all messages of chat
export const getMessages = async (req, res) => {
    try {
      const { chatId } = req.params;
  
      const messages = await Msg.find({ chat: chatId })
        .populate("sender", "username profilePicture")
        .sort({ createdAt: 1 });
  
      res.status(200).json(messages);
    } catch (err) {
      console.error("getMessages error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };


// mark message as read
export const markAsRead = async (req, res) => {
    try {
      const userId = req.user._id;
      const { messageIds } = req.body; 
        
      console.log(userId);
      await Msg.updateMany(
        { _id: { $in: messageIds }, readBy: { $ne: userId } },
        { $push: { readBy: userId } }
      );
  
      res.status(200).json({ message: "Marked as read" });
    } catch (err) {
      console.error("markAsRead error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };