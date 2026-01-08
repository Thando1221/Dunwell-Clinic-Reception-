import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;


export default function EditAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  // dropdown data
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [nurses, setNurses] = useState([]);

  // form values
  const [selectedPatient, setSelectedPatient] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isStudent, setIsStudent] = useState(false);

  const [medicalAidNumber, setMedicalAidNumber] = useState("");
  const [medicalAidOption, setMedicalAidOption] = useState("");
  const [mainMemberIdNo, setMainMemberIdNo] = useState("");
  const [medicalAidMainMember, setMedicalAidMainMember] = useState("");
  const [medicalAidName, setMedicalAidName] = useState("");

  const [selectedNurse, setSelectedNurse] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingRaw, setBookingRaw] = useState(null);

  // Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [patientsRes, catalogueRes, nursesRes] = await Promise.all([
          fetch(`${API_BASE}/patients`),
          fetch(`${API_BASE}/catalogue`),
          fetch(`${API_BASE}/nurses`),
        ]);
        if (!patientsRes.ok || !catalogueRes.ok || !nursesRes.ok) {
          throw new Error("Failed to fetch dropdown data");
        }

        setPatients(await patientsRes.json());
        setServices(await catalogueRes.json());
        setNurses(await nursesRes.json());
      } catch (err) {
        console.error("❌ Error fetching dropdown data:", err);
        toast.error("Error loading dropdown data");
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch booking
  useEffect(() => {
    if (!appointmentId) return;

    const loadBooking = async () => {
      try {
        const res = await fetch(`${API_BASE}/bookings/${appointmentId}`);
        if (!res.ok) throw new Error("Failed to fetch booking");
        const data = await res.json();
        setBookingRaw(data);

        // Map booking -> form fields
        mapBookingToForm(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading booking:", err);
        toast.error("Failed to load appointment");
        setLoading(false);
      }
    };

    loadBooking();
  }, [appointmentId]);

  const mapBookingToForm = (data) => {
    if (data.PatientID) setSelectedPatient(String(data.PatientID));
    if (data.UserID) setSelectedNurse(String(data.UserID));
    if (data.ServiceName) setSelectedService(data.ServiceName);
    if (data.PaymentMethod) setPaymentMethod(data.PaymentMethod.toLowerCase());
    setIsStudent(Boolean(data.IsStudent));

    setMedicalAidName(data.MedicalAidName || "");
    setMedicalAidNumber(data.MedicalAidNumber || "");
    setMedicalAidOption(data.MedicalAid_option || "");
    setMedicalAidMainMember(data.MedicalAid_MainMember || "");
    setMainMemberIdNo(data.MainMember__IDNo || "");

    const rawStart = data.StartTime || "";
    if (rawStart) {
      const normalized = rawStart.replace(" ", "T").replace("Z", "");
      const [d, t] = normalized.split("T");
      setAppointmentDate(d ?? "");
      setAppointmentTime((t ?? "").slice(0, 5));
    }
  };

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter((p) =>
      p.PatientSurname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const selectedPatientData = patients.find(
    (p) => p.PatientID?.toString() === selectedPatient
  );
  const selectedServiceData = services.find((s) => s.Name === selectedService);

  const finalPrice = useMemo(() => {
    if (!selectedServiceData) return 0;
    const base = parseFloat(selectedServiceData.Price || 0) || 0;
    const discount = parseFloat(selectedServiceData.discount || 0) || 0;
    return isStudent && discount > 0 ? discount : base;
  }, [selectedServiceData, isStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient || !selectedService || !appointmentDate || !appointmentTime || !paymentMethod || !selectedNurse) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (paymentMethod === "medical-aid") {
      if (!medicalAidNumber || !medicalAidOption || !mainMemberIdNo || !medicalAidMainMember || !medicalAidName) {
        toast.error("Please fill in all medical aid fields");
        return;
      }
    }

    const payload = {
      StartTime: `${appointmentDate}T${appointmentTime}`,
      EndTime: null,
      UserID: parseInt(selectedNurse),
      ServiceName: selectedService,
      ServicePrice: selectedServiceData ? parseFloat(selectedServiceData.Price || 0) : null,
      FinalPrice: Number(finalPrice) || null,
      PaymentMethod: paymentMethod.toUpperCase(),
      IsStudent: isStudent,
      Status: bookingRaw?.Status || "InPatient",
      MedicalAidNumber: paymentMethod === "medical-aid" ? medicalAidNumber : null,
      MedicalAidName:
        paymentMethod === "medical-aid"
          ? medicalAidName
          : paymentMethod === "cash"
          ? "Cash"
          : paymentMethod === "card"
          ? "Card"
          : null,
      MedicalAid_MainMember: paymentMethod === "medical-aid" ? medicalAidMainMember : null,
      MainMember__IDNo: paymentMethod === "medical-aid" ? mainMemberIdNo : null,
      MedicalAid_option: paymentMethod === "medical-aid" ? medicalAidOption : null,
      isFollow_Up: bookingRaw?.isFollow_Up ?? false,
    };

    try {
      const res = await fetch(`${API_BASE}/bookings/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Update failed:", text);
        throw new Error("Failed to update appointment");
      }

      toast.success("Appointment updated!");
      navigate("/bookings");
    } catch (err) {
      console.error("❌ Error updating appointment:", err);
      toast.error("Error updating appointment");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold mb-2">Edit Appointment</h1>
          <p className="text-muted-foreground text-lg">Modify existing appointment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>Fill in all required fields below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient */}
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Popover open={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={false} className="w-full justify-between h-11" disabled>
                      {selectedPatientData ? `${selectedPatientData.PatientName} ${selectedPatientData.PatientSurname}` : "Patient not found"}
                      <Search className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                </Popover>
                <p className="text-xs text-muted-foreground">Patient cannot be changed while editing — create a new appointment to change.</p>
              </div>

              {/* Nurse / Doctor */}
              <div className="space-y-2">
                <Label>Assign Nurse/Doctor *</Label>
                <Select value={selectedNurse} onValueChange={setSelectedNurse}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select nurse/doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {nurses.map((n) => (
                      <SelectItem key={n.UserID} value={n.UserID.toString()}>
                        {n.Name} {n.Surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.CatalougeID ?? s.Name} value={s.Name}>
                        {s.Name} - R{s.Price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className="h-11" />
                </div>
              </div>

              {/* Student */}
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} className="h-4 w-4" />
                <Label>Wits / University Student (eligible for discount)</Label>
              </div>

              {/* Payment */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card Payment</SelectItem>
                    <SelectItem value="medical-aid">Medical Aid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Medical Aid */}
              {paymentMethod === "medical-aid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Medical Aid Name *</Label>
                    <Input value={medicalAidName} onChange={(e) => setMedicalAidName(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Aid Number *</Label>
                    <Input value={medicalAidNumber} onChange={(e) => setMedicalAidNumber(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Aid Option *</Label>
                    <Input value={medicalAidOption} onChange={(e) => setMedicalAidOption(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Main Member Name *</Label>
                    <Input value={medicalAidMainMember} onChange={(e) => setMedicalAidMainMember(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Main Member ID Number *</Label>
                    <Input value={mainMemberIdNo} onChange={(e) => setMainMemberIdNo(e.target.value)} className="h-11" />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 h-11">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1 h-11">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="shadow-md h-fit">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient:</span>
              <span>{selectedPatientData ? `${selectedPatientData.PatientName} ${selectedPatientData.PatientSurname}` : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nurse/Doctor:</span>
              <span>{selectedNurse ? nurses.find(n => n.UserID.toString() === selectedNurse)?.Name + " " + nurses.find(n => n.UserID.toString() === selectedNurse)?.Surname : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span>{selectedService || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span>{isStudent ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="capitalize">{paymentMethod ? paymentMethod.replace("-", " ") : "-"}</span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">R{finalPrice.toFixed(2)}</span>
              </div>
              {isStudent && selectedServiceData?.discount && (
                <p className="text-xs text-green-600 pt-1">🎓 Student discount applied!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
