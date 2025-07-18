import express from "express"
import http from "http"; // Import http to create server
import { Server as SocketIOServer } from "socket.io"; // Import socket.io
import dotenv from "dotenv";
import dbConnect from "./config/dbConnect.js";
import userRouter from "./routes/user.route.js";
import chatRouter from "./routes/chat.route.js";
import msgRouter from "./routes/msg.route.js";
import jwt from "jsonwebtoken";
import { Chat } from "./models/chat.model.js";
import { User } from "./models/user.model.js";
import { sendMessage, markAsRead } from "./controllers/msg.controller.js";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();
dbConnect();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL, // Frontend URL
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "token"]
}));
app.use("/api/v1/user" , userRouter);
app.use("/api/v1/chats" , chatRouter);
app.use("/api/v1/message" , msgRouter);

// --- Place the production static serving code here ---
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Create HTTP server and bind Express app
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL, //  FRONTEND
        credentials: true,          
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Map to track chatId -> Set of socketIds
const chatRoomMap = new Map();

// Helper: Remove socket from all chats
function removeSocketFromAllChats(socketId) {
  for (const [chatId, socketSet] of chatRoomMap.entries()) {
    socketSet.delete(socketId);
    if (socketSet.size === 0) {
      chatRoomMap.delete(chatId);
    }
  }
}

// Helper: Emit to all sockets in a chat
function emitToChat(chatId, event, data) {
//   console.log(`[SOCKET.IO] Emitting ${event} to chat ${chatId} with data:`, data);
  if (chatRoomMap.has(chatId)) {
    for (const socketId of chatRoomMap.get(chatId)) {
      const s = io.sockets.sockets.get(socketId);
      if (s) s.emit(event, data);
    }
  }
}

// Helper: Delete chat room (call when chat is deleted)
function deleteChatRoom(chatId) {
  if (chatRoomMap.has(chatId)) {
    for (const socketId of chatRoomMap.get(chatId)) {
      const s = io.sockets.sockets.get(socketId);
      if (s) s.leave(chatId);
    }
    chatRoomMap.delete(chatId);
  }
}

// Listen for client connections
io.on("connection", async (socket) => {
    // console.log("[SOCKET.IO] New connection attempt", socket.id, socket.handshake.auth);
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    // console.log("[SOCKET.IO] Token received:", token);
    // --- AUTHENTICATION ---
    if (!token) {
        socket.emit("error", "No token provided");
        socket.disconnect(true);
        return;
    }
    let user;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.userId);
        if (!user) throw new Error("User not found");
        user.isOnline = true;
        await user.save();
        socket.user = user;
    } catch (err) {
        socket.emit("error", "Authentication failed");
        socket.disconnect(true);
        return;
    }
    // console.log(`[SOCKET.IO] User connected: ${user.username} (${socket.id})`);

    // --- JOIN CHAT ROOMS ---
    socket.on("join_chat", async (chatId) => {
        try {
            // Support both string and object input
            if (typeof chatId === "object" && chatId !== null && chatId.chatId) {
                chatId = chatId.chatId;
            }
            // Validate chatId
            if (!mongoose.Types.ObjectId.isValid(chatId)) {
                socket.emit("error", "Invalid chatId");
                return;
            }
            const chat = await Chat.findById(chatId);
            if (chat && chat.users.some(u => u.toString() === user._id.toString())) {
                socket.join(chatId);
                // Add socket.id to chatRoomMap
                if (!chatRoomMap.has(chatId)) chatRoomMap.set(chatId, new Set());
                chatRoomMap.get(chatId).add(socket.id);
                socket.emit("joined_chat", chatId);
                // console.log(`User ${user.username} joined chat ${chatId}, socket: ${socket.id}`);
            } else {
                socket.emit("error", "Cannot join chat");
            }
        } catch (err) {
            socket.emit("error", "Server error joining chat");
        }
    });

    // --- LEAVE CHAT ROOMS ---
    socket.on("leave_chat", (chatId) => {
        if (chatId) {
            socket.leave(chatId);
            if (chatRoomMap.has(chatId)) {
                chatRoomMap.get(chatId).delete(socket.id);
                if (chatRoomMap.get(chatId).size === 0) {
                    chatRoomMap.delete(chatId);
                }
            }
            socket.emit("left_chat", chatId);
        } else {
            socket.emit("error", "No chatId provided");
        }
    });

    // --- SEND MESSAGE ---
    socket.on("send_message", async (data) => {
        // console.log("[SOCKET.IO] send_message event received", data, "from", socket.user?.username);
        try {
            if (!data || typeof data !== "object") {
                socket.emit("error", "Invalid message data");
                return;
            }
            if (!data.chatId || !mongoose.Types.ObjectId.isValid(data.chatId)) {
                socket.emit("error", "Chat ID is required and must be valid");
                return;
            }
            const req = {
                body: data,
                user: socket.user
            };
            const res = {
                statusCode: 201,
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: function(result) {
                    if (this.statusCode === 201) {
                        // Use emitToChat to send to all sockets in the chat
                        emitToChat(data.chatId, "new_message", result);
                    } else {
                        socket.emit("error", result.message || "Failed to send message");
                    }
                }
            };
            await sendMessage(req, res);
        } catch (err) {
            socket.emit("error", "Server error sending message");
        }
    });

    // --- MARK MESSAGES AS READ ---
    socket.on("mark_as_read", async (payload) => {
        try {
            let messageIds, chatId;
            if (payload && typeof payload === "object") {
                messageIds = payload.messageIds;
                chatId = payload.chatId;
            }
            if (!Array.isArray(messageIds) || !chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
                socket.emit("error", "Invalid mark_as_read data");
                return;
            }
            const req = {
                body: { messageIds },
                user: socket.user
            };
            const res = {
                statusCode: 200,
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: function(result) {
                    if (this.statusCode === 200) {
                        emitToChat(chatId, "messages_read", { messageIds, userId: socket.user._id });
                    } else {
                        socket.emit("error", result.message || "Failed to mark as read");
                    }
                }
            };
            await markAsRead(req, res);
        } catch (err) {
            socket.emit("error", "Server error marking as read");
        }
    });

    // --- DISCONNECT ---
    socket.on("disconnect", async () => {
        try {
            removeSocketFromAllChats(socket.id);
            if (user) {
                user.isOnline = false;
                user.lastSeen = new Date();
                await user.save();
            }
            // console.log(`[SOCKET.IO] User disconnected: ${user?.username} (${socket.id})`);
        } catch (err) {
            // Ignore disconnect errors
        }
    });
});

// console.log(process.env.PORT);
// Start the server using http.Server (not app.listen)
server.listen(process.env.PORT, () => {
    // console.log("server start on " + process.env.PORT);
});