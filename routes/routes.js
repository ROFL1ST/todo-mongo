const express = require("express");
const router = express.Router();
const Todo = require("../controller/todoController");
const TodoList = require("../controller/todoListController");
const userControl = require("../controller/userController");
const { jwtMiddleWare } = require("../middleware/jwt_middleware");
const { uploader } = require("../middleware/file_upload");
const Chat = require("../controller/chatController");
const friendController = require("../controller/friendController");
router.get("/", (req, res) => {
  res.json({
    status: "Ok",
    messege: "Anda Berhasil Mengakses Kami",
  });
});
// user
router.post("/register", userControl.register);
router.post("/login", userControl.login);
router.get("/verify/:id", userControl.verify);
router.get("/auth", userControl.auth);
router.post("/forgot-password", userControl.forgot_password);
router.post("/resend-email", userControl.resendEmail);
router.post("/verify-password/:email", userControl.verifyForgot);
router.post("/reset-password", userControl.resetPassword);

router.use(jwtMiddleWare);
router.delete("/logout", userControl.logout);

router.put(
  "/user",
  uploader.single("photo_profile"),
  userControl.updateProfile
);
router.get("/user", userControl.searchUser);
router.get("/profile", userControl.profile);
router.get("/user/:id", userControl.detailProfile);

// friends
router.get("/friends", friendController.listFriends)
router.post("/friends/add/:id", friendController.addFriend)
router.get("/friends/request", friendController.getFriendsRequest)
router.put("/friends/request/:id", friendController.respondRequest)
router.delete("/friends/:id", friendController.removeFriends)


// todo
router.get("/todo", Todo.getTodo);
router.get("/todo/invitation", Todo.getInvitation);
router.get("/todo/:id", Todo.getDetail);
router.delete("/todo/:id", Todo.deleteTodo);
router.post("/todo", Todo.postTodo);
router.post("/todo/add/:id", Todo.inviteUser);
router.put("/todo/invitation/:id", Todo.invitationRespond);
router.delete("/todo/invitation/:id", Todo.DeleteInvitation);
router.delete("/todo/kick/:id", Todo.kickUser);
router.put("/todo/:id", Todo.updateTodo);
router.put("/todo/role/:id", Todo.updateRole);

// notes : hanya owner yang bisa delete todo

// todo list
router.post("/todos/createList", TodoList.postList);
router.get("/todos/list", TodoList.getAllList);
router.get("/todos/list/:id", TodoList.getList);
router.put("/todos/list/:id", TodoList.updateList);
router.get("/todos/detail-list/:id", TodoList.getDetailList);
router.post(
  "/todos/post-attaches/:id",
  uploader.single("attach_url"),
  TodoList.postAttaches
);
router.get("/todos/attaches/:id", TodoList.getAttaches);
router.delete("/todos/attaches/:id", TodoList.deleteAttaches);

router.post("/todos/sublist/:id", TodoList.postSubList);
router.put("/todos/sublist/:id", TodoList.updateSubList);
router.delete("/todos/remove-list/:id", TodoList.deleteList);
router.delete("/todos/remove-sub/:id", TodoList.deleteSub);

// group chat
router.get("/groupchat/:id", Chat.getRoom);
router.get("/chat/:room_code", Chat.getMessageList);
router.delete("/chat/:id", Chat.deleteMessage);

module.exports = router;
