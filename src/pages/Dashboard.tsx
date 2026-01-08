import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import clinicLogo from "@/assets/clinic-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    newPatientsToday: 0,
    todaysAppointments: 0,
    totalPatients: 0,
    pendingCheckouts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "New Patients Today",
      value: stats.newPatientsToday,
      icon: UserPlus,
      bg: "from-blue-900 to-blue-700",
    },
    {
      title: "Today's Appointments",
      value: stats.todaysAppointments,
      icon: Calendar,
      bg: "from-slate-900 to-slate-800",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      bg: "from-gray-900 to-gray-700",
    },
    {
      title: "Pending Checkouts",
      value: stats.pendingCheckouts,
      icon: Clock,
      bg: "from-yellow-600 to-yellow-500",
    },
  ];

  const quickActions = [
    { label: "Add New Patient", action: () => navigate("/patients/add") },
    { label: "Book Appointment", action: () => navigate("/appointments/book") },
    { label: "View Bookings", action: () => navigate("/bookings") },
    { label: "Attendance", action: () => navigate("/attendance") },
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 classKey="text-4xl font-bold text-white">
            Dunwell Youth Priority Clinic
          </h1>
          <p className="text-gray-300 text-lg font-light mt-1">
            Reception Dashboard • Daily Overview
          </p>
        </div>

        <img
          src={clinicLogo}
          className="w-20 drop-shadow-lg"
          alt="Dunwell Clinic Logo"
        />
      </header>

      {/* STATS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {statCards.map((s) => (
          <Card
            key={s.title}
            className={`
              bg-gradient-to-br ${s.bg}
              text-white shadow-xl backdrop-blur-xl border border-white/10
              transition-transform hover:translate-y-[-3px]
            `}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{s.title}</CardTitle>
              <s.icon className="h-6 w-6 text-yellow-300 drop-shadow-lg" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold drop-shadow-lg">
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((btn) => (
              <Button
                key={btn.label}
                onClick={btn.action}
                className="h-12 font-medium bg-blue-900 hover:bg-blue-700 transition"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
