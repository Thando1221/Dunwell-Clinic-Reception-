import express from "express";
import { query } from "../db.js";

const router = express.Router();

// Full authoritative catalogue data
const defaultCatalogue = [
  { Type: "Clinical Services", Name: "Consultation (incl meds)", Price: 250.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Family Planning", Price: 150.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Implanon insertion", Price: 300.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Implanon removal", Price: 350.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Pregnancy Test", Price: 50.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "HIV Testing", Price: 100.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "HIV PrEP/PEP", Price: 350.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "HIV Care (Excl labs)", Price: 350.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Chronic Illness", Price: 300.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "STI Management", Price: 300.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Acne Care", Price: 250.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "Papsmear/ PSA", Price: 250.0, discount: 50.0 },
  { Type: "Clinical Services", Name: "BP/ HGT Check", Price: 50.0, discount: 50.0 },
  { Type: "Wellness Services", Name: "Vita Shots (Bco/ C/ B12/ Magnesium)", Price: 50.0, discount: null },
  { Type: "Wellness Services", Name: "Glutathione Shot", Price: 200.0, discount: null },
  { Type: "Wellness Services", Name: "Glow Drip", Price: 500.0, discount: null },
  { Type: "Wellness Services", Name: "Recovery Drip", Price: 400.0, discount: null },
  { Type: "Wellness Services", Name: "Energy Drip", Price: 300.0, discount: null },
  { Type: "Wellness Services", Name: "Hangover Drip", Price: 350.0, discount: null },
];

// GET /api/catalogue
router.get("/", async (req, res) => {
  try {
    // 1️⃣ Fetch catalogue from DB
    let catalogue = await query(`
      SELECT CatalougeID, Type, Name, Price, discount
      FROM Catalogue
    `);

    // 2️⃣ Seed DB if empty
    if (!catalogue || catalogue.length === 0) {
      console.log("⚠️ Catalogue empty — seeding with default data...");

      for (const item of defaultCatalogue) {
        await query(
          `
          INSERT INTO Catalogue (Type, Name, Price, discount)
          VALUES (@p0, @p1, @p2, @p3)
        `,
          [item.Type, item.Name, item.Price, item.discount]
        );
      }

      // Re-fetch after seeding
      catalogue = await query(`
        SELECT CatalougeID, Type, Name, Price, discount
        FROM Catalogue
      `);
      console.log("✅ Catalogue seeded successfully.");
    }

    // 3️⃣ Return catalogue
    res.json(catalogue);
  } catch (err) {
    console.error("❌ Error fetching catalogue:", err.message);
    res.status(503).json({ message: "Database unavailable while fetching catalogue" });
  }
});

export default router;
