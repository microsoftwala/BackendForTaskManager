require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

const DB_FILE = "./db.json";

// Helpers to read and write
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Signup
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  const db = readDB();
  const role = "user";
  const existingUser = db.users.find((u) => u.email === email);

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);
  const newUser = {
    id: Date.now(),
    name,
    email,
    role,
    password: hashedPassword,
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    message: "Signup successful",
    user: { id: newUser.id, name, email },
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
    expiresIn: "1h",
  });

  res.json({
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = router;
