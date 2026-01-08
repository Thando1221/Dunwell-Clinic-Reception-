import express from "express";
import sql from "mssql";
import poolPromise from "../db.js";

const router = express.Router();

// GET /api/nurses
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, Name, Surname 
      FROM Users 
      WHERE UserRole = 'N'
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching nurses:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
