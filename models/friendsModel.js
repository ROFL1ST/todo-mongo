const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const friendsSchema = mongoose.Schema(
  {
    id_user: {
      type: ObjectId,
      ref: "users",
      required: true,
    },
    id_friend: {
      type: ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const friendRequestSchema = mongoose.Schema(
  {
    fromUserId: { type: ObjectId, ref: "User", required: true },
    toUserId: { type: ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Friend = mongoose.model("friends", friendsSchema);
const FriendRequest = mongoose.model("friends-requests", friendRequestSchema);
module.exports = { Friend, FriendRequest };
