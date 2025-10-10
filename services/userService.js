const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
// const { authorizeRole } = require("../middleware/authMiddleware");

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

// Get all users
router.get("/", authorizeRole("admin"), (req, res) => {
  try {
    const db = readDB();
    const usersWithoutPasswords = (db.users || []).map(
      ({ password, ...rest }) => rest
    );
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.log("Error in Reading in users:", error);
  }
});

// Update user
router.put("/", (req, res) => {
  try {
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
  } catch (error) {
    console.log("Error in updating user:", error);
  }
});

// Delete user
router.delete("/:id",authorizeRole('admin'), (req, res) => {
  try {
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
  } catch (error) {
    console.log("Error in user delete:", error);
  }
});

// Update User Password
router.put("/updatePassword/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const db = readDB();
    if (!db.users) db.users = [];

    console.log("Ids", id, ",", req.body);

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
  } catch (error) {
    console.log("Error in UpdatePassword:", error);
  }
});

// router.post("/activity", (req, res) => {
//   try {
//     const { userId, action, entity, entityId, details } = req.body;
//     console.log("India", userId);
//     const db = readDB();

//     if (!db.activities) {
//       db.activities = [];
//     }

//     // Create new activity
//     const activity = {
//       id: Date.now(),
//       userId,
//       entityId, // e.g. task id
//       details, // e.g. "Task 'Finish report' created"
//       timestamp: new Date().toISOString(),
//     };

//     // Push into activities
//     db.activities.push(activity);

//     // Write back to file
//     writeDB(db);

//     res.json({ message: "Activity logged", activity });
//   } catch (err) {
//     console.error("Error logging activity:", err);
//   }
// });

router.get("/activity", (req, res) => {
  try {
    const db = readDB();

    // Ensure activities array exists
    const activities = db.activities || [];

    // Optional: filter by userId if query param is provided
    const { userId, limit } = req.query;
    let result = activities;

    if (userId) {
      result = result.filter((a) => a.userId === userId);
    }

    // Sort by timestamp (newest first)
    result = result.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit results (default 10)
    const max = limit ? parseInt(limit) : 10;
    result = result.slice(0, max);

    res.json(result);
  } catch (err) {
    console.error("Error reading activities:", err);
  }
});

module.exports = router;
