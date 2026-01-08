import express from "express";
import sql from "mssql";
import poolPromise from "../db.js";

const router = express.Router();

// ✅ Full authoritative catalogue data
const defaultCatalogue = [
  { Type: "Clinical Services", Name: "Consultation (incl meds)", Price: 250.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Family Planning", Price: 150.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Implanon insertion", Price: 300.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Implanon removal", Price: 350.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Pregnancy Test", Price: 50.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "HIV Testing", Price: 100.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "HIV PrEP/PEP", Price: 350.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "HIV Care (Excl labs)", Price: 350.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Chronic Illness", Price: 300.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "STI Management", Price: 300.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Acne Care", Price: 250.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "Papsmear/ PSA", Price: 250.00, discount: 50.00 },
  { Type: "Clinical Services", Name: "BP/ HGT Check", Price: 50.00, discount: 50.00 },
  { Type: "Wellness Services", Name: "Vita Shots (Bco/ C/ B12/ Magnesium)", Price: 50.00, discount: null },
  { Type: "Wellness Services", Name: "Glutathione Shot", Price: 200.00, discount: null },
  { Type: "Wellness Services", Name: "Glow Drip", Price: 500.00, discount: null },
  { Type: "Wellness Services", Name: "Recovery Drip", Price: 400.00, discount: null },
  { Type: "Wellness Services", Name: "Energy Drip", Price: 300.00, discount: null },
  { Type: "Wellness Services", Name: "Hangover Drip", Price: 350.00, discount: null },
];

// ✅ GET /api/catalogue
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    // 1️⃣ Fetch catalogue from DB
    const result = await pool.request().query(`
      SELECT CatalougeID, Type, Name, Price, discount 
      FROM Catalogue
    `);

    let catalogue = result.recordset;

    // 2️⃣ Optional: Check if DB is empty — if so, seed with defaultCatalogue
    if (!catalogue || catalogue.length === 0) {
      console.log("⚠️ Catalogue empty — seeding with default data...");
      for (const item of defaultCatalogue) {
        await pool.request()
          .input("Type", sql.NVarChar, item.Type)
          .input("Name", sql.NVarChar, item.Name)
          .input("Price", sql.Decimal(10, 2), item.Price)
          .input("discount", sql.Decimal(10, 2), item.discount)
          .query(`
            INSERT INTO Catalogue (Type, Name, Price, discount)
            VALUES (@Type, @Name, @Price, @discount)
          `);
      }

      // Re-fetch after seeding
      const refreshed = await pool.request().query(`
        SELECT CatalougeID, Type, Name, Price, discount 
        FROM Catalogue
      `);
      catalogue = refreshed.recordset;
      console.log("✅ Catalogue seeded successfully.");
    }

    // 3️⃣ Return catalogue (ensures consistent discount data)
    res.json(catalogue);
  } catch (err) {
    console.error("❌ Error fetching catalogue:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
