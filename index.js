require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { createSocketServer, emitTodoListUpdate } = require("./socket");
const cors = require("cors");
const router = require("./routes/routes");
const app = express();
const { createServer } = require("http");
const { TodoList } = require("./models/todolistModel");
const server = createServer(app);
const port = process.env.PORT || 9000;
const uri = process.env.DB_HOST;
const dbName = process.env.DB_DATABASE;
app.use(cors());
app.use(express.json());
app.use("/api", router);
const io = createSocketServer(server);
mongoose
  .connect(uri)
  .then(() => {
    console.log("Connect");
  })
  .catch((err) => {
    console.log(err);
  });
  const watchAllList = TodoList.watch();
  watchAllList.on("change", emitTodoListUpdate);
// app.listen(port, () => {
//   console.log(`Server Berjalan di port ${port} Berhasil`);
// });

server.listen(port);