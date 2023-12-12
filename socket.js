const { Server } = require("socket.io");
const { isOnline, isOffline } = require("./controller/userController");
const { sendMessage } = require("./controller/chatController");
const { TodoList } = require("./models/todolistModel");
const { default: mongoose } = require("mongoose");
const { Notifications } = require("./models/userModel");
let io;
const createSocketServer = (server) => {
  io = new Server(server);

  io.of("/api/socket").on("connection", (socket) => {
    console.log(`${socket.id} join`);
    socket.on("online", (data) => {
      isOnline(data);
    });
    socket.on("joined_room", (data) => {
      console.log(data);
      socket.join(data.room_code);
    });
    socket.on("send_message", (data) => {
      socket.to(data.room_code).emit("receive_message", data);
      sendMessage(data);
    });
    // socket.on("received_message", (data) => {
    //   console.log("diterima", data);
    // });

    socket.on("offline", (data) => {
      isOffline(data);
    });
  });

  return io;
};

const emitTodoListUpdate = async (change) => {
  const ObjectId = mongoose.Types.ObjectId;
  console.log(change.operationType);
  switch (change.operationType) {
    case "insert":
      const newTodoList = await TodoList.aggregate([
        { $match: { _id: new ObjectId(change.documentKey._id) } },
      ]);
      io.of("/api/socket").emit("todoListNew", newTodoList);
      break;
    case "update":
      const updatedTodoListUpdate = await TodoList.aggregate([
        { $match: { _id: new ObjectId(change.documentKey._id) } },
      ]);
      io.of("/api/socket").emit("todoListUpdated", updatedTodoListUpdate);
      break;
    case "delete":
      io.of("/api/socket").emit("todoListDeleted", change.documentKey._id);
      break;
  }
};

const emitNotifUpdate = async (change) => {
  const ObjectId = mongoose.Types.ObjectId;
  switch (change.operationType) {
    case "insert":
      const newNotif = await Notifications.findOne({
        _id: new ObjectId(change.documentKey._id),
      });
      io.of("/api/socket").emit("notificationsNew", newNotif);
      break;
    case "update":
      const updatedNotif = await Notifications.aggregate([
        { $match: { _id: new ObjectId(change.documentKey._id) } },
      ]);
      io.of("/api/socket").emit("notificationsUpdate", updatedNotif);
      break;
    case "delete":
      io.of("/api/socket").emit("notificationsDown", change.documentKey._id);
      break;
  }
};

module.exports = { createSocketServer, emitTodoListUpdate, emitNotifUpdate };
