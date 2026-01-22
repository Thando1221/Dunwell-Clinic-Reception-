import express from "express";
import { query } from "../db.js";

const router = express.Router();

/**
 * GET /api/bookings
 * Fetch today's appointments (joined patient & doctor)
 */
router.get("/", async (req, res) => {
  try {
    const result = await query(`
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

    res.json(result);
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
    const id = parseInt(req.params.id, 10);

    const result = await query(
      `
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
        WHERE a.AppointID = @p0
      `,
      [id]
    );

    if (!result.length) return res.status(404).json({ message: "Booking not found" });
    res.json(result[0]);
  } catch (err) {
    console.error("❌ Error fetching booking by id:", err);
    res.status(500).json({ message: "Server error fetching booking", error: err.message });
  }
});

/**
 * PUT /api/bookings/:id
 * Update booking fields
 */
router.put("/:id", async (req, res) => {
  try {
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
      "MainMember__IDNo",
    ];

    const setClauses = [];
    const params = [];

    allowed.forEach((field) => {
      if (body[field] !== undefined) {
        setClauses.push(`[${field}] = @p${params.length}`);
        let value = body[field];

        if (field === "StartTime" || field === "EndTime") value = value ? new Date(value) : null;
        if (field === "UserID" || field === "ServicePrice" || field === "FinalPrice") value = parseFloat(value);
        if (field === "IsStudent" || field === "isFollow_Up") value = value ? 1 : 0;

        params.push(value);
      }
    });

    if (setClauses.length === 0) return res.status(400).json({ message: "No updatable fields provided." });

    params.push(id); // last param for WHERE clause

    // Update query
    await query(
      `UPDATE Appointments SET ${setClauses.join(", ")} WHERE AppointID = @p${params.length - 1}`,
      params
    );

    // Return updated booking
    const updated = await query(
      `
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
        WHERE a.AppointID = @p0
      `,
      [id]
    );

    res.json({ message: "Booking updated successfully", booking: updated[0] });
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
    const id = parseInt(req.params.id, 10);

    await query("DELETE FROM Appointments WHERE AppointID = @p0", [id]);

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("❌ Delete booking error:", err);
    res.status(500).json({ message: "Failed to delete booking", error: err.message });
  }
});

export default router;
