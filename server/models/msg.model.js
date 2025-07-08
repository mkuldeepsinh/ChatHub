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
      enum: ["text", "image", "video", "file"],
      default: "text",
    },
    mediaUrl: {
      type: String,
      required: function () {
        return this.messageType !== "text";
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