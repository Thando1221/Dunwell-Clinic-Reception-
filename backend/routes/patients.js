import express from "express";
import { query } from "../db.js";

const router = express.Router();

// LOGGING MIDDLEWARE (kept)
router.use((req, res, next) => {
  console.log(`Patients API Hit → ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ GET All Patients
router.get("/", async (req, res) => {
  try {
    const patients = await query(`
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

    res.status(200).json(patients);
  } catch (error) {
    console.error("➤ Fetch patients error:", error.message);
    res.status(503).json({ error: "Database unavailable while fetching patients" });
  }
});

// ✅ GET Single Patient
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const patients = await query(
      `
      SELECT *
      FROM Patients
      WHERE PatientID = @p0
      `,
      [id]
    );

    if (!patients.length) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.status(200).json(patients[0]);
  } catch (error) {
    console.error("➤ Fetch single patient error:", error.message);
    res.status(503).json({ error: "Database unavailable while fetching patient" });
  }
});

// ✅ DELETE Patient
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM Patients WHERE PatientID = @p0",
      [id]
    );

    // DELETE doesn't return rows → re-check
    if (result === undefined) {
      return res.status(200).json({ message: "Patient deleted successfully" });
    }

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("➤ Delete patient error:", error.message);
    res.status(503).json({ error: "Database unavailable while deleting patient" });
  }
});

// ✅ UPDATE Patient
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
    const { id } = req.params;

    await query(
      `
      UPDATE Patients SET
        PatientName = @p0,
        PatientSurname = @p1,
        Patient_ContactNo = @p2,
        Patient_Email = @p3,
        DOB = @p4,
        Address = @p5,
        Gender = @p6
      WHERE PatientID = @p7
      `,
      [
        PatientName,
        PatientSurname,
        Patient_ContactNo || "",
        Patient_Email || "",
        DOB || null,
        Address || "",
        Gender || "",
        id,
      ]
    );

    res.status(200).json({ message: "Patient updated successfully" });
  } catch (error) {
    console.error("➤ Update patient error:", error.message);
    res.status(503).json({ error: "Database unavailable while updating patient" });
  }
});

export default router;
