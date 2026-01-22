import express from "express";
import { query } from "../db.js";

const router = express.Router();

// ✅ Fetch all users (employees)
router.get("/", async (req, res) => {
  try {
    const users = await query(
      "SELECT UserID, Name, Surname, Email, UserRole FROM Users"
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "No employees found." });
    }

    res.status(200).json(users);
  } catch (err) {
    console.error("❌ Error fetching employees:", err.message);
    res
      .status(503)
      .json({ error: "Database unavailable while fetching employees." });
  }
});

// ✅ Fetch a single user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const users = await query(
      "SELECT * FROM Users WHERE UserID = @p0",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(users[0]);
  } catch (err) {
    console.error("❌ Error fetching user by ID:", err.message);
    res
      .status(503)
      .json({ error: "Database unavailable while fetching user." });
  }
});

// ✅ Create new user (registration)
router.post("/", async (req, res) => {
  try {
    const {
      UserName,
      Password,
      Name,
      Surname,
      Email,
      ContactNo,
      DOB,
      UserRole,
      SANC_HPCSA,
    } = req.body;

    if (!UserName || !Password || !Name || !Surname) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    await query(
      `
      INSERT INTO Users 
      (UserName, Password, Name, Surname, Email, ContactNo, DOB, UserRole, SANC_HPCSA)
      VALUES 
      (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)
      `,
      [
        UserName,
        Password, // ⚠️ should be hashed later
        Name,
        Surname,
        Email || null,
        ContactNo || null,
        DOB || null,
        UserRole || "E",
        SANC_HPCSA || null,
      ]
    );

    res.status(201).json({ message: "✅ User created successfully." });
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    res
      .status(503)
      .json({ error: "Database unavailable while creating user." });
  }
});

export default router;
