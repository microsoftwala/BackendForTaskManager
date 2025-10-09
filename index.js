require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./services/authService");
const taskRoutes = require("./services/taskService");
const userRoutes = require("./services/userService");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const authenticateToken = require("./middleware/authMiddleware");


const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = "./db.json";

// Helper for read and write
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const corsOptions = {
  origin: ["http://localhost:4200","https://frontend-for-task-manager-hwj3.vercel.app"],
  optionsSuccessStatus: 204,
  methods: "GET, POST, PUT, DELETE",
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/tasks", authenticateToken, taskRoutes);
app.use("/users", authenticateToken, userRoutes);

// base route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});


app.post("/activity", (req, res) => {
  try {
    const { userId, action, entity, entityId, details } = req.body;
    console.log("India:", details);
    const db = readDB();

    if (!db.activities) {
      db.activities = [];
    }

    // Create new activity
    const activity = {
      id: Date.now(),
      userId,
      entityId, // e.g. task id
      details, // e.g. "Task 'Finish report' created"
      timestamp: new Date().toISOString(),
    };

    // Push into activities
    db.activities.push(activity);

    // Write back to file
    writeDB(db);

    res.json({ message: "Activity logged", activity });
  } catch (err) {
    console.error("Error logging activity:", err);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
