import express from "express";
import { query } from "../db.js";

const router = express.Router();

// POST /api/appointments
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

    const start = new Date(StartTime.replace("T", " "));
    if (isNaN(start)) {
      return res.status(400).json({ error: "Invalid StartTime format", StartTime });
    }

    let end = null;
    if (EndTime !== null && EndTime !== undefined) {
      end = new Date(EndTime.replace("T", " "));
    }

    await query(`
      INSERT INTO Appointments
      (PatientID, StartTime, EndTime, UserID, ServiceName, PaymentMethod, IsStudent, Status, MedicalAidNumber, MedicalAidName, MedicalAid_MainMember, MainMember__IDNo, MedicalAid_option, FinalPrice)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        PatientID,
        start,
        end,
        UserID,
        ServiceName,
        PaymentMethod,
        IsStudent ? 1 : 0,
        Status,
        MedicalAidNumber,
        MedicalAidName,
        MedicalAid_MainMember,
        MainMember__IDNo,
        MedicalAid_option,
        FinalPrice ?? 0
      ]
    );

    res.status(201).json({ message: "Appointment created successfully" });
  } catch (err) {
    console.error("❌ POST /appointments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
