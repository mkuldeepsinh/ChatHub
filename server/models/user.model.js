import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, 
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
    },
    about: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false, 
    },
    lastSeen: {
      type: Date,
    },
    blockedUsers: [
      {
        type: ObjectId,
        ref: "User",
      }
    ],
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", UserSchema);
