const {
  User,
  Forgot,
  Verify,
  History,
  Notifications,
} = require("../models/userModel");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { default: jwtDecode } = require("jwt-decode");
const { sendEmail } = require("../mail");
const crypto = require("crypto");
const { TodoModel, ListUsersModel } = require("../models/todoModels");
const { v4: uuidv4 } = require("uuid");
const { default: axios } = require("axios");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUD,
  api_secret: process.env.API_SECRET_CLOUD,
});

async function getLocationInfo(ip) {
  const apiKey = "aff52baa1fc17a1e330dd495aa2c5ad6"; // Replace with your actual API key
  const apiUrl = `http://api.ipstack.com/${ip}?access_key=${apiKey}`;

  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching location info:", error.message);
    return null;
  }
}
class userControl {
  async register(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;

      const body = req.body;
      if (
        !body ||
        !body.email ||
        !body.username ||
        !body.name ||
        !body.password
      )
        return res.status(400).json({
          status: "Failed",
          message: "Please enter your username, password and name correctly",
        });
      let isEmailExist = await User.findOne({
        email: body.email,
      });
      if (isEmailExist) {
        return res.status(400).json({
          status: "Failed",
          message: "Your email is already exist",
        });
      }
      let isUsernameExist = await User.findOne({
        username: body.username,
      });
      if (isUsernameExist) {
        return res.status(400).json({
          status: "Failed",
          message: "Your username is already exist",
        });
      }
      body.password = bcrypt.hashSync(body.password, 10);
      let newUser = await User.create(body);
      let kode = crypto.randomBytes(32).toString("hex");
      const link = `${process.env.MAIL_CLIENT_URL}/verify/${kode}`;
      const context = {
        url: link,
      };
      const mail = await sendEmail(
        newUser.email,
        "Verify email",
        "verify_email",
        context
      );
      if (mail == " error") {
        return res.status(422).json({
          status: "Failed",
          message: "Email's not sent",
        });
      }
      await Verify.create({
        id_user: new ObjectId(newUser._id),
        code: kode,
      });

      res.status(200).json({
        status: "Success",
        message: "Verification has been sent to your email",
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

  async verify(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = req.params;
      const user = await Verify.findOne({ code: id });
      if (!user) {
        return res.status(404).json({ message: "Invalid verification code" });
      }
      if (user.isUsed) {
        return res.sendFile(__dirname + "/public/verification-used.html");
      }
      await User.updateOne(
        {
          _id: new ObjectId(user.id_user),
        },
        {
          $set: { isVerified: true },
        }
      );
      await Verify.updateOne(
        {
          code: id,
        },
        {
          $set: {
            isUsed: true,
          },
        }
      );
      const code = uuidv4();
      const token = jwt.sign(
        { id: user.id_user, code: code },
        process.env.JWT_INVITATION_TOKEN
      );
      let todo = await TodoModel.create({
        id_user: user.id_user,
        name: "New Activity",
        description: "Put Your Description Here",
        code: code,
      });
      await ListUsersModel.create({
        id_todo: todo._id,
        id_user: user.id_user,
        token: token,
        role: "owner",
      });
      return res.sendFile(__dirname + "/public/verification-success.html");
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
    await User.updateOne({ _id: id }, { $set: { status: "online" } });
  }
  async isOffline(id) {
    await User.updateOne({ _id: id }, { $set: { status: "offline" } });
  }

  async login(req, res) {
    const ObjectId = mongoose.Types.ObjectId;
    try {
      const ip = req.socket.remoteAddress;
      const device = req.useragent ? req.useragent.os : "Unknown Device";
      const location = await getLocationInfo(ip);
      let body = req.body;
      let isUserExist = await User.findOne({
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
      if (!isUserExist.isVerified) {
        return res.status(401).json({
          status: "Failed",
          message: "Your email's not verified. Check your email",
        });
      }
      const token = jwt.sign(
        {
          email: isUserExist.email,
          id: isUserExist._id,
          name: isUserExist.name,
        },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: "7d" }
      );
      await User.updateOne(
        {
          _id: new ObjectId(jwtDecode(token).id),
        },
        { $set: { token: token } }
      );
      await History.create({
        id_user: isUserExist._id,
        user_agent: device,
        ip: ip,
        location: location
          ? `${location.city}, ${location.region_name}, ${location.country_name}`
          : "Unknown",
        loginAt: Date.now(),
      });
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

  async logout(req, res) {
    const ObjectId = mongoose.Types.ObjectId;
    try {
      const ip = req.socket.remoteAddress;
      const device = req.useragent ? req.useragent.os : "Unknown Device";
      const location = await getLocationInfo(ip);
      let headers = req.headers;
      const data = await User.findById(jwtDecode(headers.authorization).id);
      if (!data) {
        return res
          .status(404)
          .json({ status: "Failed", message: "User's not found" });
      }
      await User.updateOne(
        {
          email: jwtDecode(headers.authorization).email,
        },
        { $set: { token: null } }
      );
      await History.create({
        id_user: isUserExist._id,
        user_agent: device,
        ip: ip,
        location: location
          ? `${location.city}, ${location.region_name}, ${location.country_name}`
          : "Unknown",
        loginAt: Date.now(),
      });
      return res.status(200).json({
        status: "Success",
        message: "success to logout",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
      });
    }
  }

  async auth(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;

      const { authorization } = req.headers;
      if (authorization === undefined)
        return res
          .status(401)
          .json({ status: "Failed", message: "Token is required" });
      const token = authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_ACCESS_TOKEN, async (err, decode) => {
        if (err) {
          return res.status(401).json({
            status: "Failed",
            message: "Token is not valid",
          });
        }
        const { id, email, name } = jwt.decode(token);
        const newToken = jwt.sign(
          { email, id, name },
          process.env.JWT_ACCESS_TOKEN,
          {
            expiresIn: "7d",
          }
        );
        await User.updateOne(
          {
            _id: new ObjectId(jwtDecode(token).id),
          },
          { $set: { token: newToken } }
        );
        return res.status(200).json({
          status: "Success",
          token: newToken,
        });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
      });
    }
  }
  async forgot_password(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;

      const { email } = req.body;
      const data = await User.findOne({ email: email });
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      const check = await Forgot.findOne({ id_user: new ObjectId(data._id) });
      if (check) {
        return res.status(401).json({
          status: "Failed",
          message: "You have sent the code",
        });
      }
      const code = Math.floor(1000 + Math.random() * 9000);
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + 7);
      let expired = expirationDate.toISOString();
      const context = {
        code: code,
        name: data.name,
        dateExpired: expired,
      };
      const mail = await sendEmail(
        email,
        "Forgot Password",
        "forgot_password",
        context
      );
      if (mail == " error") {
        return res.status(422).json({
          status: "Failed",
          message: "Email's not sent",
        });
      }
      await Forgot.create({
        id_user: data._id,
        code: code,
        dateExpired: expired,
      });
      return res.status(200).json({
        status: "Success",
        message: "The code has been sent to your email",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
      });
    }
  }
  async resendEmail(req, res) {
    try {
      const { email } = req.body;
      const data = await User.findOne({ email: email });
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }

      const code = Math.floor(1000 + Math.random() * 9000);
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + 7);
      let expired = expirationDate.toISOString();
      const context = {
        code: code,
        name: data.name,
        dateExpired: expired,
      };
      const mail = await sendEmail(
        email,
        "Forgot Password",
        "forgot_password",
        context
      );
      if (mail == " error") {
        return res.status(422).json({
          status: "Failed",
          message: "Email's not sent",
        });
      }
      await Forgot.deleteOne({
        id_user: data._id,
      });
      await Forgot.create({
        id_user: data._id,
        code: code,
        dateExpired: expired,
      });
      return res.status(200).json({
        status: "Success",
        message: "The code has been sent to your email",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
      });
    }
  }
  async verifyForgot(req, res) {
    try {
      const { email } = req.params;
      const { code } = req.body;
      const data = await User.findOne({ email: email });
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      const check = await Forgot.findOne({ code: code });
      if (!check) {
        return res.status(404).json({
          status: "Failed",
          message: "Code's not found",
        });
      }
      if (check.code != code) {
        return res.status(401).json({
          status: "Failed",
          message: "Code's not valid",
        });
      }
      // check expired
      const currentTime = new Date().getTime();
      if (currentTime > check.dateExpired) {
        return res.status(401).json({
          status: "Failed",
          message: "Code's expired. Please generate a new code",
        });
      }
      return res
        .status(200)
        .json({ status: "Success", message: "success to verify code" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }
  async resetPassword(req, res) {
    try {
      let { code } = req.params;
      let body = req.body;
      const ObjectId = mongoose.Types.ObjectId;
      const data = await User.findOne({ email: body.email });
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's not found",
        });
      }
      const check = await Forgot.findOne({ code: code });
      if (!check) {
        return res.status(404).json({
          status: "Failed",
          message: "Code's not found",
        });
      }
      if (check.code != code) {
        return res.status(401).json({
          status: "Failed",
          message: "Code's not valid",
        });
      }
      await Forgot.deleteOne({ id_user: new ObjectId(data._id) });
      body.password = bcrypt.hashSync(body.password, 10);
      await User.updateOne({ _id: new ObjectId(data._id) });
      return res.status(200).json({
        status: "Success",
        message: "Password's updated",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "Failed",
        message: error,
      });
    }
  }
  async profile(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      let { id } = jwtDecode(headers.authorization);
      const data = await User.aggregate([
        {
          $lookup: {
            from: "todos",
            localField: "_id",
            foreignField: "id_user",
            as: "todo",
          },
        },
        {
          $match: {
            _id: new ObjectId(id),
          },
        },
        {
          $project: {
            password: 0,
            "todo.code": 0,
            token: 0,
          },
        },
      ]);
      // console.log(data);
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's Not Found",
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
  async detailProfile(req, res) {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = req.params;
      const data = await User.aggregate([
        {
          $lookup: {
            from: "todos",
            localField: "_id",
            foreignField: "id_user",
            as: "todo",
          },
        },
        {
          $match: {
            _id: new ObjectId(id),
          },
        },

        {
          $project: {
            password: 0,
            "todo.code": 0,
          },
        },
      ]);
      // console.log(data);
      if (!data) {
        return res.status(404).json({
          status: "Failed",
          message: "User's Not Found",
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
  async updateProfile(req, res) {
    try {
      let headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      let id = jwtDecode(headers.authorization).id;
      let body = req.body;
      let checkUser = await User.find({ _id: new ObjectId(id) });
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
      await User.updateOne(
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
      const { page = 1, limit = 8, key } = req.query;
      const size = (parseInt(page) - 1) * parseInt(limit);
      let pipeline = [
        {
          $project: {
            username: "$username",
            name: "$name",
            status: "$status",
            photo_profile: "$photo_profile",
          },
        },
        {
          $skip: size,
        },
        {
          $limit: parseInt(limit),
        },
      ];

      // Add $match stage if key is present
      if (key) {
        pipeline.splice(1, 0, {
          $match: {
            $or: [
              { name: { $regex: key, $options: "i" } },
              { username: { $regex: key, $options: "i" } },
            ],
          },
        });
      }

      let user = await User.aggregate(pipeline);
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
  async getNotifications(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = jwtDecode(headers.authorization);
      const data = await Notifications.aggregate([
        { $match: { id_user: new ObjectId(id) } },
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

  async readNotif(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = req.params;
      const id_user = jwtDecode(headers.authorization).id;
      const check = await Notifications.findOne({
        id_user: new ObjectId(id_user),
      });
      if (!check) {
        return res.status(404).json({
          status: "Failed",
          message: "Notification is not found",
        });
      }
      await Notifications.updateOne(
        {
          $and: [{ _id: new ObjectId(id) }, { id_user: new ObjectId(id_user) }],
        },
        {
          $set: {
            status: "read",
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
  async deleteNotif(req, res) {
    try {
      const headers = req.headers;
      const ObjectId = mongoose.Types.ObjectId;
      const { id } = req.params;
      const id_user = jwtDecode(headers.authorization).id;
      const check = await Notifications.findOne({
        id_user: new ObjectId(id_user),
      });
      if (!check) {
        return res.status(404).json({
          status: "Failed",
          message: "Notification is not found",
        });
      }
      await Notifications.findOneAndDelete({ _id: new ObjectId(id) });
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

module.exports = new userControl();
