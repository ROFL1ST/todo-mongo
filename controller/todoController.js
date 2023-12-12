const jwt = require("jsonwebtoken");
const {
  TodoModel,
  ListUsersModel,
  InvitationalModel,
} = require("../models/todoModels");
const { User, Notifications } = require("../models/userModel");
const { v4: uuidv4 } = require("uuid");
const { default: mongoose } = require("mongoose");
const { default: jwtDecode } = require("jwt-decode");
const bcrypt = require("bcrypt");
const { RoomChat, Message } = require("../models/chatModel");
const { TodoList, SubList, Asign } = require("../models/todolistModel");

class todo {
  async getTodo(req, res) {
    try {
      const { page = 1, limit = 8, key } = req.query;

      const ObjectId = mongoose.Types.ObjectId;
      let headers = req.headers;
      let id = jwtDecode(headers.authorization).id;
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
          $addFields: {
            // You can use $slice to limit the number of documents from the joined collection
            todolists: { $slice: ["$todolists", 5] },
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
            from: "users", // Use the "users" collection for the user details
            localField: "user.id_user",
            foreignField: "_id", // Assuming that the user ID in "listusers" matches "_id" in "users"
            as: "userDetails",
          },
        },
        {
          $addFields: {
            user: {
              $map: {
                input: "$user",
                as: "user",
                in: {
                  $mergeObjects: [
                    "$$user",
                    {
                      $let: {
                        vars: {
                          userDetailsFiltered: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$userDetails",
                                  as: "ud",
                                  cond: { $eq: ["$$ud._id", "$$user.id_user"] },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          $arrayToObject: {
                            $filter: {
                              input: {
                                $objectToArray: "$$userDetailsFiltered",
                              },
                              cond: { $ne: ["$$this.k", "_id"] },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            userDetails: 0,
            code: 0,
            "user.token": 0,
            "user.password": 0,
            "user.public_id": 0,
            "user.createdAt": 0,
            "user.updatedAt": 0,
          },
        },
        {
          $match: {
            $and: [
              { "user.id_user": new ObjectId(id) },
              key
                ? {
                    name: { $regex: key, $options: "i" },
                  }
                : {},
            ],
          },
        },

        {
          $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
          $limit: parseInt(limit),
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
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = req.params;
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
        {
          $project: {
            code: 0,
            "user.token": 0,
          },
        },

        {
          $match: {
            _id: new ObjectId(id),
            "user.id_user": { $exists: true }, // Check if "user" array exists
          },
        },
      ]);

      if (data.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo's not found",
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

  async postTodo(req, res) {
    try {
      let body = req.body;
      let headers = req.headers;
      let id = jwtDecode(headers.authorization).id;
      body.id_user = id;
      const code = uuidv4();
      const token = jwt.sign(
        { id: id, code: code },
        process.env.JWT_INVITATION_TOKEN
      );
      body.code = code;
      let data = await TodoModel.create(body);
      await ListUsersModel.create({
        id_todo: data._id,
        id_user: id,
        token: token,
        role: "owner",
      });

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
  async deleteTodo(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const id = req.params.id;
      if (!ObjectId.isValid(id)) throw new Error("Invalid todo ID");
      // check user owner
      const todo = await TodoModel.aggregate([
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
            from: "todolists",
            localField: "_id",
            foreignField: "id_todo",
            as: "lists",
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
      if (todo.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      }
      let listUser = todo[0].user.filter((i) => i.id_user == id_user);
      if (listUser[0].role != "owner") {
        return res.status(401).json({
          status: "Failed",
          message: "You are not the owner of this todo",
        });
      }
      // return console.log(todo[0]);
      if (todo[0].lists.length > 0) {
        const todoListIds = todo[0].lists.map((list) => list._id);
        await SubList.deleteMany({ id_todoList: { $in: todoListIds } });
        let check_chat = await RoomChat.aggregate([
          {
            $match: {
              id_todoList: { $in: todoListIds },
            },
          },
        ]);
        // return console.log(check_chat);
        if (check_chat.length != 0) {
          const rommsId = check_chat.map((list) => list.room_code);
          await RoomChat.deleteMany({ id_todoList: { $in: todoListIds } });
          await Message.deleteMany({
            room_code: { $in: rommsId },
          });
        }
        let check_asigned = await Asign.findOne({
          id_todoList: new ObjectId(id),
        });
        if (check_asigned) {
          await Asign.deleteMany({ id_todoList: new ObjectId(id) });
        }
        await TodoList.deleteMany({ _id: { $in: todoListIds } });
      }
      await ListUsersModel.deleteMany({ id_todo: new ObjectId(id) });
      await InvitationalModel.deleteMany({ id_todo: new ObjectId(id) });
      await TodoModel.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({
        status: "Success",
        message: "Todo deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }
  async inviteUser(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      let id = req.params.id;
      let body = req.body;
      let headers = req.headers;
      let userId = jwtDecode(headers.authorization).id;
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
            "user.id_user": new ObjectId(userId),
          },
        },
      ]);
      if (!todo || todo.length == 0)
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      let listUser = todo[0].user.filter((i) => i.id_user == userId);
      if (listUser[0].role == "member")
        return res
          .status(401)
          .json({ status: "Failed", message: "You are not the admin" });

      let checked = await User.findOne({
        _id: body.invitedUser,
      });

      if (!checked) {
        return res.status(400).json({
          status: "Failed",
          message: "This user is not exist",
        });
      }
      if (body.invitedUser == userId) {
        return res.status(400).json({
          status: "Failed",
          message: "You can't invite yourself",
        });
      }
      let inviteCheck = await InvitationalModel.aggregate([
        {
          $match: {
            $and: [
              { invitedUser: new ObjectId(body.invitedUser) },
              { status: "pending" },
            ],
          },
        },
      ]);
      // return console.log(inviteCheck);
      if (inviteCheck.length != 0) {
        return res.status(401).json({
          status: "Failed",
          message: "This user is already invited",
        });
      }
      let check_list = await TodoModel.aggregate([
        {
          $lookup: {
            from: "listusers",
            localField: "_id",
            foreignField: "id_todo",
            as: "users",
          },
        },
        {
          $match: {
            _id: new ObjectId(id),
            "users.id_user": new ObjectId(body.invitedUser),
          },
        },
      ]);
      if (check_list.length != 0) {
        return res.status(400).json({
          status: "Failed",
          message: "This user is already exist",
        });
      }
      // let newListUser = await ListUsersModel.create(body);
      // return console.log(todo[0].code);
      const token = jwt.sign(
        { id: body.invitedUser, code: todo[0].code },
        process.env.JWT_INVITATION_TOKEN
      );
      body.id_todo = id;
      body.token = token;
      body.invited_by = userId;
      const data = await InvitationalModel.create(body);
      const user = await User.findOne({ _id: new ObjectId(userId) });
      await Notifications.create({
        type: "invitation",
        title: `You have been invited to the task "${todo[0].name}" by ${user.username}`,
        from: userId,
        id_user: body.invitedUser,
        id_content: data._id,
      });
      return res.status(200).json({
        status: "Success",
        message: "Invitation has been sent",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async getInvitation(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      let invitational = await InvitationalModel.aggregate([
        {
          $lookup: {
            from: "users", // Use the "users" collection for the user details
            localField: "invited_by",
            foreignField: "_id", // Assuming that the user ID in "listusers" matches "_id" in "users"
            as: "invitedBy",
          },
        },
        {
          $project: {
            invited_by: 0,
            "invitedBy.password": 0,
            "invitedBy.public_id": 0,
            "invitedBy.createdAt": 0,
            "invitedBy.updatedAt": 0,
          },
        },
        {
          $match: {
            $or: [
              { invitedUser: new ObjectId(id_user) },
              { "invitedBy._id": new ObjectId(id_user) },
            ],
          },
        },
      ]);
      return res.status(200).json({
        status: "Success",
        data: invitational,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }
  async DeleteInvitation(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id = req.params.id;
      const id_user = jwtDecode(headers.authorization).id;
      const invitation = InvitationalModel.findOne({
        $and: [
          { _id: new ObjectId(id) },
          { invitedUser: new ObjectId(id_user) },
        ],
      });
      if (!invitation) {
        return res.status(404).json({
          status: "Failed",
          message: "Invitation is not found",
        });
      }
      await InvitationalModel.findOneAndDelete({ _id: new ObjectId(id) });
      await Notifications.findOneAndDelete({ id_content: new ObjectId(id) });
      return res.status(200).json({
        status: "Success",
        message: "Invitation has been deleted",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async invitationRespond(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const body = req.body;
      const id = req.params.id;
      const id_user = jwtDecode(headers.authorization).id;
      let invitational = await InvitationalModel.aggregate([
        {
          $match: {
            $and: [
              { _id: new ObjectId(id) },
              { invitedUser: new ObjectId(id_user) },
              { status: "pending" },
            ],
          },
        },
      ]);
      // return console.log(invitational);
      if (!invitational || invitational.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Invitation is not found",
        });
      }
      const invite_code = await invitational[0]?.token;
      // console.log(jwtDecode(invite_token).id);

      if (jwtDecode(invite_code).id != id_user) {
        return res.status(401).json({
          status: "Failed",
          message: "This invitation doesn't bellong to you",
        });
      }
      if (body.status == "accepted") {
        let check = await TodoModel.findOne({
          code: jwtDecode(invite_code).code,
        });
        let check_list = await TodoModel.aggregate([
          {
            $lookup: {
              from: "listusers",
              localField: "_id",
              foreignField: "id_todo",
              as: "users",
            },
          },
          {
            $match: {
              "users.id_user": new ObjectId(jwtDecode(invite_code).id),
              code: jwtDecode(invite_code).code,
            },
          },
        ]);
        if (!check) {
          return res.status(401).json({
            status: "Failed",
            message: "Token is not valid",
          });
        }
        // console.log(check_list);
        if (check_list.length != 0) {
          return res.status(401).json({
            status: "Failed",
            message: "You already joined this todo",
          });
        }
        body.id_todo = check._id;
        body.id_user = jwtDecode(invite_code).id;
        body.token = invite_code;
        await ListUsersModel.create(body);
        await Notifications.findOneAndDelete({
          invitedUser: new ObjectId(jwtDecode(invite_code).id),
        });
        const user = await User.findOne({
          _id: new ObjectId(jwtDecode(invite_code).id),
        });
        await Notifications.create({
          from: jwtDecode(invite_code).id,
          type: "response",
          title: `${user.username} has accepted your invitation`,
          id_user: invitational[0].invited_by,
        });
        await InvitationalModel.findOneAndDelete({ _id: new ObjectId(id) });
        return res.status(200).json({
          status: "Success",
          message: "You have joined the todo",
        });
      } else {
        await InvitationalModel.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: body.status,
            },
          }
        );
        return res.status(200).json({
          status: "Success",
          message: "You have rejected the invitation",
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
      let listUser = data[0].user.filter((i) => i.id_user == userId);

      if (listUser[0].role == "member")
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

  async updateRole(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      let id = req.params.id;
      let body = req.body;
      let headers = req.headers;
      let userId = jwtDecode(headers.authorization).id;
      let data = await ListUsersModel.findById({
        _id: new ObjectId(id),
      });
      // console.log(data.token);
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's no found",
        });
      }
      let user_token = data.token;
      let code = jwtDecode(user_token).code;
      // let code_todo =
      let check_role = await TodoModel.aggregate([
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
            $or: [{ code: code }, { "user.id_user": new ObjectId(id) }],
          },
        },
      ]);
      if (data.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      // console.log(code, id, check_role);
      if (check_role.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo's or user's not found",
        });
      }
      // return console.log(code);
      let listUser = check_role[0].user.filter((i) => i.id_user == userId);
      console.log(listUser);
      if (listUser[0].role == "member")
        return res
          .status(401)
          .json({ status: "Failed", message: "You are not the admin" });
      await ListUsersModel.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            role: body.role,
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

  async kickUser(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const { kick } = req.body;
      const id = req.params.id;
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
            $and: [
              { "user.id_user": new ObjectId(id_user) },
              { "user.id_user": new ObjectId(kick) },
            ],
          },
        },
      ]);
      if (todo.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Todo or user is not in this server",
        });
      }
      let listUser = todo[0].user.filter((i) => i.id_user == id_user);
      // return console.log();
      if (listUser[0].role != "owner") {
        if (kick !== id_user) {
          return res.status(403).json({
            status: "Failed",
            message: "You are not the owner of this todo",
          });
        }
      }
      let data = await ListUsersModel.findOneAndDelete(id);
      return res.status(200).json({
        status: "Success",
        message: "Kick member success!",
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
}

module.exports = new todo();
