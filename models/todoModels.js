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
});

const TodoModel = mongoose.model("todos", todoSchema);
const ListUsersModel = mongoose.model("listUsers", list_user);


module.exports = {TodoModel, ListUsersModel};
