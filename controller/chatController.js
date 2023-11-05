const { TodoList, attaches, SubList } = require("../models/todolistModel");
const { Message, RoomChat } = require("../models/chatModel");
const { TodoModel } = require("../models/todoModels");
const { default: jwtDecode } = require("jwt-decode");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

class chat {
  async getRoom(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;

      let id_list = req.params.id;
      const { authorization } = req.headers;
      let { id } = jwtDecode(authorization);
      let data = await RoomChat.aggregate([
        { $match: { id_todoList: new ObjectId(id_list) } },
      ]);
      console.log(data);
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "Room's not found",
        });
      }
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
  async sendMessage(data) {
    try {
      const check = await RoomChat.findOne({
        room_code: data.room_code,
        id_todoList: data.id_todoList,
      });
      console.log(data);
      let { id } = jwtDecode(data.id_user);

      await Message.create({
        room_code: data.room_code,
        id_user: id,
        message: data.msg,
        id_room: data._id,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getMessageList(req, res) {
    try {
      const { room_code } = req.params;
      let data = await Message.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "id_user",
            foreignField: "_id",
            as: "infoUser",
          },
        },

        {
          $unwind: "$infoUser",
        },
        {
          $project: {
            "infoUser.password": 0,
          },
        },
        {
          $match: {
            room_code: room_code,
          },
        },
      ]);
      console.log(data);
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

  async deleteMessage(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = req.params;
      const id_user = jwtDecode(headers.authorization).id;
      console.log(id_user);
      const data = await Message.aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            id_user: new ObjectId(id_user),
          },
        },
      ]);
      // console.log(data);
      if (data.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Message's not found",
        });
      }
      await Message.findByIdAndDelete(new ObjectId(id));
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
}
module.exports = new chat();
