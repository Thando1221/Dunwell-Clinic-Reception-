import express from "express";
import { query } from "../db.js";

const router = express.Router();

// POST /api/patients/add
router.post("/", async (req, res) => {
  const { name, surname, email, phone, dob, gender, address } = req.body;

  // Validate required fields
  if (!name || !surname || !email || !phone || !gender || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await query(
      `INSERT INTO Patients
        (PatientName, PatientSurname, Patient_Email, Patient_ContactNo, DOB, Address, Gender, CreatedDate)
       VALUES
        (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7)`,
      [
        name,
        surname,
        email,
        phone,
        dob || null,
        address,
        gender,
        new Date()
      ]
    );

    res.json({ message: "Patient added successfully" });
  } catch (err) {
    console.error("❌ Add patient error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
