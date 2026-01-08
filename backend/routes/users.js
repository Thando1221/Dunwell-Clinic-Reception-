import express from "express";
import sql from "mssql";
import poolPromise from "../db.js"; // ✅ default import
const router = express.Router();

// ✅ Fetch all users (employees)
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .query("SELECT UserID, Name, Surname, Email, UserRole FROM Users");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No employees found." });
    }

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: "Server error while fetching employees." });
  }
});

// ✅ Fetch a single user by ID
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    const result = await pool
      .request()
      .input("UserID", sql.Int, id)
      .query("SELECT * FROM Users WHERE UserID = @UserID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching user by ID:", err);
    res.status(500).json({ error: "Server error while fetching user." });
  }
});

// ✅ Create new user (for registration)
router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { UserName, Password, Name, Surname, Email, ContactNo, DOB, UserRole, SANC_HPCSA } = req.body;

    if (!UserName || !Password || !Name || !Surname) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    await pool
      .request()
      .input("UserName", sql.NVarChar, UserName)
      .input("Password", sql.NVarChar, Password)
      .input("Name", sql.NVarChar, Name)
      .input("Surname", sql.NVarChar, Surname)
      .input("Email", sql.NVarChar, Email || null)
      .input("ContactNo", sql.NVarChar, ContactNo || null)
      .input("DOB", sql.NVarChar, DOB || null)
      .input("UserRole", sql.NChar(1), UserRole || "E")
      .input("SANC_HPCSA", sql.NChar(10), SANC_HPCSA || null)
      .query(`
        INSERT INTO Users (UserName, Password, Name, Surname, Email, ContactNo, DOB, UserRole, SANC_HPCSA)
        VALUES (@UserName, @Password, @Name, @Surname, @Email, @ContactNo, @DOB, @UserRole, @SANC_HPCSA)
      `);

    res.status(201).json({ message: "✅ User created successfully." });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Server error while creating user." });
  }
});

export default router;
