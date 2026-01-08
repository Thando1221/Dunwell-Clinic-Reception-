import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Patients
import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import EditPatient from "./pages/EditPatient";

// Appointments & Bookings
import BookAppointment from "./pages/BookAppointment";
import EditAppointment from "./pages/EditAppointment";
import Bookings from "./pages/Bookings";
import Attendance from "./pages/Attendance";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* 🔓 Public */}
            <Route path="/" element={<Login />} />

            {/* 🏠 Dashboard */}
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />

            {/* 👤 Patients */}
            <Route
              path="/patients"
              element={
                <Layout>
                  <Patients />
                </Layout>
              }
            />
            <Route
              path="/patients/add"
              element={
                <Layout>
                  <AddPatient />
                </Layout>
              }
            />
            <Route
              path="/patients/edit/:id"
              element={
                <Layout>
                  <EditPatient />
                </Layout>
              }
            />

            {/* 📅 Appointments */}
            <Route
              path="/appointments/book"
              element={
                <Layout>
                  <BookAppointment />
                </Layout>
              }
            />
            <Route
              path="/edit-appointment/:appointmentId"
              element={
                <Layout>
                  <EditAppointment />
                </Layout>
              }
            />

            {/* 📋 Bookings */}
            <Route
              path="/bookings"
              element={
                <Layout>
                  <Bookings />
                </Layout>
              }
            />

            {/* ✅ Attendance */}
            <Route
              path="/attendance"
              element={
                <Layout>
                  <Attendance />
                </Layout>
              }
            />

            {/* ❌ 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
