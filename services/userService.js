const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const router = express.Router();
const DB_FILE = "./db.json";

// Helper for read and write
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Get all users
router.get("/", (req, res) => {
  const db = readDB();
  const usersWithoutPasswords = (db.users || []).map(
    ({ password, ...rest }) => rest
  );
  res.json(usersWithoutPasswords);
});

// Update user
router.put("/", (req, res) => {
  const { id, name, email, role } = req.body;
  const db = readDB();
  if (!db.users) db.users = [];

  const userIndex = db.users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users[userIndex] = {
    ...db.users[userIndex],
    name: name ?? db.users[userIndex].name,
    email: email ?? db.users[userIndex].email,
    role: role ?? db.users[userIndex].role,
  };

  writeDB(db);
  const { password, ...userWithoutPassword } = db.users[userIndex];
  res.json({ message: "User updated", user: userWithoutPassword });
});

// Delete user
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const Id = Number(id);

  const db = readDB();
  if (!db.users) db.users = [];

  const userIndex = db.users.findIndex((u) => u.id === Id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users.splice(userIndex, 1);
  writeDB(db);

  res.json({ message: "User deleted successfully" });
});

// Update User Password
router.put("/updatePassword/:id", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const db = readDB();
  if (!db.users) db.users = [];

  console.log("Ids", id,",", req.body);

  const userIndex = db.users.findIndex((u) => u.id === Number(id));
  console.log(userIndex);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 8);

  db.users[userIndex] = {
    ...db.users[userIndex],
    password: hashedPassword ?? db.users[userIndex].password,
  };

  writeDB(db);
  const { password, ...userWithoutPassword } = db.users[userIndex];
  res.json({ message: "User Password updated" });
});

module.exports = router;
