const { Friend, FriendRequest } = require("../models/friendsModel");
const { User, Notifications } = require("../models/userModel");
const { default: jwtDecode } = require("jwt-decode");
const { default: mongoose } = require("mongoose");

class friendsControl {
  async addFriend(req, res) {
    const ObjectId = mongoose.Types.ObjectId;
    try {
      const { id } = req.params;
      const data = await User.findById(id);
      const from = jwtDecode(req.headers.authorization).id;
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      const check = await FriendRequest.findOne({
        $or: [
          {
            $and: [
              { fromUserId: new ObjectId(from) },
              { toUserId: new ObjectId(id) },
            ],
          },
          {
            $and: [
              { fromUserId: new ObjectId(id) },
              { toUserId: new ObjectId(from) },
            ],
          },
        ],
      });
      if (check) {
        return res.status(422).json({
          status: "Failed",
          message: "Request has been sent",
        });
      }
      const check_friends = await Friend.findOne({
        $or: [
          {
            $and: [
              { id_user: new ObjectId(from) },
              { id_friend: new ObjectId(id) },
            ],
          },
          {
            $and: [
              { id_user: new ObjectId(id) },
              { id_friend: new ObjectId(from) },
            ],
          },
        ],
      });
      if (check_friends) {
        return res.status(422).json({
          status: "Failed",
          message: "Has been added to friend list",
        });
      }
      const content = await FriendRequest.create({
        fromUserId: from,
        toUserId: id,
      });
      const user = await User.findOne({ _id: new ObjectId(id) });
      await Notifications.create({
        id_user: id,
        title: `${user.username} sent you a friend request`,
        type: "request",
        id_content: content._id,
        from: from,
      });
      return res.status(200).json({
        status: "Success",
        message: "Friend request has been sent",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "Failed",
        message: "Something's wrong",
        error: error,
      });
    }
  }

  async getFriendsRequest(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const request = await FriendRequest.aggregate([
        {
          $lookup: {
            from: "users", // Use the "users" collection for the user details
            localField: "fromUserId",
            foreignField: "_id", // Assuming that the user ID in "listusers" matches "_id" in "users"
            as: "requestBy",
          },
        },
        {
          $project: {
            "requestBy.token": 0,
            "requestBy.isVerified": 0,
            "requestBy.password": 0,
            "requestBy.public_id": 0,
            "requestBy.createdAt": 0,
            "requestBy.updatedAt": 0,
          },
        },
        {
          $match: {
            $or: [
              { toUserId: new ObjectId(id_user) },
              { "requestBy._id": new ObjectId(id_user) },
            ],
          },
        },
      ]);
      return res.status(200).json({
        status: "Success",
        data: request,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async respondRequest(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const body = req.body;
      const id_user = jwtDecode(headers.authorization).id;
      const { id } = req.params;
      let response = await FriendRequest.findOne({
        $and: [
          { _id: new ObjectId(id) },
          { toUserId: new ObjectId(id_user) },
          { status: "pending" },
        ],
      });
      if (!response) {
        return res.status(404).json({
          status: "Failed",
          message: "Friend's request is not found",
        });
      }
      const check_friends = await Friend.findOne({
        $or: [
          {
            $and: [
              { id_user: new ObjectId(id_user) },
              { id_friend: new ObjectId(response.toUserId) },
            ],
          },
          {
            $and: [
              { id_user: new ObjectId(response.toUserId) },
              { id_friend: new ObjectId(id_user) },
            ],
          },
        ],
      });
      if (check_friends) {
        return res.status(422).json({
          status: "Failed",
          message: "Has been added to friend list",
        });
      }
      if (body.status == "accepted") {
        await Friend.create({
          id_user: id_user,
          id_friend: response.fromUserId,
        });
        await Notifications.findOneAndDelete({
          from: new ObjectId(response.fromUserId),
        });
        await FriendRequest.findOneAndDelete({ _id: new ObjectId(id) });
        const user = await User.findOne({ _id: new ObjectId(id_user) });
        await Notifications.create({
          from: id_user,
          id_user: response.fromUserId,
          title: `${user.username} has accepted your friend request`,
          type: "response",
        });
        return res.status(200).json({
          status: "Success",
          message: "Successfull added to friend list",
        });
      } else {
        await FriendRequest.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: body.status,
            },
          }
        );
        return res.status(200).json({
          status: "Success",
          message: "You have rejected the request",
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

  async listFriends(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id = jwtDecode(headers.authorization).id;
      const { key = "" } = req.query;
      const friends = await Friend.aggregate([
        {
          $addFields: {
            lookupId: {
              $cond: {
                if: { $eq: ["$id_user", new ObjectId(id)] },
                then: "$id_friend",
                else: "$id_user",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lookupId",
            foreignField: "_id",
            as: "detail",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  email: 1,
                  name: 1,
                  username: 1,
                  photo_profile: 1,
                  status: 1,
                  default_color: 1
                },
              },
            ],
          },
        },
        {
          $unwind: "$detail",
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$detail", { _id: "$_id", id_user: "$id_user" }],
            },
          },
        },
        {
          $match: {
            $or: [
              { name: { $regex: key, $options: "i" } },
              { username: { $regex: key, $options: "i" } },
            ],
          },
        },
      ]);
      return res.status(200).json({
        status: "Success",
        data: friends,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }

  async removeFriends(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const id_user = jwtDecode(headers.authorization).id;
      const { id } = req.params;
      const friends = await Friend.aggregate([
        {
          $match: {
            _id: new ObjectId(id),
          },
        },
        {
          $addFields: {
            lookupId: {
              $cond: {
                if: { $eq: ["$id_user", new ObjectId(id_user)] },
                then: "$id_friend",
                else: "$id_user",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lookupId",
            foreignField: "_id",
            as: "detail",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  email: 1,
                  name: 1,
                  username: 1,
                  photo_profile: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$detail",
        },
        {
          $replaceRoot: { newRoot: "$detail" },
        },
      ]);
      if (friends.length == 0) {
        return res.status(404).json({
          status: "Failed",
          message: "Friend's not found",
        });
      }
      await Friend.findOneAndDelete({ _id: new ObjectId(id) });
      return res.status(200).json({
        status: "Success",
        message: "User has been deleted from your friend list",
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
module.exports = new friendsControl();
