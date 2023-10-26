const mongoose = require("mongoose");

const todoSchema = mongoose.Schema(
  {
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

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
