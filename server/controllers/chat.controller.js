import { Chat } from "../models/chat.model.js";

// create chat 1-1
export const createChat = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const userId = req.user._id;

        if (!receiverId) {
            return res.status(400).json({ message: "Receiver is required" });
        }

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            isGroup: false,
            users: { $all: [userId, receiverId], $size: 2 },
        })
            .populate("users", "-password")
            .populate({
                path: "latestMessage",
                populate: { path: "sender", select: "username profilePicture" },
            });

        if (existingChat) return res.status(200).json(existingChat);

        const newChat = new Chat({
            isGroup: false,
            users: [userId, receiverId]
        });

        //save chat
        await newChat.save();

        const fullChat = await Chat.findById(newChat._id)
            .populate("users", "-password");

        res.status(201).json({
            message: "Chat created successfully",
            chat: fullChat
        })

    } catch (e) {
        console.error("Create chat error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get all chats of users
export const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({ users: userId })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate({
                path: "latestMessage",
                populate: {
                    path: "sender",
                    select: "username profilePicture",
                },
            })
            .sort({ updatedAt: -1 });

        res.status(200).json(chats);
    } catch (e) {
        console.error("Get chats error:", e);
        res.status(500).json({ message: "Internal server error" });
    }
}

// create a group chat
export const createGroupChat = async (req, res) => {
    try {
      const currentUserId = req.user._id;
      const { userIds, groupName } = req.body;
  
      if (!userIds || userIds.length < 2 || !groupName) {
        return res.status(400).json({
          message: "Group name and at least 2 users are required",
        });
      }
    //   console.log(userIds);
    //   console.log(currentUserId);
      const allUsers = [...userIds, currentUserId];
  
      const newGroup = await Chat.create({
        isGroup: true,
        users: allUsers,
        groupName,
        groupAdmin: currentUserId,
      });
  
      const fullGroup = await Chat.findById(newGroup._id)
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(201).json(fullGroup);
    } catch (err) {
      console.error("createGroupChat error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // delete chat
  export const deleteChat = async (req, res) => {
    try {
      const { chatId } = req.params;
  
      await Chat.findByIdAndDelete(chatId);
  
      res.status(200).json({ message: "Chat deleted successfully" });
    } catch (err) {
      console.error("deleteChat error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // edit group name remove user from grouo add user in group
  export const updateGroup = async (req, res) => {
    try {
      const { chatId } = req.params;
      const { groupName, users } = req.body;
  
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { groupName, users },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).json(updatedChat);
    } catch (err) {
      console.error("updateGroup error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  //search chat by username and grop name;
  export const searchChat = async (req, res) => {
    try {
      const { search } = req.query;
  
      const chats = await Chat.find({
        $or: [
          { groupName: { $regex: search, $options: "i" } },
          { users: { $elemMatch: { username: { $regex: search, $options: "i" } } } },
        ],
      })
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).json(chats);
    } catch (err) {
      console.error("searchChat error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };




