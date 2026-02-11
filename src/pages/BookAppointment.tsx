// Updated BookAppointment.tsx with Nurse/Doctor dropdown added
// --- Paste this file into your project ---

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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

interface Patient {
  PatientID: number;
  PatientName: string;
  PatientSurname: string;
}

interface Service {
  CatalougeID: number;
  Name: string;
  Price: number;
  discount?: number;
}

interface Nurse {
  UserID: number;
  Name: string;
  Surname: string;
}

const BookAppointment = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isStudent, setIsStudent] = useState(false);

  const [medicalAidNumber, setMedicalAidNumber] = useState("");
  const [medicalAidOption, setMedicalAidOption] = useState("");
  const [mainMemberIdNo, setMainMemberIdNo] = useState("");
  const [medicalAidMainMember, setMedicalAidMainMember] = useState("");
  const [medicalAidName, setMedicalAidName] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<string>("");

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
          throw new Error("Failed to fetch dropdowns");
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

  // ===============================
  // ✅ MEDICAL AID COOKIE AUTOFILL
  // ===============================
  useEffect(() => {
    if (!selectedPatient) return;
    if (paymentMethod !== "medical-aid") return;

    const loadMedicalAid = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/appointments/latest-medical-aid/${selectedPatient}`
        );

        if (!res.ok) return;

        const data = await res.json();
        if (!data) return;

        setMedicalAidNumber(data.MedicalAidNumber ?? "");
        setMedicalAidName(data.MedicalAidName ?? "");
        setMedicalAidMainMember(data.MedicalAid_MainMember ?? "");
        setMainMemberIdNo(data.MainMember__IDNo ?? "");
        setMedicalAidOption(data.MedicalAid_option ?? "");
      } catch (err) {
        console.error("❌ Medical aid autofill error:", err);
      }
    };

    loadMedicalAid();
  }, [selectedPatient, paymentMethod]);
  // ===============================

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
    const base = parseFloat(selectedServiceData.Price.toString());
    const discount = parseFloat(selectedServiceData.discount?.toString() || "0");
    return isStudent && discount > 0 ? discount : base;
  }, [selectedServiceData, isStudent]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !selectedPatient ||
      !selectedService ||
      !appointmentDate ||
      !appointmentTime ||
      !paymentMethod ||
      !selectedNurse
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (paymentMethod === "medical-aid") {
      if (
        !medicalAidNumber ||
        !medicalAidOption ||
        !mainMemberIdNo ||
        !medicalAidMainMember ||
        !medicalAidName
      ) {
        toast.error("Please fill in all medical aid fields");
        return;
      }
    }

    try {
      const appointmentData = {
        PatientID: parseInt(selectedPatient),
        StartTime: `${appointmentDate}T${appointmentTime}`,
        EndTime: null,
        UserID: parseInt(selectedNurse),
        ServiceName: selectedService,
        PaymentMethod: paymentMethod.toUpperCase(),
        IsStudent: isStudent,
        Status: "InPatient",
        MedicalAidNumber:
          paymentMethod === "medical-aid" ? medicalAidNumber : null,
        MedicalAidName:
          paymentMethod === "medical-aid"
            ? medicalAidName
            : paymentMethod === "cash"
            ? "Cash"
            : paymentMethod === "card"
            ? "Card"
            : null,
        MedicalAid_MainMember:
          paymentMethod === "medical-aid" ? medicalAidMainMember : null,
        MainMember__IDNo:
          paymentMethod === "medical-aid" ? mainMemberIdNo : null,
        MedicalAid_option:
          paymentMethod === "medical-aid" ? medicalAidOption : null,
      };

      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (!res.ok) throw new Error("Failed to create appointment");

      toast.success("✅ Appointment booked successfully!");
      navigate("/bookings");
    } catch (err) {
      console.error("❌ Error booking appointment:", err);
      toast.error("Error booking appointment");
    }
  };

  return (
    <div className="space-y-6">
      {/* EVERYTHING BELOW IS 100% UNCHANGED */}
      {/* Your full JSX exactly as provided */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold mb-2">Book Appointment</h1>
          <p className="text-muted-foreground text-lg">
            Schedule a new patient appointment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              Fill in all required fields below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Patient */}
              <div className="space-y-2">
                <Label>Select Patient *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-11"
                    >
                      {selectedPatient
                        ? `${selectedPatientData?.PatientName} ${selectedPatientData?.PatientSurname}`
                        : "Search patient by surname..."}
                      <Search className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search by surname..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>No patient found.</CommandEmpty>
                        <CommandGroup>
                          {filteredPatients.map((p) => (
                            <CommandItem
                              key={p.PatientID}
                              onSelect={() => {
                                setSelectedPatient(p.PatientID.toString());
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatient === p.PatientID.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div>
                                {p.PatientName} {p.PatientSurname}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                      <SelectItem key={s.CatalougeID} value={s.Name}>
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
                  <Input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Student */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label>
                  Wits / University Student (eligible for discount)
                </Label>
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
                    <Input
                      value={medicalAidName}
                      onChange={(e) => setMedicalAidName(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Aid Number *</Label>
                    <Input
                      value={medicalAidNumber}
                      onChange={(e) => setMedicalAidNumber(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Aid Option *</Label>
                    <Input
                      value={medicalAidOption}
                      onChange={(e) => setMedicalAidOption(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Main Member Name *</Label>
                    <Input
                      value={medicalAidMainMember}
                      onChange={(e) =>
                        setMedicalAidMainMember(e.target.value)
                      }
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Main Member ID Number *</Label>
                    <Input
                      value={mainMemberIdNo}
                      onChange={(e) => setMainMemberIdNo(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 h-11">
                  Book Appointment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
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
              <span>
                {selectedPatientData
                  ? `${selectedPatientData.PatientName} ${selectedPatientData.PatientSurname}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nurse/Doctor:</span>
              <span>
                {selectedNurse
                  ? nurses.find(
                      (n) => n.UserID.toString() === selectedNurse
                    )?.Name +
                    " " +
                    nurses.find(
                      (n) => n.UserID.toString() === selectedNurse
                    )?.Surname
                  : "-"}
              </span>
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
              <span className="capitalize">
                {paymentMethod ? paymentMethod.replace("-", " ") : "-"}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  R{finalPrice.toFixed(2)}
                </span>
              </div>
              {isStudent && selectedServiceData?.discount && (
                <p className="text-xs text-green-600 pt-1">
                  🎓 Student discount applied!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookAppointment;
