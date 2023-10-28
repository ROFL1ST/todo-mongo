const { default: jwtDecode } = require("jwt-decode");
const { TodoModel, ListUsersModel } = require("../models/todoModels");
const { TodoList } = require("../models/todolistModel");
const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
class todo {
  async getTodo(req, res) {
    try {
      let headers = req.headers;
      let id = jwtDecode(headers.authorization).id;
      // console.log(id);
      const data = await TodoModel.aggregate([
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
      ]);

      return res.status(200).json({
        status: "Success",
        data: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async postTodo(req, res) {
    try {
      let body = req.body;
      let headers = req.headers;
      let id = jwtDecode(headers.authorization).id;
      body.id_user = id;
      let data = await TodoModel.create(body);
      await ListUsersModel.create({
        id_todo: data._id,
        id_user: id,
        role: "admin",
      });

      return res.status(200).json({
        status: "Success",
        data: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async addUser(req, res) {
    try {
      let id = req.params.id;
      let body = req.body;
      let headers = req.headers;
      let todo = await TodoModel.find({ _id: id });
      if (!todo[0])
        return res
          .status(404)
          .json({ status: "Failed", message: "No Todo's found" });
      let userId = jwtDecode(headers.authorization).id;
      if (todo[0].id_user != userId)
        return res
          .status(401)
          .json({ status: "Failed", message: "You are not the admin" });
      let checkUser = await ListUsersModel.findOne({
        id_user: body.id_user,
      });

      if (checkUser) {
        return res.status(400).json({
          status: "Failed",
          message: "This user is already exist",
        });
      }
      body.id_todo = id;
      let newListUser = await ListUsersModel.create(body);
      return res.status(200).json({
        status: "Success",
        message: "User has been added",
        data: newListUser,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async updateTodo(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      let id = req.params.id;
      let body = req.body;
      let headers = req.headers;
      let data = await TodoModel.aggregate([
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
            _id: new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.role": "admin",
          },
        },
      ]);
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo's not found",
        });
      }
      let userId = jwtDecode(headers.authorization).id;
      if (data[0].id_user != userId)
        return res.status(401).json({
          status: "Failed",
          message: "You are not the admin of this todo",
        });
      await TodoModel.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: body.name,
            percent: body.percent,
            description: body.description,
          },
        }
      );

      return res.status(200).json({
        status: "Success",
        data: body,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }
}

module.exports = new todo();
