const { Server } = require("socket.io");
const { isOnline, isOffline } = require("./controller/userController");
const { sendMessage } = require("./controller/chatController");
const { TodoList } = require("./models/todolistModel");
const { default: mongoose } = require("mongoose");

const createSocketServer = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
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
    const watchAllList = TodoList.watch();
    watchAllList.on("change", async (change) => {
      try {
        const ObjectId = mongoose.Types.ObjectId;

        const updatedTodoList = await TodoList.aggregate([
          { $match: { _id: new ObjectId(change.documentKey._id) } },
        ]);
        socket.emit("todoListUpdated", { todoList: updatedTodoList });
        console.log("TodoList updated:", updatedTodoList);
      } catch (error) {
        console.log(error);
      }
    });
    socket.on("offline", (data) => {
      isOffline(data);
    });
  });

  return io;
};

module.exports = { createSocketServer };
