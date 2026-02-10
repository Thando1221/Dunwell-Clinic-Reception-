import express from "express";
import { query } from "../db.js";

const router = express.Router();

/**
 * POST /api/appointments
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

    // ✅ LOCAL TIME SAFE (NO UTC SHIFT)
    const start = new Date(StartTime.replace("T", " "));
    if (isNaN(start)) {
      return res.status(400).json({
        error: "Invalid StartTime format",
        StartTime
      });
    }

    let end = null;
    if (EndTime !== null && EndTime !== undefined) {
      end = new Date(EndTime.replace("T", " "));
      if (isNaN(end)) {
        return res.status(400).json({
          error: "Invalid EndTime format",
          EndTime
        });
      }
    }

    /* -------------------------
       FETCH SERVICE PRICE
    -------------------------- */
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

    const computedFinalPrice =
      FinalPrice ??
      (IsStudent && discount > 0 ? discount : Price);

    /* -------------------------
       INSERT APPOINTMENT (MSSQL SAFE)
    -------------------------- */
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
        MedicalAidNumber ?? null,
        start,              // ✅ saved exactly as selected
        end,                // ✅ null allowed
        UserID,
        MedicalAidName ?? null,
        Status ?? "Booked",
        ServiceName,
        Price,
        MedicalAid_MainMember ?? null,
        MainMember__IDNo ?? null,
        MedicalAid_option ?? null,
        PaymentMethod,
        computedFinalPrice,
        IsStudent ?? false
      ]
    );

    res.json({ message: "Appointment created successfully" });

  } catch (err) {
    console.error("❌ Appointment Create Error:", err);
    res.status(500).json({
      error: "Server error creating appointment",
      details: err.message
    });
  }
});

export default router;
