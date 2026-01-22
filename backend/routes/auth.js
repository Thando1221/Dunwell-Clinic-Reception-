import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password required" });
  }

  try {
    const users = await query(
      "SELECT * FROM Users WHERE UserName = @p0",
      [username]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword =
      user.Password === password ||
      (await bcrypt.compare(password, user.Password));

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.UserRole?.trim() !== "R") {
      return res
        .status(403)
        .json({ message: "Access denied: not authorized" });
    }

    const token = jwt.sign(
      {
        id: user.UserID,
        role: user.UserRole?.trim(),
        name: user.Name,
      },
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
    console.error("Login error:", err.message);
    res.status(503).json({
      message: "Database unavailable",
    });
  }
});

export default router;
