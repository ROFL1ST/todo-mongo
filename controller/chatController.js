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
        id_room: data._id
      });
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = new chat();
