const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const todoListSchema = mongoose.Schema(
  {
    id_todo: {
      type: ObjectId,
      required: [true, "Please enter the name of activity list"],
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

const TodoList = mongoose.model("TodoList", todoListSchema);

module.exports = TodoList;
