const { TodoList } = require("../models/todolistModel");
const { TodoModel } = require("../models/todoModels");
const { default: mongoose } = require("mongoose");
const { default: jwtDecode } = require("jwt-decode");

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
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.body.id_todo;
      const body = req.body;
      console.log(body);
      let todo = await TodoModel.findById(id);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo Not Found",
        });
      } else {
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
