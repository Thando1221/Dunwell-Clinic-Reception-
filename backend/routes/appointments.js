// routes/appointments.js
import express from "express";
import { query } from "../db.js";

const router = express.Router();

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post("/", async (req, res) => {
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

  // Validate required fields
  if (!PatientID || !StartTime || !EndTime || !UserID || !ServiceName || !Status || !PaymentMethod) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  // Validate dates
  const safeDate = (d) => {
    if (!d || d === "") return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const startTime = safeDate(StartTime);
  const endTime = safeDate(EndTime);

  if (!startTime || !endTime) {
    return res.status(400).json({ message: "Invalid StartTime or EndTime" });
  }

  try {
    // Fetch service price and discount
    const serviceResult = await query(
      `SELECT Price, discount FROM Catalogue WHERE Name = @p0`,
      [ServiceName]
    );

    if (!serviceResult.length) {
      return res.status(400).json({ message: "Service not found" });
    }

    const { Price, discount } = serviceResult[0];
    const computedFinalPrice = FinalPrice ?? (IsStudent && discount > 0 ? discount : Price);

    // Insert appointment
    await query(
      `INSERT INTO Appointments
        (PatientID, MedicalAidNumber, StartTime, EndTime, UserID, MedicalAidName,
         Status, ServiceName, ServicePrice, MedicalAid_MainMember, MainMember__IDNo,
         MedicalAid_option, PaymentMethod, FinalPrice, IsStudent)
       VALUES
        (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14)`,
      [
        PatientID,
        MedicalAidNumber || null,
        startTime,
        endTime,
        UserID,
        MedicalAidName || null,
        Status,
        ServiceName,
        Price,
        MedicalAid_MainMember || null,
        MainMember__IDNo || null,
        MedicalAid_option || null,
        PaymentMethod,
        computedFinalPrice,
        IsStudent ? 1 : 0
      ]
    );

    res.json({ message: "Appointment created successfully" });
  } catch (err) {
    console.error("❌ Appointment Create Error:", err);
    res.status(500).json({ message: "Failed to create appointment", error: err.message });
  }
});

export default router;
