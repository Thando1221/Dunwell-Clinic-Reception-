// routes/appointments.js
import express from "express";
import { query } from "../db.js";

const router = express.Router();

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post("/", async (req, res) => {
  try {
    const {
      PatientID,
      StartTime,
      EndTime,
      UserID,
      ServiceName,
      PaymentMethod,
      IsStudent,
      Status,
      MedicalAidNumber,
      MedicalAidName,
      MedicalAid_MainMember,
      MainMember__IDNo,
      MedicalAid_option,
      FinalPrice
    } = req.body;

    // Get service price and discount
    const serviceResult = await query(
      `SELECT Price, discount FROM Catalogue WHERE Name = @p0`,
      [ServiceName]
    );

    if (!serviceResult.length) return res.status(400).json({ message: "Service not found" });

    const { Price, discount } = serviceResult[0];
    const computedFinalPrice = FinalPrice ?? (IsStudent && discount > 0 ? discount : Price);

    await query(
      `INSERT INTO Appointments (
        PatientID,
        MedicalAidNumber,
        StartTime,
        EndTime,
        UserID,
        MedicalAidName,
        Status,
        ServiceName,
        ServicePrice,
        MedicalAid_MainMember,
        MainMember__IDNo,
        MedicalAid_option,
        PaymentMethod,
        FinalPrice,
        IsStudent
      ) VALUES (
        @p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14
      )`,
      [
        PatientID,
        MedicalAidNumber,
        StartTime,
        EndTime,
        UserID,
        MedicalAidName,
        Status,
        ServiceName,
        Price,
        MedicalAid_MainMember,
        MainMember__IDNo,
        MedicalAid_option,
        PaymentMethod,
        computedFinalPrice,
        IsStudent ? 1 : 0
      ]
    );

    res.json({ message: "Appointment created successfully" });
  } catch (err) {
    console.error("❌ Appointment Create Error:", err);
    res.status(500).json({ message: "Server error creating appointment", error: err.message });
  }
});

/**
 * GET /api/appointments
 * Fetch today's appointments (joined with patient & doctor)
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
    console.error("❌ Error fetching appointments:", err);
    res.status(500).json({ message: "Server error fetching appointments", error: err.message });
  }
});

/**
 * GET /api/appointments/:id
 * Fetch single appointment
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

    if (!result.length) return res.status(404).json({ message: "Appointment not found" });
    res.json(result[0]);
  } catch (err) {
    console.error("❌ Error fetching appointment:", err);
    res.status(500).json({ message: "Server error fetching appointment", error: err.message });
  }
});

/**
 * PUT /api/appointments/:id
 * Update appointment fields
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
      "PatientID"
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

    if (!setClauses.length) return res.status(400).json({ message: "No updatable fields provided." });

    params.push(id);

    await query(`UPDATE Appointments SET ${setClauses.join(", ")} WHERE AppointID = @p${params.length - 1}`, params);

    // Return updated appointment
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

    res.json({ message: "Appointment updated successfully", appointment: updated[0] });
  } catch (err) {
    console.error("❌ Update appointment error:", err);
    res.status(500).json({ message: "Failed to update appointment", error: err.message });
  }
});

/**
 * DELETE /api/appointments/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query("DELETE FROM Appointments WHERE AppointID = @p0", [id]);
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("❌ Delete appointment error:", err);
    res.status(500).json({ message: "Failed to delete appointment", error: err.message });
  }
});

export default router;
