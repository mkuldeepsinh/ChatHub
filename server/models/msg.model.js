import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const msgSchema = new Schema(
  {
    sender: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: ObjectId,
      ref: "Chat",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.mediaUrl;
      },
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "file", "image_group"],
      default: "text",
    },
    mediaUrl: {
      type: String,
      required: function () {
        return this.messageType !== "text" && this.messageType !== "image_group";
      },
    },
    mediaUrls: {
      type: [String],
      required: function () {
        return this.messageType === "image_group";
      },
    },
    imageCount: {
      type: Number,
      required: function () {
        return this.messageType === "image_group";
      },
    },
    readBy: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Msg = mongoose.model("Msg", msgSchema);
export default Msg;