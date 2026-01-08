import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
  });

  // 🔹 Fetch patient by ID
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await axios.get(`${API_URL}/patients/${id}`);

        setFormData({
          name: res.data.PatientName || "",
          surname: res.data.PatientSurname || "",
          email: res.data.Patient_Email || "",
          phone: res.data.Patient_ContactNo || "",
          dob: res.data.DOB ? res.data.DOB.split("T")[0] : "",
          gender: res.data.Gender || "",
          address: res.data.Address || "",
        });
      } catch {
        toast.error("Failed to load patient");
        navigate("/patients");
      } finally {
        setFetching(false);
      }
    };

    fetchPatient();
  }, [id]);

  // 🔹 Update patient
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.surname) {
      toast.error("Name and surname are required");
      return;
    }

    try {
      setLoading(true);

      await axios.put(`${API_URL}/patients/${id}`, {
        PatientName: formData.name,
        PatientSurname: formData.surname,
        Patient_Email: formData.email,
        Patient_ContactNo: formData.phone,
        DOB: formData.dob,
        Gender: formData.gender,
        Address: formData.address,
      });

      toast.success("Patient updated successfully");
      navigate("/patients");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <p className="text-center py-10">Loading patient details…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold mb-2">Edit Patient</h1>
          <p className="text-muted-foreground text-lg">
            Update patient information
          </p>
        </div>
      </div>

      <Card className="shadow-md max-w-3xl">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>Edit the patient details below</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>First Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Surname</Label>
                <Input
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData({ ...formData, surname: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Contact Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(v) =>
                    setFormData({ ...formData, gender: v })
                  }
                  className="flex gap-4 pt-2"
                >
                  <RadioGroupItem value="Male" /> Male
                  <RadioGroupItem value="Female" /> Female
                  <RadioGroupItem value="LGBTQ+" /> LGBTQ+
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Updating..." : "Update Patient"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/patients")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPatient;
