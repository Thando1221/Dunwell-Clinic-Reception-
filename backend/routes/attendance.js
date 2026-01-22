import express from "express";
import { query } from "../db.js";

const router = express.Router();

/**
 * GET /api/attendance/today
 * Fetch today's attendance
 */
router.get("/today", async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.Name, 
        u.Surname, 
        r.TimeIn, 
        r.TimeOut, 
        r.OnLeave,
        r.remark_OnArrival
      FROM Register r
      INNER JOIN Users u ON r.UserID = u.UserID
      WHERE r.Date = CAST(GETDATE() AS DATE)
    `);
    res.json(result);
  } catch (err) {
    console.error("❌ Fetch Attendance Error:", err);
    res.status(500).json({ error: "Database error fetching attendance", details: err.message });
  }
});

/**
 * POST /api/attendance/clock-in
 */
router.post("/clock-in", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    // Check if already clocked in or on leave today
    const existing = await query(
      `SELECT * FROM Register WHERE UserID = @p0 AND Date = CAST(GETDATE() AS DATE)`,
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Already clocked in or marked on leave today." });
    }

    // Current time and remarks
    const now = new Date();
    const nineAM = new Date(now);
    nineAM.setHours(9, 0, 0, 0);
    const nineThirty = new Date(now);
    nineThirty.setHours(9, 30, 0, 0);

    let remark;
    if (now < nineAM) {
      return res.status(400).json({ error: "Please clock in at 09:00." });
    } else if (now >= nineAM && now <= nineThirty) {
      remark = "Arrived on time";
    } else {
      remark = "Late";
    }

    await query(
      `INSERT INTO Register (UserID, Date, TimeIn, OnLeave, remark_OnArrival)
       VALUES (@p0, CAST(GETDATE() AS DATE), CONVERT(time, GETDATE()), 'No', @p1)`,
      [userId, remark]
    );

    res.json({ message: `Clocked in successfully (${remark})` });
  } catch (err) {
    console.error("❌ Clock In Error:", err);
    res.status(500).json({ error: "Database error during clock in", details: err.message });
  }
});

/**
 * POST /api/attendance/clock-out
 */
router.post("/clock-out", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    // Fetch today's record
    const existing = await query(
      `SELECT * FROM Register WHERE UserID = @p0 AND Date = CAST(GETDATE() AS DATE)`,
      [userId]
    );

    if (!existing.length) {
      return res.status(400).json({ error: "You haven't clocked in today." });
    }

    const record = existing[0];
    if (record.TimeOut) {
      return res.status(400).json({ error: "Already clocked out today." });
    }

    await query(
      `UPDATE Register 
       SET TimeOut = CONVERT(time, GETDATE()), 
           HoursWorked = DATEDIFF(HOUR, TimeIn, CONVERT(time, GETDATE()))
       WHERE UserID = @p0 AND Date = CAST(GETDATE() AS DATE)`,
      [userId]
    );

    res.json({ message: "Clocked out successfully." });
  } catch (err) {
    console.error("❌ Clock Out Error:", err);
    res.status(500).json({ error: "Database error during clock out", details: err.message });
  }
});

/**
 * POST /api/attendance/on-leave
 */
router.post("/on-leave", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    // Check if already clocked in/out/on leave today
    const existing = await query(
      `SELECT * FROM Register WHERE UserID = @p0 AND Date = CAST(GETDATE() AS DATE)`,
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Attendance already recorded today." });
    }

    await query(
      `INSERT INTO Register (UserID, Date, TimeIn, TimeOut, OnLeave, remark_OnArrival, HoursWorked)
       VALUES (@p0, CAST(GETDATE() AS DATE), '00:00:00', '00:00:00', 'Yes', 'On leave', 0)`,
      [userId]
    );

    res.json({ message: "Employee marked as on leave for today." });
  } catch (err) {
    console.error("❌ On Leave Error:", err);
    res.status(500).json({ error: "Database error setting leave", details: err.message });
  }
});

export default router;
