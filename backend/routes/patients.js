import express from "express";
import poolPromise from "../db.js";
import sql from "mssql";

const router = express.Router();

// LOGGING MIDDLEWARE (Optional but helpful)
router.use((req, res, next) => {
  console.log(`Patients API Hit → ${req.method} ${req.originalUrl}`);
  next();
});

// GET All Patients
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        PatientID,
        PatientName,
        PatientSurname,
        Patient_ContactNo,
        Patient_Email,
        DOB,
        Address,
        Gender
      FROM Patients
      ORDER BY PatientID DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("➤ Fetch patients error:", error);
    return res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// GET Single Patient
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT *
        FROM Patients
        WHERE PatientID = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("➤ Fetch single patient error:", error);
    return res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// DELETE Patient
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM Patients WHERE PatientID = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("➤ Delete patient error:", error);
    return res.status(500).json({ error: "Failed to delete patient" });
  }
});

// UPDATE Patient
router.put("/:id", async (req, res) => {
  const {
    PatientName,
    PatientSurname,
    Patient_ContactNo,
    Patient_Email,
    DOB,
    Address,
    Gender,
  } = req.body;

  if (!PatientName || !PatientSurname) {
    return res.status(400).json({ error: "Name and Surname are required" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .input("PatientName", sql.VarChar(100), PatientName)
      .input("PatientSurname", sql.VarChar(100), PatientSurname)
      .input("Patient_ContactNo", sql.VarChar(20), Patient_ContactNo || "")
      .input("Patient_Email", sql.VarChar(255), Patient_Email || "")
      .input("DOB", sql.Date, DOB || null)
      .input("Address", sql.VarChar(255), Address || "")
      .input("Gender", sql.VarChar(10), Gender || "")
      .query(`
        UPDATE Patients SET
          PatientName = @PatientName,
          PatientSurname = @PatientSurname,
          Patient_ContactNo = @Patient_ContactNo,
          Patient_Email = @Patient_Email,
          DOB = @DOB,
          Address = @Address,
          Gender = @Gender
        WHERE PatientID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.status(200).json({ message: "Patient updated successfully" });
  } catch (error) {
    console.error("➤ Update patient error:", error);
    return res.status(500).json({ error: "Failed to update patient" });
  }
});

export default router;
