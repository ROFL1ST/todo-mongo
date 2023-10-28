require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { isOnline, isOffline } = require("./controller/userController");
const cors = require("cors");
const router = require("./routes/routes");
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express();
const http = createServer(app);
const io = new Server(http);
const port = "8000";
const uri = process.env.DB_HOST;
app.use(cors());
app.use(express.json());
app.use("/api", router);

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
    isOnline(data)
  });

  socket.on("offline", (data) => {
    isOffline(data)
  });
  socket.on("disconnect", (data) => {
    console.log(data);
    console.log(`${socket.id} disconnect`);
  });
});

http.listen(port);
