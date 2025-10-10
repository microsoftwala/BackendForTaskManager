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

// ✅ CORS setup
const corsOptions = {
  origin: [
    "http://localhost:4200",
    "https://frontend-for-task-manager-hwj3.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/tasks", authenticateToken, taskRoutes);
app.use("/users", authenticateToken, userRoutes);

// base route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Activity routes
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
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };

    db.activities.push(activity);
    writeDB(db);

    res.json({ message: "Activity logged", activity });
  } catch (err) {
    console.error("Error logging activity:", err);
    res.status(500).json({ message: "Error logging activity" });
  }
});

app.get("/activity", (req, res) => {
  try {
    const db = readDB();
    const activities = db.activities || [];

    const { userId, limit } = req.query;
    let result = activities;

    if (userId) {
      result = result.filter((a) => a.userId === userId);
    }

    result = result.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const max = limit ? parseInt(limit) : 10;
    result = result.slice(0, max);

    res.json(result);
  } catch (err) {
    console.error("Error reading activities:", err);
    res.status(500).json({ message: "Error reading activities" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
