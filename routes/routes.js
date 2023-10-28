const express = require("express");
const router = express.Router();
const Todo = require("../controller/todoController");
const TodoList = require("../controller/todoListController");
const userControl = require("../controller/userController");
const { jwtMiddleWare } = require("../middleware/jwt_middleware");
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
// todo
router.get("/todo", Todo.getTodo);
router.get("/todo/:id", Todo.getDetail);
router.post("/todo", Todo.postTodo);
router.post("/todo/add/:id", Todo.addUser);
router.put("/todo/:id", Todo.updateTodo);

// todo list
router.post("/todo/createList", TodoList.postList);
router.get("/todo/list/:id", TodoList.getList);

module.exports = router;
