require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const {
  createSocketServer,
  emitTodoListUpdate,
  emitNotifUpdate,
} = require("./socket");
const admin = require("firebase-admin");
const serviceAccount = require("./service/todo-da3ef-firebase-adminsdk-ynx4w-86c0938daf.json");
const cors = require("cors");
const router = require("./routes/routes");
const app = express();
const { createServer } = require("http");
const { TodoList } = require("./models/todolistModel");
var useragent = require("express-useragent");
const { Notifications } = require("./models/userModel");
const server = createServer(app);
const port = process.env.PORT || 9000;
const uri = process.env.DB_HOST;
const dbName = process.env.DB_DATABASE;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
app.use(useragent.express());
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
const connection = mongoose.connection;

connection.once("open", () => {
  // todo list
  const watchAllList = TodoList.watch();
  watchAllList.on("change", emitTodoListUpdate);

  // notification
  const watchNotif = Notifications.watch();
  watchNotif.on("change", async (change) => {
    const ObjectId = mongoose.Types.ObjectId;
    switch (change.operationType) {
      case "insert":
        const newNotif = await Notifications.aggregate([
          { $match: { _id: new ObjectId(change.documentKey._id) } },
          {
            $lookup: {
              from: "users",
              localField: "from",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $unwind: "$userDetails",
          },
          {
            $addFields: {
              userDetails: 0,
              username: "$userDetails.username",
              photo_profile: "$userDetails.photo_profile",
              default_color: "$userDetails.default_color",
            },
          },
        ]);
        console.log(newNotif[0].title);
        const payload = {
          notification: {
            title: "something's new",
            body: newNotif[0].title,
          },
          data: {
            type: newNotif[0].type, // Add the 'type' property
            id_user: newNotif[0].id_user.toString(), // Add the 'id_user' property (convert to string if necessary)
            title:
              newNotif[0].type == "invitation"
                ? "You've been invited"
                : newNotif[0].type == "message"
                ? "New Message"
                : "Something's New",
            body: newNotif[0].title,
          },
        };
        try {
          await admin.messaging().sendToTopic("notif", payload);
          console.log("FCM notification sent successfully");
        } catch (error) {
          console.error("Error sending FCM notification:", error);
        }
        break;
    }
  });
});








// app.listen(port, () => {
//   console.log(`Server Berjalan di port ${port} Berhasil`);
// });

server.listen(port);
