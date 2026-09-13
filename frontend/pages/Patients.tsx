import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Patient, User } from "../types";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Plus, Search, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "../components/ui/toast";

export default function Patients({
  onNavigate,
  user,
}: {
  onNavigate: (page: string, id?: number) => void;
  user: User;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<Patient>();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredPatients(
      patients.filter(
        (p) =>
          p.first_name_ar.toLowerCase().includes(lowerSearch) ||
          (p.middle_name_ar || "").toLowerCase().includes(lowerSearch) ||
          p.last_name_ar.toLowerCase().includes(lowerSearch) ||
          String(p.file_number).includes(lowerSearch) ||
          p.id_number.toLowerCase().includes(lowerSearch),
      ),
    );
  }, [search, patients]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients(undefined, 5000);
      setPatients(data);
      setFilteredPatients(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from DOB
  const calcAge = (dob?: string) => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const onSubmit = async (data: Patient) => {
    try {
      await api.addPatient({
        first_name_ar: data.first_name_ar,
        middle_name_ar: data.middle_name_ar || undefined,
        last_name_ar: data.last_name_ar,
        id_number: data.id_number,
        file_number: data.file_number ? Number(data.file_number) : undefined,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender,
        status: data.status || "Active",
        mobile: data.mobile || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
      });
      toast.success("Patient added successfully!");
      reset();
      setIsAddOpen(false);
      loadPatients();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add patient");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Patients
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium">
            Manage patient registry and medical files.
          </p>
        </div>
        {user.role !== "guest" && (
          <Button onClick={() => setIsAddOpen(true)} className="font-medium">
            <Plus className="mr-2 h-5 w-5" /> Add Patient
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-col sm:flex-row">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, file number, or ID..."
            className="pl-10 h-11 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">ID Number</TableHead>
                <TableHead className="hidden sm:table-cell">Age</TableHead>
                <TableHead className="hidden lg:table-cell">Gender</TableHead>
                <TableHead className="hidden lg:table-cell">DOB</TableHead>
                <TableHead className="hidden md:table-cell">Blood Group</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    No patients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.patient_id}>
                    <TableCell className="font-mono">
                      {patient.file_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {patient.first_name_ar} {patient.last_name_ar}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{patient.id_number}</TableCell>
                    <TableCell className="hidden sm:table-cell">{calcAge(patient.date_of_birth)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{patient.gender === "M" ? "Male" : "Female"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{patient.date_of_birth || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {patient.blood_group ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${patient.blood_group.includes("+") ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                          }`}>
                          {patient.blood_group}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${(patient.status || "Active") === "Active"
                          ? "bg-green-100 text-green-800"
                          : (patient.status || "Active") === "Passed Away"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {patient.status || "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onNavigate("patient_details", patient.patient_id)
                        }
                      >
                        <FileText className="mr-1 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>File Number <span className="text-red-500">*</span></Label>
                <Input type="number" required {...register("file_number")} placeholder="e.g. 1001" />
              </div>
              <div className="space-y-2">
                <Label>ID Number <span className="text-red-500">*</span></Label>
                <Input required {...register("id_number")} placeholder="National ID" />
              </div>
              <div className="space-y-2">
                <Label>First Name (Arabic) <span className="text-red-500">*</span></Label>
                <Input required {...register("first_name_ar")} />
              </div>
              <div className="space-y-2">
                <Label>Middle Name (Arabic)</Label>
                <Input {...register("middle_name_ar")} />
              </div>
              <div className="space-y-2">
                <Label>Last Name (Arabic) <span className="text-red-500">*</span></Label>
                <Input required {...register("last_name_ar")} />
              </div>
              <div className="space-y-2">
                <Label>Gender <span className="text-red-500">*</span></Label>
                <Select {...register("gender")} defaultValue="M">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth <span className="text-red-500">*</span></Label>
                <Input type="date" required {...register("date_of_birth")} />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input {...register("mobile")} placeholder="e.g. 059XXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input {...register("district")} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select {...register("status")} defaultValue="Active">
                  <option value="Active">Active</option>
                  <option value="Passed Away">Passed Away</option>
                  <option value="Transferred">Transferred</option>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Fields marked with <span className="text-red-500">*</span> are required. Blood group is set in the Doctor Order.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Patient</Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
