const { TodoList } = require("../models/todolistModel");
const { TodoModel } = require("../models/todoModels");
const { default: jwtDecode } = require("jwt-decode");
const { default: mongoose } = require("mongoose");

class todoList {
  async getList(req, res) {
    try {
      const id = req.params.id;
      const todo = await TodoModel.findById(id);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo not found",
        });
      } else {
        const data = await TodoList.find({});
        return res.status(200).json({
          status: "Success",
          data: data,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async getDetailList(req, res) {
    try {
      const id = req.params.id;
      const data = await TodoList.findById(id);
      if (!data) {
        throw new Error("Data not found");
      } else {
        return res.status(200).json({
          status: "Success",
          data: data,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async postList(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.body.id_todo;
      const body = req.body;
      const todo = await TodoModel.aggregate([
        {
          $lookup: {
            from: "todolists",
            localField: "_id",
            foreignField: "id_todo",
            as: "todolists",
          },
        },
        {
          $lookup: {
            from: "listusers",
            localField: "_id",
            foreignField: "id_todo",
            as: "user",
          },
        },
        {
          $match: {
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.id_user": new ObjectId(id_user),
          },
        },
      ]);
      if (todo.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      } else {
        let listUser = todo[0].user.filter((i) => i.id_user == id_user);
        // return console.log();
        if (listUser[0].role == "member") {
          return res.status(401).json({
            status: "Failed",
            message: "You are not the admin of this todo",
          });
        }
        body.id_user = id_user;
        let newTodoList = await TodoList.create(body); // Notice the change here
        console.log(newTodoList);
        return res.status(200).json({
          status: "Success",
          data: newTodoList,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }
}

module.exports = new todoList();
