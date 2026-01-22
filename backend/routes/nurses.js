import express from "express";
import { query } from "../db.js";

const router = express.Router();

// GET /api/nurses
router.get("/", async (req, res) => {
  try {
    const nurses = await query(`
      SELECT UserID, Name, Surname
      FROM Users
      WHERE UserRole = 'N'
    `);

    res.json(nurses);
  } catch (err) {
    console.error("❌ Error fetching nurses:", err.message);
    res
      .status(503)
      .json({ message: "Database unavailable while fetching nurses" });
  }
});

export default router;
