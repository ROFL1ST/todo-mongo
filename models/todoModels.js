const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const todoSchema = mongoose.Schema(
  {
    id_user: {
      type: ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please enter the name of activity"],
    },
    percent: {
      type: String,
      default: "0",
    },
    description: {
      type: String,
      required: [true, "Please enter the description of activity"],
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const list_user = mongoose.Schema({
  id_todo: {
    type: ObjectId,
    required: true,
  },
  id_user: {
    type: ObjectId,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member",
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
});

const invitational = mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  id_todo: {
    type: ObjectId,
    required: true,
  },
  invitedUser: {
    type: ObjectId,
    required: true,
  },
  invited_by: {
    type: ObjectId,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

const TodoModel = mongoose.model("todos", todoSchema);
const ListUsersModel = mongoose.model("listUsers", list_user);
const InvitationalModel = mongoose.model("invitationals", invitational);

module.exports = { TodoModel, ListUsersModel, InvitationalModel };
