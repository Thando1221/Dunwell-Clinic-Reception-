import express from "express";
import poolPromise from "../db.js"; // your existing mssql poolPromise
import sql from "mssql";

const router = express.Router();

/**
 * GET /api/bookings
 * Fetch today's appointments (joined patient & doctor)
 */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        a.AppointID AS id,
        p.PatientName + ' ' + p.PatientSurname AS patientName,
        a.PatientID,
        a.MedicalAidNumber,
        a.StartTime,
        a.EndTime,
        a.UserID,
        a.MedicalAidName,
        a.Status,
        a.ServiceName,
        a.ServicePrice,
        a.FinalPrice,
        a.MedicalAid_MainMember,
        a.MainMember__IDNo,
        a.MedicalAid_option,
        a.PaymentMethod,
        a.IsStudent,
        a.isFollow_Up,
        u.Name + ' ' + u.Surname AS doctorName
      FROM Appointments a
      LEFT JOIN Patients p ON a.PatientID = p.PatientID
      LEFT JOIN Users u ON a.UserID = u.UserID
      WHERE CAST(a.StartTime AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY a.StartTime ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ message: "Server error while fetching today's bookings", error: err.message });
  }
});

/**
 * GET /api/bookings/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          a.AppointID AS id,
          p.PatientName + ' ' + p.PatientSurname AS patientName,
          a.PatientID,
          a.MedicalAidNumber,
          a.StartTime,
          a.EndTime,
          a.UserID,
          a.MedicalAidName,
          a.Status,
          a.ServiceName,
          a.ServicePrice,
          a.FinalPrice,
          a.MedicalAid_MainMember,
          a.MainMember__IDNo,
          a.MedicalAid_option,
          a.PaymentMethod,
          a.IsStudent,
          a.isFollow_Up,
          u.Name + ' ' + u.Surname AS doctorName
        FROM Appointments a
        LEFT JOIN Patients p ON a.PatientID = p.PatientID
        LEFT JOIN Users u ON a.UserID = u.UserID
        WHERE a.AppointID = @id
      `);

    if (!result.recordset.length) return res.status(404).json({ message: "Booking not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching booking by id:", err);
    res.status(500).json({ message: "Server error fetching booking", error: err.message });
  }
});

/**
 * PUT /api/bookings/:id
 * Update booking fields (everything except PatientID / patient name)
 */
router.put("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);
    const body = req.body || {};

    const allowed = [
      "StartTime",
      "EndTime",
      "UserID",
      "MedicalAidName",
      "MedicalAidNumber",
      "MedicalAid_option",
      "PaymentMethod",
      "Status",
      "ServiceName",
      "ServicePrice",
      "FinalPrice",
      "isFollow_Up",
      "IsStudent",
      "MedicalAid_MainMember",
      "MainMember__IDNo"
    ];

    const setClauses = [];
    const request = pool.request();
    request.input("id", sql.Int, id);

    allowed.forEach((field) => {
      if (body[field] !== undefined) {
        setClauses.push(`[${field}] = @${field}`);
        // handle datetime fields explicitly
        if (field === "StartTime" || field === "EndTime") {
          request.input(field, sql.DateTime2, body[field] ? new Date(body[field]) : null);
        } else if (field === "UserID" || field === "ServicePrice" || field === "FinalPrice") {
          request.input(field, sql.Float, body[field]);
        } else if (field === "IsStudent" || field === "isFollow_Up") {
          request.input(field, sql.Bit, body[field]);
        } else {
          request.input(field, sql.NVarChar, body[field]);
        }
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ message: "No updatable fields provided." });
    }

    const updateQuery = `
      UPDATE Appointments
      SET ${setClauses.join(", ")}
      WHERE AppointID = @id
    `;

    await request.query(updateQuery);

    // Return updated booking
    const updated = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          a.AppointID AS id,
          p.PatientName + ' ' + p.PatientSurname AS patientName,
          a.PatientID,
          a.MedicalAidNumber,
          a.StartTime,
          a.EndTime,
          a.UserID,
          a.MedicalAidName,
          a.Status,
          a.ServiceName,
          a.ServicePrice,
          a.FinalPrice,
          a.MedicalAid_MainMember,
          a.MainMember__IDNo,
          a.MedicalAid_option,
          a.PaymentMethod,
          a.IsStudent,
          a.isFollow_Up,
          u.Name + ' ' + u.Surname AS doctorName
        FROM Appointments a
        LEFT JOIN Patients p ON a.PatientID = p.PatientID
        LEFT JOIN Users u ON a.UserID = u.UserID
        WHERE a.AppointID = @id
      `);

    res.json({ message: "Booking updated successfully", booking: updated.recordset[0] });
  } catch (err) {
    console.error("❌ Update booking error:", err);
    res.status(500).json({ message: "Failed to update booking", error: err.message });
  }
});

/**
 * DELETE /api/bookings/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);

    await pool.request().input("id", sql.Int, id).query("DELETE FROM Appointments WHERE AppointID = @id");

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("❌ Delete booking error:", err);
    res.status(500).json({ message: "Failed to delete booking", error: err.message });
  }
});

export default router;
