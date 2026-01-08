import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./routes/auth.js"; // your auth router
import dashboardRouter from "./routes/dashboard.js";
import patientsRouter from "./routes/patients.js";
import addPatientsRoute from "./routes/addpatients.js";
import catalogueRoutes from "./routes/catalogue.js";
import nurseRoutes from "./routes/nurses.js";
import appointmentRoutes from "./routes/appointments.js";
import bookingsRoute from "./routes/bookings.js";
import usersRoutes from "./routes/users.js";
import attendanceRoutes from "./routes/attendance.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors()); // allow requests from frontend
app.use(express.json());

// Routes
app.use("/api/auth", authRouter); // mount auth routes
app.use("/api/dashboard", dashboardRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/patients/add", addPatientsRoute);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingsRoute);
app.use("/api/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);

// ----------------------------------------------------
// ✅ Serve the frontend (React/Vite build) in production
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build folder will be at: ../dist  (after you run npm run build)
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

// For React Router: send index.html for any unknown route
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
// ----------------------------------------------------

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
