import express from "express";
import poolPromise from "../db.js";
import sql from "mssql";

const router = express.Router();

// POST /api/patients/add
router.post("/", async (req, res) => {
  const { name, surname, email, phone, dob, gender, address } = req.body;

  if (!name || !surname || !email || !phone || !gender || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input("PatientName", sql.NVarChar, name)
      .input("PatientSurname", sql.NVarChar, surname)
      .input("Patient_Email", sql.NVarChar, email)
      .input("Patient_ContactNo", sql.NVarChar, phone) // changed NChar -> NVarChar
      .input("DOB", sql.Date, dob || null)
      .input("Address", sql.NVarChar, address)
      .input("Gender", sql.NVarChar, gender)
      .input("CreatedDate", sql.Date, new Date())
      .query(`
        INSERT INTO Patients
          (PatientName, PatientSurname, Patient_Email, Patient_ContactNo, DOB, Address, Gender, CreatedDate)
        VALUES
          (@PatientName, @PatientSurname, @Patient_Email, @Patient_ContactNo, @DOB, @Address, @Gender, @CreatedDate)
      `);

    res.json({ message: "Patient added successfully" });
  } catch (err) {
    console.error("Add patient error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
