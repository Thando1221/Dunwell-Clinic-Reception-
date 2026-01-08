import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sql from "mssql";
import poolPromise from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("UserName", sql.NVarChar, username)
      .query("SELECT * FROM Users WHERE UserName = @UserName");

    const user = result.recordset[0];

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const validPassword =
      user.Password === password ||
      (await bcrypt.compare(password, user.Password));

    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.UserRole?.trim() !== "R")
      return res.status(403).json({ message: "Access denied: not authorized" });

    const token = jwt.sign(
      { id: user.UserID, role: user.UserRole, name: user.Name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        surname: user.Surname,
        email: user.Email,
        role: user.UserRole?.trim(),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
