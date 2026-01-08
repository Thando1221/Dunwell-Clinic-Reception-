import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

// ✅ Create and connect pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// ✅ Helper query function
export async function query(q, params = []) {
  await poolConnect;
  const request = pool.request();
  params.forEach((p, i) => request.input(`p${i}`, p));
  const result = await request.query(q);
  return result.recordset;
}

// ✅ Default export (to match your other imports)
const poolPromise = poolConnect.then(() => pool);
export default poolPromise;

// ✅ Also export sql for use in routes
export { sql };
