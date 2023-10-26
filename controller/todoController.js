const TodoModel = require("../models/todoModels");
const TodoList = require("../models/todolistModel");

class todo {
  async getTodo(req, res) {
    try {
      const data = await TodoModel.aggregate([
        {
          $lookup: {
            from: "todolists",
            localField: "id_todo",
            foreignField: "_id",
            as: "joinedData",
          },
        },
        {
          $unwind: "$joinedData",
        },
      ]);
      return res.status(200).json({
        status: "Success",
        data: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(422).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async getDetail(req, res) {
    try {
      const id = req.params.id;
      console.log(id);
      const data = await TodoModel.findById(id);
      return res.status(200).json({
        status: "Success",
        data: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(422).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async postTodo(req, res) {
    try {
      let body = req.body;
      let data = await TodoModel.create(body);
      return res.status(200).json({
        status: "Success",
        data: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(422).json({
        status: "Failed",
        message: error,
      });
    }
  }
}

module.exports = new todo();
