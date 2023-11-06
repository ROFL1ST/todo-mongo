require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { isOnline, isOffline } = require("./controller/userController");
const cors = require("cors");
const router = require("./routes/routes");
const { Server } = require("socket.io");
const http = require("http");
const { sendMessage } = require("./controller/chatController");
const app = express();
const port = process.env.PORT || 9000;
const uri = process.env.DB_HOST;
const dbName = process.env.DB_DATABASE;
app.use(cors());
app.use(express.json());
app.use("/api", router);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:2000", // Replace with your front-end's URL
    methods: ["GET", "POST"],
  },
});
mongoose
  .connect(uri)
  .then(() => {
    console.log("Connect");
  })
  .catch((err) => {
    console.log(err);
  });

// app.listen(port, () => {
//   console.log(`Server Berjalan di port ${port} Berhasil`);
// });

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

  socket.on("offline", (data) => {
    isOffline(data);
  });
});
server.listen(port);
