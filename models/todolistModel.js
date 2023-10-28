const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const todoListSchema = mongoose.Schema(
  {
    id_todo: {
      type: ObjectId,
      required: [true, "Please enter the name of activity list"],
    },
    id_user: {
      type: ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please enter the id of activity list"],
    },
    checked: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: [true, "Please enter the Date of activity list"],
    },
  },
  { timestamps: true }
);

// comment

const commentSchema = mongoose.Schema({
  id_user: {
    type: ObjectId,
    required: true,
  },
  id_todoList: {
    type: ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: [true, "Enter your comment"],
  },
});

const replySchema = mongoose.Schema({
  id_user: {
    type: ObjectId,
    required: true,
  },
  id_comment: {
    type: ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: [true, "Enter your reply"],
  },
});
const TodoList = mongoose.model("todolists", todoListSchema);
const Comment = mongoose.model("comments", commentSchema);
const Reply = mongoose.model("replies", replySchema);

module.exports = { TodoList, Comment, Reply };
