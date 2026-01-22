import express from "express";
import { query } from "../db.js";

const router = express.Router();

/**
 * POST /api/appointments
 * Create appointment
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

    // Fetch service price & discount
    const priceResult = await query(
      `SELECT Price, discount
       FROM Catalogue
       WHERE Name = @p0`,
      [ServiceName]
    );

    if (!priceResult.length) {
      return res.status(400).json({ error: "Service not found" });
    }

    const { Price, discount } = priceResult[0];
    const computedFinalPrice = FinalPrice ?? (IsStudent && discount > 0 ? discount : Price);

    // Insert appointment
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
        @p0,@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,@p11,@p12,@p13,@p14
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
        IsStudent
      ]
    );

    res.json({ message: "Appointment created successfully" });
  } catch (err) {
    console.error("❌ Appointment Create Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * GET /api/appointments/latest-medical-aid/:patientId
 */
router.get("/latest-medical-aid/:patientId", async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);
    if (isNaN(patientId)) return res.status(400).json({ message: "Invalid PatientID" });

    const result = await query(
      `SELECT TOP 1
         ISNULL(MedicalAidNumber, '') AS MedicalAidNumber,
         ISNULL(MedicalAidName, '') AS MedicalAidName,
         ISNULL(MedicalAid_MainMember, '') AS MedicalAid_MainMember,
         ISNULL(MainMember__IDNo, '') AS MainMember__IDNo,
         ISNULL(MedicalAid_option, '') AS MedicalAid_option
       FROM Appointments
       WHERE PatientID = @p0
         AND LTRIM(RTRIM(MedicalAidName)) <> ''
       ORDER BY StartTime DESC`,
      [patientId]
    );

    res.json(result[0] || null);
  } catch (err) {
    console.error("❌ Fetch latest medical aid error:", err);
    res.status(500).json({ error: "Failed to fetch medical aid details", details: err.message });
  }
});

/**
 * GET /api/appointments/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const result = await query(
      `SELECT 
         a.AppointID AS id,
         a.PatientID,
         p.PatientName,
         p.PatientSurname,
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
         u.Name AS UserName,
         u.Surname AS UserSurname
       FROM Appointments a
       LEFT JOIN Patients p ON a.PatientID = p.PatientID
       LEFT JOIN Users u ON a.UserID = u.UserID
       WHERE a.AppointID = @p0`,
      [id]
    );

    if (!result.length) return res.status(404).json({ message: "Appointment not found" });

    res.json(result[0]);
  } catch (err) {
    console.error("❌ Error fetching appointment by id:", err);
    res.status(500).json({ error: "Server error fetching appointment", details: err.message });
  }
});

/**
 * PUT /api/appointments/:id
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

    const updates = [];
    const params = [];

    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates.push(`[${field}] = @p${params.length}`);
        params.push(body[field]);
      }
    });

    if (!updates.length) return res.status(400).json({ message: "No updatable fields provided." });

    params.push(id); // last param is id

    await query(
      `UPDATE Appointments
       SET ${updates.join(", ")}
       WHERE AppointID = @p${params.length - 1}`,
      params
    );

    res.json({ message: "Appointment updated successfully" });
  } catch (err) {
    console.error("❌ Update appointment error:", err);
    res.status(500).json({ error: "Failed to update appointment", details: err.message });
  }
});

/**
 * DELETE /api/appointments/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    await query(
      `DELETE FROM Appointments WHERE AppointID = @p0`,
      [id]
    );

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("❌ Delete appointment error:", err);
    res.status(500).json({ error: "Failed to delete appointment", details: err.message });
  }
});

export default router;
