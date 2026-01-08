import express from "express";
import sql from "mssql";
import poolPromise from "../db.js";

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Query: New Patients Today
    const newPatientsResult = await pool
      .request()
      .input("startDate", sql.DateTime, todayStart)
      .input("endDate", sql.DateTime, todayEnd)
      .query(
        "SELECT COUNT(*) AS count FROM Patients WHERE CreatedDate BETWEEN @startDate AND @endDate"
      );

    // Query: Today's Appointments
    const todaysAppointmentsResult = await pool
      .request()
      .input("startDate", sql.DateTime, todayStart)
      .input("endDate", sql.DateTime, todayEnd)
      .query(
        "SELECT COUNT(*) AS count FROM Appointments WHERE StartTime BETWEEN @startDate AND @endDate"
      );

    // Query: Total Patients
    const totalPatientsResult = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM Patients");

    // Query: Pending Checkouts (assuming Status = 'Pending')
    const pendingCheckoutsResult = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM Appointments WHERE Status = 'Pending'");

    res.json({
      newPatientsToday: newPatientsResult.recordset[0].count,
      todaysAppointments: todaysAppointmentsResult.recordset[0].count,
      totalPatients: totalPatientsResult.recordset[0].count,
      pendingCheckouts: pendingCheckoutsResult.recordset[0].count,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
