import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Pencil, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const Patients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/patients`);
      setPatients(res.data);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this patient?")) return;

    try {
      await axios.delete(`${API_URL}/patients/${id}`);
      toast.success("Patient deleted successfully");
      fetchPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete patient");
    }
  };

  const filteredPatients = patients.filter((p: any) =>
    `${p.PatientName} ${p.PatientSurname}`.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Patients</h1>
          <p className="text-muted-foreground text-lg">
            Manage and update patient records efficiently
          </p>
        </div>

        <Button onClick={() => navigate("/patients/add")} className="h-11 gap-2">
          <Plus className="w-5 h-5" />
          Add Patient
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or surname…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <Button variant="outline" size="icon" className="h-11 w-11">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Surname</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading patients…
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((p: any) => (
                    <TableRow key={p.PatientID} className="hover:bg-accent">
                      <TableCell>{p.PatientID}</TableCell>
                      <TableCell>{p.PatientName}</TableCell>
                      <TableCell>{p.PatientSurname}</TableCell>
                      <TableCell>{p.Patient_ContactNo}</TableCell>
                      <TableCell>{p.Patient_Email}</TableCell>
                      <TableCell>{p.DOB?.split("T")[0] || "—"}</TableCell>
                      <TableCell>{p.Gender}</TableCell>

                      <TableCell className="text-center flex gap-2 justify-center">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => navigate(`/patients/edit/${p.PatientID}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(p.PatientID)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;
