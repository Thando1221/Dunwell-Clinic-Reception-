// routes/appointments.js
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

    const pool = await poolPromise;

    const priceResult = await pool
      .request()
      .input("ServiceName", sql.NVarChar, ServiceName)
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
      FinalPrice ?? (IsStudent && discount > 0 ? discount : Price);

    await pool
      .request()
      .input("PatientID", sql.Int, PatientID)
      .input("MedicalAidNumber", sql.NVarChar, MedicalAidNumber)
      .input("StartTime", sql.DateTime, StartTime)
      .input("EndTime", sql.DateTime, EndTime)
      .input("UserID", sql.Int, UserID)
      .input("MedicalAidName", sql.NVarChar, MedicalAidName)
      .input("Status", sql.NVarChar, Status)
      .input("ServiceName", sql.NVarChar, ServiceName)
      .input("ServicePrice", sql.Decimal(10, 2), Price)
      .input("MedicalAid_MainMember", sql.NVarChar, MedicalAid_MainMember)
      .input("MainMember__IDNo", sql.NVarChar, MainMember__IDNo)
      .input("MedicalAid_option", sql.NVarChar, MedicalAid_option)
      .input("PaymentMethod", sql.NVarChar, PaymentMethod)
      .input("FinalPrice", sql.Decimal(10, 2), computedFinalPrice)
      .input("IsStudent", sql.Bit, IsStudent)
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

    res.json({ message: "Appointment created successfully" });
  } catch (err) {
    console.error("❌ Appointment Create Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * GET /api/appointments/latest-medical-aid/:patientId
 * Fetch latest medical aid details for a patient
 * ONLY requires MedicalAidName to be non-empty
 */
router.get("/latest-medical-aid/:patientId", async (req, res) => {
  try {
    const pool = await poolPromise;
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid PatientID" });
    }

    const result = await pool
      .request()
      .input("PatientID", sql.Int, patientId)
      .query(`
        SELECT TOP 1
          ISNULL(MedicalAidNumber, '') AS MedicalAidNumber,
          ISNULL(MedicalAidName, '') AS MedicalAidName,
          ISNULL(MedicalAid_MainMember, '') AS MedicalAid_MainMember,
          ISNULL(MainMember__IDNo, '') AS MainMember__IDNo,
          ISNULL(MedicalAid_option, '') AS MedicalAid_option
        FROM Appointments
        WHERE PatientID = @PatientID
          AND LTRIM(RTRIM(MedicalAidName)) <> ''
        ORDER BY StartTime DESC
      `);

    if (!result.recordset.length) {
      return res.json(null);
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Fetch latest medical aid error:", err);
    res.status(500).json({ error: "Failed to fetch medical aid details" });
  }
});

/**
 * GET /api/appointments/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
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
        WHERE a.AppointID = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Error fetching appointment by id:", err);
    res.status(500).json({
      message: "Server error fetching appointment",
      error: err.message
    });
  }
});

/**
 * PUT /api/appointments/:id
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
      "MainMember__IDNo",
      "PatientID"
    ];

    const setClauses = [];
    const request = pool.request();
    request.input("id", sql.Int, id);

    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        setClauses.push(`[${field}] = @${field}`);
        request.input(field, body[field]);
      }
    });

    if (!setClauses.length) {
      return res.status(400).json({ message: "No updatable fields provided." });
    }

    await request.query(`
      UPDATE Appointments
      SET ${setClauses.join(", ")}
      WHERE AppointID = @id
    `);

    res.json({ message: "Appointment updated successfully" });
  } catch (err) {
    console.error("❌ Update appointment error:", err);
    res.status(500).json({
      message: "Failed to update appointment",
      error: err.message
    });
  }
});

/**
 * DELETE /api/appointments/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);

    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Appointments WHERE AppointID = @id");

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("❌ Delete appointment error:", err);
    res.status(500).json({
      message: "Failed to delete appointment",
      error: err.message
    });
  }
});

export default router;
