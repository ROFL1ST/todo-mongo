const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const { default: jwtDecode } = require("jwt-decode");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

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
      await userModel.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            username: body.username,
            name: body.name,
          },
        }
      );
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
