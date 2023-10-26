const express = require("express");
const router = express.Router();
const Todo = require("../controller/todoController");
const TodoList = require("../controller/todoListController")
router.get("/", (req, res) => {
  res.json({
    status: "Ok",
    messege: "Anda Berhasil Mengakses Kami",
  });
});
router.get("/todo", Todo.getTodo);
router.get("/todo/:id", Todo.getDetail);

router.post("/todo", Todo.postTodo);


// todo list
router.post("/todo/createList", TodoList.postList)
router.get("/todo/list/:id", TodoList.getList)

module.exports = router;
