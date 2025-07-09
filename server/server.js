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

// Create HTTP server and bind Express app
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // Allow all origins for development; restrict in production
        methods: ["GET", "POST" , "PUT" , "DELETE"]
    }
});

// Listen for client connections
io.on("connection", async (socket) => {
    // --- AUTHENTICATION ---
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
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
    console.log(`User connected: ${user.username} (${socket.id})`);

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
                socket.emit("joined_chat", chatId);
                console.log(`User ${user.username} joined chat ${chatId}`);
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
            socket.emit("left_chat", chatId);
        } else {
            socket.emit("error", "No chatId provided");
        }
    });

    // --- SEND MESSAGE ---
    socket.on("send_message", async (data) => {
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
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: (result) => {
                    if (this.statusCode === 201) {
                        io.to(data.chatId).emit("new_message", result);
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
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: (result) => {
                    if (this.statusCode === 200) {
                        io.to(chatId).emit("messages_read", { messageIds, userId: socket.user._id });
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
            if (user) {
                user.isOnline = false;
                user.lastSeen = new Date();
                await user.save();
            }
            console.log(`User disconnected: ${user?.username} (${socket.id})`);
        } catch (err) {
            // Ignore disconnect errors
        }
    });
});

console.log(process.env.PORT);
// Start the server using http.Server (not app.listen)
server.listen(process.env.PORT, () => {
    console.log("server start on " + process.env.PORT);
});