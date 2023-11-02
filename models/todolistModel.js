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
    status: {
      type: String,
      enum: ["open", "pending", "in progress", "completed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "low",
    },
    start: {
      type: Date,
      required: [true, "Please enter the Date Start of activity list"],
    },
    end: {
      type: Date,
      required: [true, "Please enter the Date End of activity list"],
    },
  },
  { timestamps: true }
);

const attachListSchema = mongoose.Schema({
  id_user: {
    type: ObjectId,
    required: true,
  },
  id_todoList: {
    type: ObjectId,
    required: true,
  },
  attach_url: {
    type: String,
    default: null,
  },
  public_id: {
    type: String,
    default: null,
  },
});

const subListSchema = mongoose.Schema({
  id_user: {
    type: ObjectId,
    required: true,
  },
  id_todoList: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: [true, "Please enter the id of activity list"],
  },
  checked: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
});

// comment


const TodoList = mongoose.model("todolists", todoListSchema);

const SubList = mongoose.model("sublists", subListSchema);
const attaches = mongoose.model("attaches", attachListSchema);

module.exports = { TodoList, SubList, attaches };
