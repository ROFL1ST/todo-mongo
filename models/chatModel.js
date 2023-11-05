const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const roomChatSchema = mongoose.Schema({
  id_todoList: {
    type: ObjectId,
    required: true,
    ref: "todolists"
  },
  room_code: {
    type: String,
    required: true,
  },
});

const messageSchema = mongoose.Schema({
  id_room: {
    type: ObjectId,
    required: true,
    ref: "roomchats",
  },
  id_user: {
    type: ObjectId,
    required: true,
    ref: "users",
  },
  room_code: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: [true, "Enter your message"],
  },
});

const Message = mongoose.model("messages", messageSchema);
// const Reply = mongoose.model("replies", replySchema);
const RoomChat = mongoose.model("roomChats", roomChatSchema);

module.exports = { Message, RoomChat };
