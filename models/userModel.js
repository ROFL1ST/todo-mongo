const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter your username"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      min: [8, "Minimum 8 characters"],
    },
    email: {
      type: String,
      required: [true, "Please enter your fullname"],
    },
    name: {
      type: String,
      required: [true, "Please enter your fullname"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
      default: null,
    },

    photo_profile: {
      type: String,
      default: null,
    },
    public_id: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
  },
  {
    timestamps: true,
  }
);

const verifyModel = mongoose.Schema({
  id_user: {
    type: ObjectId,
    ref: "users",
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});
const forgotModel = mongoose.Schema({
  id_user: {
    type: ObjectId,
    ref: "users",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  dateExpired: {
    type: Date,
    required: true,
  },
});

const historyModel = mongoose.Schema({
  id_user: {
    type: ObjectId,
    ref: "users",
    required: true,
  },
  user_agent: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  loginAt: {
    type: Date,
    default: null,
  },
  logoutAt: {
    type: Date,
    default: null,
  },
});

const User = mongoose.model("users", userSchema);
const Forgot = mongoose.model("forgots", forgotModel);
const Verify = mongoose.model("veryfies", verifyModel);
const History = mongoose.model("histories", historyModel)

module.exports = { User, Forgot, Verify, History };
