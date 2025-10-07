require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./services/authService");
const taskRoutes = require("./services/taskService");
const userRoutes = require("./services/userService");
const jwt = require("jsonwebtoken");
const authenticateToken = require("./middleware/authMiddleware");


const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: "http://localhost:4200",
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
