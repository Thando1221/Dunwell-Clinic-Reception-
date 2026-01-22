import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: true, // Azure SQL requires this
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
};

let pool = null;

// ✅ Lazy connection (connect ONLY when needed)
async function getPool() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log("✅ SQL connected");
    }
    return pool;
  } catch (err) {
    console.error("❌ SQL connection failed:", err.message);
    pool = null;
    throw err;
  }
}

// ✅ Query helper
export async function query(q, params = []) {
  const pool = await getPool();
  const request = pool.request();

  params.forEach((p, i) => {
    request.input(`p${i}`, p);
  });

  const result = await request.query(q);
  return result.recordset;
}

// Optional exports
export { sql };
export default getPool;
