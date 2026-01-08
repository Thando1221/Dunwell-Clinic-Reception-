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
      const res = await fetch(`${BASE_URL}/users`);
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
      const res = await fetch(`${BASE_URL}/attendance/today`);
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

  // ✅ Clock In Logic with Time Validation and Single Entry Rule
  const handleClockIn = async () => {
    if (!selectedEmployeeIn) return toast.error("Select an employee");

    // Check if employee already clocked in today
    const alreadyIn = attendanceRecords.find(
      (rec) => rec.UserID === parseInt(selectedEmployeeIn) && rec.TimeIn
    );
    if (alreadyIn) return toast.warning("This employee has already clocked in today.");

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const totalMinutes = currentHours * 60 + currentMinutes;

    const nineAM = 9 * 60; // 09:00
    const nineThirty = 9 * 60 + 30; // 09:30

    // Between 09:00 and 09:30
    if (totalMinutes >= nineAM && totalMinutes <= nineThirty) {
      toast.info("Arrived on time ✅");
    }
    // After 09:30
    else if (totalMinutes > nineThirty) {
      toast.warning("You are late ⏰ — remark will be set to 'Late'.");
    }
    // Before 09:00
    else if (totalMinutes < nineAM) {
      toast.error("Please clock in at 09:00 ⏰");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/attendance/clock-in`, {
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

  // ✅ Clock Out (only once)
  const handleClockOut = async () => {
    if (!selectedEmployeeOut) return toast.error("Select an employee");

    const alreadyOut = attendanceRecords.find(
      (rec) => rec.UserID === parseInt(selectedEmployeeOut) && rec.TimeOut
    );
    if (alreadyOut) return toast.warning("This employee has already clocked out today.");

    try {
      const res = await fetch(`${BASE_URL}/attendance/clock-out`, {
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

  // ✅ Set On Leave (only once)
  const handleSetOnLeave = async () => {
    if (!selectedEmployeeLeave) return toast.error("Select an employee");

    const alreadyLeave = attendanceRecords.find(
      (rec) => rec.UserID === parseInt(selectedEmployeeLeave) && rec.OnLeave === "Yes"
    );
    if (alreadyLeave)
      return toast.warning("This employee is already marked as on leave today.");

    try {
      const res = await fetch(`${BASE_URL}/attendance/on-leave`, {
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

      {/* Clock In / Clock Out / On Leave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clock In */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100">
                <LogIn className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Clock In</CardTitle>
                <CardDescription>Record arrival</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Employee</Label>
            <Select value={selectedEmployeeIn} onValueChange={setSelectedEmployeeIn}>
              <SelectTrigger className="h-11">
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
            <Button onClick={handleClockIn} className="w-full h-11">
              <Clock className="mr-2 h-4 w-4" /> Clock In
            </Button>
          </CardContent>
        </Card>

        {/* Clock Out */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Clock Out</CardTitle>
                <CardDescription>Record departure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Employee</Label>
            <Select value={selectedEmployeeOut} onValueChange={setSelectedEmployeeOut}>
              <SelectTrigger className="h-11">
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
            <Button onClick={handleClockOut} variant="destructive" className="w-full h-11">
              <Clock className="mr-2 h-4 w-4" /> Clock Out
            </Button>
          </CardContent>
        </Card>

        {/* Set On Leave */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Plane className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Set On Leave</CardTitle>
                <CardDescription>Mark employee as on leave</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Select Employee</Label>
            <Select value={selectedEmployeeLeave} onValueChange={setSelectedEmployeeLeave}>
              <SelectTrigger className="h-11">
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
            <Button onClick={handleSetOnLeave} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              <Plane className="mr-2 h-4 w-4" /> Set On Leave
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="shadow-md">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Today's Attendance</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAttendance}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No attendance records yet for today.
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition"
                >
                  <div>
                    <div className="font-medium">
                      {record.Name} {record.Surname}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      In: {record.TimeIn || "-"} | Out: {record.TimeOut || "-"} | Leave:{" "}
                      {record.OnLeave?.trim() || "No"}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      record.OnLeave?.trim() === "Yes"
                        ? "text-blue-600"
                        : record.TimeOut
                        ? "text-gray-600"
                        : "text-green-600"
                    }`}
                  >
                    {record.OnLeave?.trim() === "Yes"
                      ? "On Leave"
                      : record.TimeOut
                      ? "Completed"
                      : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
