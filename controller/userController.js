const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { default: jwtDecode } = require("jwt-decode");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUD,
  api_secret: process.env.API_SECRET_CLOUD,
});
class userControl {
  async register(req, res) {
    try {
      const body = req.body;
      if (!body || !body.username || !body.name || !body.password)
        return res.status(400).json({
          status: "Failed",
          message: "Please enter your username, password and name correctly",
        });
      let isUserExist = await userModel.findOne({
        username: body.username,
      });
      if (isUserExist) {
        return res.status(400).json({
          status: "Failed",
          message: "Your username is already exist",
        });
      }
      body.password = bcrypt.hashSync(body.password, 10);
      let newUser = await userModel.create(body);
      const token = jwt.sign(
        { username: newUser.username, id: newUser._id },
        process.env.JWT_ACCESS_TOKEN
      );
      res.status(200).json({
        status: "Success",
        message: "Berhasil",
        token: token,
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
  async isOnline(id) {
    await userModel.updateOne({ _id: id }, { $set: { status: "online" } });
  }
  async isOffline(id) {
    await userModel.updateOne({ _id: id }, { $set: { status: "offline" } });
  }
  async login(req, res) {
    try {
      let body = req.body;
      let isUserExist = await userModel.findOne({
        username: body.username,
      });
      if (!isUserExist) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      let verify = bcrypt.compareSync(body.password, isUserExist.password);

      if (!verify) {
        return res.status(401).json({
          status: "Failed",
          message: "Your password's wrong",
        });
      }
      const token = jwt.sign(
        { username: isUserExist.username, id: isUserExist._id },
        process.env.JWT_ACCESS_TOKEN
      );
      return res.status(200).json({
        status: "Success",
        token: token,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
      });
    }
  }

  async updateProfile(req, res) {
    try {
      let headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      let id = jwtDecode(headers.authorization).id;
      let body = req.body;
      let checkUser = await userModel.find({ _id: new ObjectId(id) });
      if (!checkUser) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      if (req.file?.path != undefined) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          req.file.path,
          { folder: "/todo/users" }
        );
        body.photo_profile = secure_url;
        body.public_id = public_id;
        if (checkUser.photo_profile != null) {
          await cloudinary.uploader.destroy(checkUser.public_id);
        }
      } else {
        body.photo_profile = checkUser.photo_profile;
        body.public_id = checkUser.public_id;
      }
      await userModel.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            username: body.username,
            name: body.name,
            photo_profile: body.photo_profile,
            public_id: body.public_id,
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

  async searchUser(req, res) {
    try {
      const { page, limit, key } = req.query;
      const size = (parseInt(page) - 1) * parseInt(limit);
      let user = await userModel.aggregate([
        {
          $project: {
            username: "$username",
            name: "$name",
            status: "$status",
            photo_profile: "$photo_profile",
          },
        },
        key
          ? {
              $match: {
                $or: [
                  { name: { $regex: key, $options: "i" } },
                  { username: { $regex: key, $options: "i" } },
                ],
              },
            }
          : {},
        {
          $skip: size,
        },
        {
          $limit: parseInt(limit),
        },
      ]);
      return res.status(200).json({
        status: "Success",
        data: user,
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

module.exports = new userControl();
