import express from "express";
import poolPromise from "../db.js";

const router = express.Router();

// ✅ GET all users (employees)
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT 
          UserID, 
          UserName, 
          Name, 
          Surname, 
          Email, 
          ContactNo, 
          DOB, 
          UserRole, 
          SANC_HPCSA
        FROM Users
        ORDER BY Name ASC
      `);

    // Even if empty, return an array
    res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Database error while fetching users" });
  }
});

export default router;
