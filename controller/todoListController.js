const { TodoList, attaches, SubList } = require("../models/todolistModel");
const { TodoModel } = require("../models/todoModels");
const { default: jwtDecode } = require("jwt-decode");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

class todoList {
  async getList(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const id = req.params.id;
      const todo = await TodoModel.findById(id);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo not found",
        });
      } else {
        const data = await TodoList.aggregate([
          { $match: { id_todo: new ObjectId(id) } },
        ]);
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
      const ObjectId = mongoose.Types.ObjectId;
      const id = req.params.id;
      const data = await TodoList.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "id_user",
            foreignField: "_id",
            as: "users",
          },
        },

        { $match: { _id: new ObjectId(id) } },
        {
          $project: {
            id_todo: "$id_todo",
            name: "$name",
            status: "$status",
            priority: "$priority",
            date: "$date",
            "users._id": 1,
            "users.username": 1,
            "users.name": 1,
            "users.photo_profile": 1,
          },
        },
        {
          $lookup: {
            from: "attaches",
            localField: "_id",
            foreignField: "id_todoList",
            as: "attaches",
          },
        },
        {
          $lookup: {
            from: "sublists",
            localField: "_id",
            foreignField: "id_todoList",
            as: "sublists",
          },
        },
      ]);
      if (!data || data.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Data not found",
        });
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
            _id: new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.id_user": new ObjectId(id_user),
          },
        },
      ]);
      // return console.log(todo);
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

  async updateList(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.params.id;
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
            "todolists._id": new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.id_user": new ObjectId(id_user),
          },
        },
      ]);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      }
      let listUser = todo[0].user.filter((i) => i.id_user == id_user);
      if (listUser[0].role == "member") {
        return res.status(401).json({
          status: "Failed",
          message: "You are not the admin of this todo",
        });
      }
      await TodoList.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: body.name,
            status: body.status,
            priority: body.priority,
            start: body.start,
            end: body.end,
          },
        }
      );
      return res.status(200).json({
        status: "Success",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async postAttaches(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.params.id;
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
            "todolists._id": new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.id_user": new ObjectId(id_user),
          },
        },
      ]);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      } else {
        let listUser = todo[0].user.filter((i) => i.id_user == id_user);
        if (listUser[0].role == "member") {
          return res.status(401).json({
            status: "Failed",
            message: "You are not the admin of this todo",
          });
        }
        body.id_user = id_user;
        body.id_todoList = id;
        if (req.file?.path != undefined) {
          const { secure_url, public_id } = await cloudinary.uploader.upload(
            req.file.path,
            { folder: "/todo/list", resource_type: "auto" }
          );
          body.attach_url = secure_url;
          body.public_id = public_id;
          const attach = await attaches.create(body);
          return res.status(200).json({
            status: "Success",
            message: "You have added attachment",
            data: attach,
          });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async postSubList(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.params.id;
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
            "todolists._id": new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.id_user": new ObjectId(id_user),
          },
        },
      ]);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      } else {
        let listUser = todo[0].user.filter((i) => i.id_user == id_user);
        if (listUser[0].role == "member") {
          return res.status(401).json({
            status: "Failed",
            message: "You are not the admin of this todo",
          });
        }
        body.id_user = id_user;
        body.id_todoList = id;
        if (!body.name) {
          return res.status(401).json({
            status: "Failed",
            message: "Please enter the name of sublist",
          });
        }
        let newSub = await SubList.create(body);
        return res.status(200).json({
          status: "Success",
          data: newSub,
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

  async updateSubList(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.params.id;
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
          $lookup: {
            from: "sublists",
            localField: "todolists._id",
            foreignField: "id_todoList",
            as: "sublists",
          },
        },
        {
          $match: {
            "sublists._id": new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
            "user.id_user": new ObjectId(id_user),
          },
        },
      ]);
      if (!todo) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      }
      let listUser = todo[0].user.filter((i) => i.id_user == id_user);
      if (listUser[0].role == "member") {
        return res.status(401).json({
          status: "Failed",
          message: "You are not the admin of this todo",
        });
      }

      let subListUpdate = await SubList.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: body.name,
            check: body.check,
          },
        }
      );

      return res.status(200).json({
        status: "Success",
        data: subListUpdate,
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

module.exports = new todoList();
