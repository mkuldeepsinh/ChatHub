import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const ChatSchema = new Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: ObjectId,
        ref: "User",
        required: true,
      }
    ],
    groupAdmin: {
      type: ObjectId,
      ref: "User",
    },
    groupName:{
        type : String
    },
    latestMessage: {
      type: ObjectId,
      ref: "Msg"
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model("Chat", ChatSchema);
