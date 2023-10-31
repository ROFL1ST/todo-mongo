const express = require("express");
const router = express.Router();
const Todo = require("../controller/todoController");
const TodoList = require("../controller/todoListController");
const userControl = require("../controller/userController");
const { jwtMiddleWare } = require("../middleware/jwt_middleware");
const { uploader } = require("../middleware/file_upload");
router.get("/", (req, res) => {
  res.json({
    status: "Ok",
    messege: "Anda Berhasil Mengakses Kami",
  });
});
// user
router.post("/register", userControl.register);
router.post("/login", userControl.login);

router.use(jwtMiddleWare);
router.put(
  "/user",
  uploader.single("photo_profile"),
  userControl.updateProfile
);
router.get("/user", userControl.searchUser);

// todo
router.get("/todo", Todo.getTodo);
router.get("/todo/:id", Todo.getDetail);
router.post("/todo", Todo.postTodo);
router.post("/todo/add/:id", Todo.addUser);
router.put("/todo/:id", Todo.updateTodo);

// todo list
router.post("/todo/createList", TodoList.postList);
router.get("/todo/list/:id", TodoList.getList);
router.put("/todo/list/:id", TodoList.updateList);
router.get("/todo/detail-list/:id", TodoList.getDetailList);
router.post(
  "/todo/post-attaches/:id",
  uploader.single("attach_url"),
  TodoList.postAttaches
);
router.post("/todo/sublist/:id", TodoList.postSubList);
router.put("/todo/sublist/:id", TodoList.updateSubList);


module.exports = router;
