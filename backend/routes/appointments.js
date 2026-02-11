import express from "express";
import sql from "mssql";
import poolPromise from "../db.js";

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

    // ===============================
    // BASIC VALIDATION
    // ===============================
    if (!PatientID || !StartTime || !UserID || !ServiceName) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const pool = await poolPromise;

    // ===============================
    // GET SERVICE PRICE
    // ===============================
    const priceResult = await pool
      .request()
      .input("ServiceName", sql.NVarChar(50), ServiceName)
      .query(`
        SELECT Price, discount
        FROM Catalogue
        WHERE Name = @ServiceName
      `);

    if (!priceResult.recordset.length) {
      return res.status(400).json({ error: "Service not found" });
    }

    const { Price, discount } = priceResult.recordset[0];

    const computedFinalPrice =
      FinalPrice ??
      (IsStudent && discount && discount > 0 ? discount : Price);

    // ===============================
    // SAFE DATE CONVERSION (FIXED)
    // ===============================
    const startDate = new Date(StartTime);
    const endDate = EndTime ? new Date(EndTime) : null;

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: "Invalid StartTime format"
      });
    }

    // ===============================
    // INSERT APPOINTMENT
    // ===============================
    await pool
      .request()
      .input("PatientID", sql.Int, PatientID)
      .input("MedicalAidNumber", sql.NVarChar(50), MedicalAidNumber || null)
      .input("StartTime", sql.DateTime, startDate)
      .input("EndTime", sql.DateTime, endDate)
      .input("UserID", sql.Int, UserID)
      .input("MedicalAidName", sql.NVarChar(50), MedicalAidName || null)
      .input("Status", sql.NVarChar(50), Status || "InPatient")
      .input("ServiceName", sql.NVarChar(50), ServiceName)
      .input("ServicePrice", sql.Decimal(10, 2), Price)
      .input(
        "MedicalAid_MainMember",
        sql.NVarChar(50),
        MedicalAid_MainMember || null
      )
      .input(
        "MainMember__IDNo",
        sql.NVarChar(50),
        MainMember__IDNo || null
      )
      .input(
        "MedicalAid_option",
        sql.NVarChar(50),
        MedicalAid_option || null
      )
      .input("PaymentMethod", sql.NVarChar(50), PaymentMethod || null)
      .input("FinalPrice", sql.Decimal(10, 2), computedFinalPrice)
      .input("IsStudent", sql.Bit, IsStudent ? 1 : 0)
      .query(`
        INSERT INTO Appointments (
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
        )
        VALUES (
          @PatientID,
          @MedicalAidNumber,
          @StartTime,
          @EndTime,
          @UserID,
          @MedicalAidName,
          @Status,
          @ServiceName,
          @ServicePrice,
          @MedicalAid_MainMember,
          @MainMember__IDNo,
          @MedicalAid_option,
          @PaymentMethod,
          @FinalPrice,
          @IsStudent
        )
      `);

    res.status(201).json({
      message: "Appointment created successfully"
    });
  } catch (err) {
    console.error("❌ Appointment Create Error:", err);

    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
});

export default router;
