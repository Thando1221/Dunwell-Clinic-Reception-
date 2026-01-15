import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import patientsRouter from "./routes/patients.js";
import addPatientsRoute from "./routes/addpatients.js";
import catalogueRoutes from "./routes/catalogue.js";
import nurseRoutes from "./routes/nurses.js";
import appointmentRoutes from "./routes/appointments.js";
import bookingsRoute from "./routes/bookings.js";
import usersRoutes from "./routes/users.js";
import attendanceRoutes from "./routes/attendance.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ---------------------------
// Middleware
// ---------------------------

// CORS config: allow your SWA frontend
app.use(cors({
  origin: "https://icy-ocean-052ce4310.2.azurestaticapps.net", // your SWA frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight OPTIONS requests globally
app.options("*", cors({
  origin: "https://icy-ocean-052ce4310.2.azurestaticapps.net",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// ---------------------------
// Routes
// ---------------------------
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/patients/add", addPatientsRoute);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingsRoute);
app.use("/api/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);

// ---------------------------
// Serve React frontend
// ---------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------------------------
// Start server
// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
