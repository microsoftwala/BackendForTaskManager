const express = require("express");
const fs = require("fs");

const router = express.Router();
const DB_FILE = "./db.json";

// Helper for read and write
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient rights" });
    }
    next();
  };
}

// Create task
router.post("/", authorizeRole("user"), (req, res) => {
  const { details, project, priority, dueDate, status, userId } = req.body;
  const db = readDB();

  if (!db.tasks) db.tasks = [];

  const newTask = {
    id: Date.now().toString(),
    details,
    project,
    priority,
    dueDate,
    status: status || "todo",
    userId,
  };

  db.tasks.push(newTask);
  writeDB(db);

  res.status(201).json({ message: "Task created", task: newTask });
});

// Update task
router.put("/:id", authorizeRole("user"), (req, res) => {
  const { id } = req.params;
  const { details, project, priority, dueDate, status } = req.body;

  const db = readDB();
  if (!db.tasks) db.tasks = [];

  const taskIndex = db.tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  db.tasks[taskIndex] = {
    ...db.tasks[taskIndex],
    details: details ?? db.tasks[taskIndex].details,
    project: project ?? db.tasks[taskIndex].project,
    priority: priority ?? db.tasks[taskIndex].priority,
    dueDate: dueDate ?? db.tasks[taskIndex].dueDate,
    status: status ?? db.tasks[taskIndex].status,
  };

  writeDB(db);
  res.json({ message: "Task updated", task: db.tasks[taskIndex] });
});

// Get all tasks
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.tasks || []);
});

// Get tasks by userId
router.get("/userId/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const tasks = (db.tasks || []).filter((t) => t.userId === id);

  if (!tasks.length) {
    return res
      .status(404)
      .json({ message: "No tasks found for this user ID!" });
  }

  res.json(tasks);
});

// Get task by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const task = (db.tasks || []).find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(task);
});

module.exports = router;
