import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, RefreshCcw, Plane } from "lucide-react";

/**
 * ✅ API BASE URL (Vite-safe)
 * Make sure .env has:
 * VITE_API_URL=http://localhost:5000
 * OR production backend URL
 */
const API_BASE = import.meta.env.VITE_API_URL;

const Attendance = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeIn, setSelectedEmployeeIn] = useState("");
  const [selectedEmployeeOut, setSelectedEmployeeOut] = useState("");
  const [selectedEmployeeLeave, setSelectedEmployeeLeave] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch employees
  const fetchEmployees = async () => {
    try {
      if (!API_BASE) throw new Error("API URL not configured");

      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load employees");

      const validEmployees = data.filter(
        (emp: any) => emp.Name && emp.Surname && emp.UserID
      );

      setEmployees(validEmployees);
      if (validEmployees.length === 0) toast.warning("No employees found.");
    } catch (err) {
      toast.error("Error fetching employees");
      console.error("❌ Fetch Employees Error:", err);
    }
  };

  // ✅ Fetch today's attendance
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      if (!API_BASE) throw new Error("API URL not configured");

      const res = await fetch(`${API_BASE}/attendance/today`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch attendance");

      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error fetching attendance");
      console.error("❌ Fetch Attendance Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  // ✅ Clock In
  const handleClockIn = async () => {
    if (!selectedEmployeeIn) return toast.error("Select an employee");

    const alreadyIn = attendanceRecords.find(
      (rec) => rec.UserID === parseInt(selectedEmployeeIn) && rec.TimeIn
    );
    if (alreadyIn)
      return toast.warning("This employee has already clocked in today.");

    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    const nineAM = 9 * 60;
    const nineThirty = 9 * 60 + 30;

    if (totalMinutes < nineAM) {
      toast.error("Please clock in at 09:00 ⏰");
      return;
    } else if (totalMinutes <= nineThirty) {
      toast.info("Arrived on time ✅");
    } else {
      toast.warning("You are late ⏰ — marked as Late.");
    }

    try {
      const res = await fetch(`${API_BASE}/attendance/clock-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedEmployeeIn }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || "Clocked in successfully");
      fetchAttendance();
    } catch (err) {
      toast.error("Server error during clock in");
      console.error("❌ Clock-In Error:", err);
    } finally {
      setSelectedEmployeeIn("");
    }
  };

  // ✅ Clock Out
  const handleClockOut = async () => {
    if (!selectedEmployeeOut) return toast.error("Select an employee");

    const alreadyOut = attendanceRecords.find(
      (rec) => rec.UserID === parseInt(selectedEmployeeOut) && rec.TimeOut
    );
    if (alreadyOut)
      return toast.warning("This employee has already clocked out today.");

    try {
      const res = await fetch(`${API_BASE}/attendance/clock-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedEmployeeOut }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || "Clocked out successfully");
      fetchAttendance();
    } catch (err) {
      toast.error("Server error during clock out");
      console.error("❌ Clock-Out Error:", err);
    } finally {
      setSelectedEmployeeOut("");
    }
  };

  // ✅ Set On Leave
  const handleSetOnLeave = async () => {
    if (!selectedEmployeeLeave) return toast.error("Select an employee");

    const alreadyLeave = attendanceRecords.find(
      (rec) =>
        rec.UserID === parseInt(selectedEmployeeLeave) &&
        rec.OnLeave?.trim() === "Yes"
    );
    if (alreadyLeave)
      return toast.warning("This employee is already on leave today.");

    try {
      const res = await fetch(`${API_BASE}/attendance/on-leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedEmployeeLeave }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || "Marked on leave successfully");
      fetchAttendance();
    } catch (err) {
      toast.error("Server error while marking leave");
      console.error("❌ On Leave Error:", err);
    } finally {
      setSelectedEmployeeLeave("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Attendance Management</h1>
        <p className="text-muted-foreground text-lg">
          Track employee clock in/out and leave status
        </p>
      </div>

      {/* Clock In / Out / Leave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clock In */}
        <Card>
          <CardHeader>
            <CardTitle>Clock In</CardTitle>
            <CardDescription>Record arrival</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Employee</Label>
            <Select value={selectedEmployeeIn} onValueChange={setSelectedEmployeeIn}>
              <SelectTrigger>
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.UserID} value={emp.UserID.toString()}>
                    {emp.Name} {emp.Surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleClockIn} className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Clock In
            </Button>
          </CardContent>
        </Card>

        {/* Clock Out */}
        <Card>
          <CardHeader>
            <CardTitle>Clock Out</CardTitle>
            <CardDescription>Record departure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Employee</Label>
            <Select value={selectedEmployeeOut} onValueChange={setSelectedEmployeeOut}>
              <SelectTrigger>
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.UserID} value={emp.UserID.toString()}>
                    {emp.Name} {emp.Surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleClockOut} variant="destructive" className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Clock Out
            </Button>
          </CardContent>
        </Card>

        {/* On Leave */}
        <Card>
          <CardHeader>
            <CardTitle>Set On Leave</CardTitle>
            <CardDescription>Mark employee as on leave</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Employee</Label>
            <Select
              value={selectedEmployeeLeave}
              onValueChange={setSelectedEmployeeLeave}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.UserID} value={emp.UserID.toString()}>
                    {emp.Name} {emp.Surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSetOnLeave} className="w-full">
              <Plane className="mr-2 h-4 w-4" /> Set On Leave
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Today's Attendance</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchAttendance} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance records for today.
            </p>
          ) : (
            attendanceRecords.map((rec, i) => (
              <div key={i} className="border rounded-lg p-4 mb-2">
                <div className="font-medium">
                  {rec.Name} {rec.Surname}
                </div>
                <div className="text-sm text-muted-foreground">
                  In: {rec.TimeIn || "-"} | Out: {rec.TimeOut || "-"} | Leave:{" "}
                  {rec.OnLeave || "No"}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
