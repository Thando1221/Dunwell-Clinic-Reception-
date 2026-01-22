import express from "express";
import { query } from "../db.js";

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    // Today's date range
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // New Patients Today
    const newPatients = await query(
      `
      SELECT COUNT(*) AS count
      FROM Patients
      WHERE CreatedDate BETWEEN @p0 AND @p1
      `,
      [todayStart, todayEnd]
    );

    // Today's Appointments
    const todaysAppointments = await query(
      `
      SELECT COUNT(*) AS count
      FROM Appointments
      WHERE StartTime BETWEEN @p0 AND @p1
      `,
      [todayStart, todayEnd]
    );

    // Total Patients
    const totalPatients = await query(
      "SELECT COUNT(*) AS count FROM Patients"
    );

    // Pending Checkouts
    const pendingCheckouts = await query(
      "SELECT COUNT(*) AS count FROM Appointments WHERE Status = 'Pending'"
    );

    res.json({
      newPatientsToday: newPatients[0]?.count || 0,
      todaysAppointments: todaysAppointments[0]?.count || 0,
      totalPatients: totalPatients[0]?.count || 0,
      pendingCheckouts: pendingCheckouts[0]?.count || 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    res
      .status(503)
      .json({ message: "Database unavailable while loading dashboard stats" });
  }
});

export default router;
