// src/pages/Bookings.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✅ API base URL (local + Render)
const API_BASE = import.meta.env.VITE_API_URL;

interface Booking {
  id: number;
  patientName: string;
  ServiceName: string;
  StartTime: string | null;
  EndTime: string | null;
  Status: string | null;
  isFollow_Up: string | null;
  UserID?: number | null;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  // =====================
  // FETCH BOOKINGS
  // =====================
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<Booking[]>(
        `${API_BASE}/bookings`
      );

      setBookings(res.data);
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      setError("Failed to fetch bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // =====================
  // HELPERS
  // =====================
  const formatTime = (value: string | null) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================
  // DELETE BOOKING
  // =====================
  const deleteBooking = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this booking?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);

      await axios.delete(
        `${API_BASE}/appointments/${id}`
      );

      fetchBookings();
    } catch (err) {
      console.error("❌ Error deleting booking:", err);
      alert("Failed to delete booking.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-lg border rounded-2xl">
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>
              Showing all appointments scheduled for today
            </CardDescription>
          </div>

          <Button
            variant="outline"
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>

        <CardContent>
          {error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No appointments found for today.
            </p>
          ) : (
            <Table>
              <TableCaption>
                List of today's scheduled appointments
              </TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow Up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.patientName}</TableCell>
                    <TableCell>{b.ServiceName}</TableCell>
                    <TableCell>{formatTime(b.StartTime)}</TableCell>
                    <TableCell>{formatTime(b.EndTime)}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          b.Status === "Scheduled"
                            ? "default"
                            : b.Status === "Completed"
                            ? "secondary"
                            : b.Status === "Cancelled"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {b.Status ?? "Unknown"}
                      </Badge>
                    </TableCell>

                    <TableCell>{b.isFollow_Up ?? "No"}</TableCell>

                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/edit-appointment/${b.id}`)
                        }
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteBooking(b.id)}
                        disabled={deletingId === b.id}
                      >
                        {deletingId === b.id ? "Deleting..." : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
