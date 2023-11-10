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
    kode: {
      type: String,
      required: true,
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

const forgotModel = mongoose.Schema({
  id_user: {
    type: ObjectId,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("users", userSchema);
const Forgot = mongoose.model("forgots", forgotModel);

module.exports = {User, Forgot};
