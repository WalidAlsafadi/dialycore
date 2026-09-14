import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Patient,
  DialysisSession,
  LabInvestigation,
  HdSession,
  Schedule,
  PatientMedication,
  ViralSerology,
  Anticoagulation,
  IvAccess,
  DryWeight,
  Culture,
  User,
} from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Activity,
  Clock,
  Pill,
  FileText,
  Stethoscope,
  ClipboardList,
  Edit,
  Shield,
  Droplets,
  Scale,
  Syringe,
  HeartPulse,
  Calendar,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import { useForm } from "react-hook-form";
import { toast } from "../components/ui/toast";

// Predefined drug list
const PREDEFINED_DRUGS = [
  "Calcium",
  "D3",
  "Omeprazole",
  "Amicor",
  "Concor",
  "Aldomet",
  "Lasix",
  "Carvedilol",
  "ASA",
  "Lipidex",
  "Recormon",
  "Iron I.V",
  "Acamol",
];

// IV Access types & sites
const IV_ACCESS_TYPES = ["AV Fistula", "HD Catheter Short-term", "HD Catheter Long-term", "Graft"];
const IV_ACCESS_SITES = ["Femoral", "Subclavian", "Internal Jugular", "Brachial", "Radial"];

// HD Schedule days (Sat-Thu, no Friday)
const HD_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

// Frequency options
const FREQUENCY_OPTIONS = [
  "None",
  "Once daily",
  "Half dose daily",
  "Twice daily",
  "3 times daily",
  "4 times daily",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "Every other day",
  "2 doses every other day",
  "3 doses every other day",
  "3 times/week",
  "Every week",
  "Every 2 weeks",
  "Every month",
  "At dialysis only",
  "As needed (PRN)",
  "Stat (once)",
];

export default function PatientDetails({
  patientId,
  onNavigate,
  user,
  fromPage,
}: {
  patientId: number;
  onNavigate: (page: string, id?: number) => void;
  user: User;
  fromPage?: string;
}) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [labs, setLabs] = useState<LabInvestigation[]>([]);
  const [hdSession, setHdSession] = useState<HdSession | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [meds, setMeds] = useState<PatientMedication[]>([]);
  const [viralSerology, setViralSerology] = useState<ViralSerology[]>([]);
  const [anticoag, setAnticoag] = useState<Anticoagulation[]>([]);
  const [ivAccess, setIvAccess] = useState<IvAccess[]>([]);
  const [dryWeights, setDryWeights] = useState<DryWeight[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("doctor_order");

  const canEditClinical = user.role === "admin" || user.role === "doctor";

  // Doctor's order form states
  const [doctorOrderForm, setDoctorOrderForm] = useState({
    blood_group: "",
    serology: { date: "", hcv_status: "Negative", hbv_status: "Negative", hiv_status: "Negative" },
    anticoag: { drug_name: "", dose: "", date: "" },
    dry_weight: { weight_kg: "", recorded_date: "" },
    iv_access: { access_type: "", site: "", side: "", date: "" },
    frequency: "",
    hours: "",
    hd_order: { cause_of_hd: "", date_of_hd: "" },
    blood_transfusion: false,
    blood_transfusion_rh: "",
    blood_transfusion_amount: "",
    blood_transfusion_unit_type: "",
  });
  const [isEditingDoctorOrder, setIsEditingDoctorOrder] = useState(false);



  // Dialog States
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSerologyOpen, setIsSerologyOpen] = useState(false);
  const [isAnticoagOpen, setIsAnticoagOpen] = useState(false);
  const [isDryWeightOpen, setIsDryWeightOpen] = useState(false);
  const [isIvAccessOpen, setIsIvAccessOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [isMedOpen, setIsMedOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isCultureOpen, setIsCultureOpen] = useState(false);
  const [isBloodGroupOpen, setIsBloodGroupOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  // Forms
  const hdForm = useForm<HdSession>();
  const [labDates, setLabDates] = useState({
    regular: new Date().toISOString().split("T")[0],
    important: new Date().toISOString().split("T")[0],
    special: new Date().toISOString().split("T")[0],
  });
  const [labValues, setLabValues] = useState<Record<string, string>>({});

  // Simple form states
  const [serologyForm, setSerologyForm] = useState({ date: "", hcv_status: "Negative", hbv_status: "Negative", hiv_status: "Negative" });
  const [anticoagForm, setAnticoagForm] = useState({ drug_name: "Heparin", dose: "", date: "" });
  const [dryWeightForm, setDryWeightForm] = useState({ weight_kg: "", recorded_date: "" });
  const [ivAccessForm, setIvAccessForm] = useState({ access_type: "AV Fistula", site: "Brachial", side: "Left", date: "" });
  const [cultureForm, setCultureForm] = useState({ date: "", specimen: "", result: "", sensitivity: "" });
  const [selectedDrug, setSelectedDrug] = useState(PREDEFINED_DRUGS[0]);
  const [otherDrugName, setOtherDrugName] = useState("");
  const [drugDose, setDrugDose] = useState("");
  const [drugFrequency, setDrugFrequency] = useState("Once daily");
  const [drugDate, setDrugDate] = useState("");
  const [drugNote, setDrugNote] = useState("");
  const [bloodGroupVal, setBloodGroupVal] = useState("O+");
  const [roomVal, setRoomVal] = useState("");
  // Drug edit state
  const [editMed, setEditMed] = useState<any>(null);
  const [isEditMedOpen, setIsEditMedOpen] = useState(false);
  // Culture edit state
  const [editCulture, setEditCulture] = useState<any>(null);
  const [isEditCultureOpen, setIsEditCultureOpen] = useState(false);
  // Track save-attempted fields for red highlighting
  const [savedEmpty, setSavedEmpty] = useState(false);

  // Helper: returns red border class when field is empty and data has been loaded
  const reqCls = (val: string | undefined | null) =>
    !loading && !val ? "border-red-400 bg-red-50/60" : "";


  // Schedule form — pick multiple days, shared period + hours
  const [schedSelectedDays, setSchedSelectedDays] = useState<string[]>([]);
  const [schedPeriod, setSchedPeriod] = useState("1");
  const [schedHours, setSchedHours] = useState("4");
  const [schedRoom, setSchedRoom] = useState("");

  // Edit patient header form
  const [editPatientForm, setEditPatientForm] = useState({
    first_name_ar: "",
    middle_name_ar: "",
    last_name_ar: "",
    gender: "M",
    date_of_birth: "",
    id_number: "",
    mobile: "",
    city: "",
    district: "",
    status: "Active",
  });

  const refreshData = async () => {
    try {
      const [p, s, l, o, sch, m, vs, ac, iv, dw, cu] = await Promise.all([
        api.getPatientById(patientId),
        api.getSessionsByPatient(patientId),
        api.getLabsByPatient(patientId),
        api.getDoctorOrderByPatient(patientId),
        api.getScheduleByPatient(patientId),
        api.getPatientMedications(patientId),
        api.getViralSerologyByPatient(patientId),
        api.getAnticoagulationByPatient(patientId),
        api.getIvAccessByPatient(patientId),
        api.getDryWeightsByPatient(patientId),
        api.getCulturesByPatient(patientId),
      ]);
      setPatient(p || null);
      setSessions(s);
      setLabs(l);
      setHdSession(o ?? null);
      setSchedule(sch);
      setMeds(m);
      setViralSerology(vs);
      setAnticoag(ac);
      setIvAccess(iv);
      setDryWeights(dw);
      setCultures(cu);
      if (o) hdForm.reset(o);
      if (p?.blood_group) setBloodGroupVal(p.blood_group);
      if (sch && sch.length > 0 && sch[0].room) setRoomVal(sch[0].room);

      // Doctor's order pre-fill logic: take latest entry for each category to pre-fill the form
      const latestVs = vs.length > 0 ? vs[0] : null;
      const latestAc = ac.length > 0 ? ac[0] : null;
      const latestIv = iv.length > 0 ? iv[0] : null;
      const latestDw = dw.length > 0 ? dw[0] : null;

      setDoctorOrderForm({
        blood_group: p?.blood_group || "",
        serology: {
          date: latestVs?.date || "",
          hcv_status: latestVs?.hcv_status || "Negative",
          hbv_status: latestVs?.hbv_status || "Negative",
          hiv_status: latestVs?.hiv_status || "Negative",
        },
        anticoag: {
          drug_name: latestAc?.drug_name || "",
          dose: latestAc?.dose || "",
          date: latestAc?.date || "",
        },
        dry_weight: {
          weight_kg: latestDw?.weight_kg ? String(latestDw.weight_kg) : "",
          recorded_date: latestDw?.recorded_date || "",
        },
        iv_access: {
          access_type: latestIv?.access_type || "",
          site: latestIv?.site || "",
          side: latestIv?.side || "",
          date: latestIv?.date || "",
        },
        frequency: String(o?.frequency ?? ""),
        hours: String(o?.ordered_hours ?? sch[0]?.session_hours ?? ""),
        hd_order: {
          cause_of_hd: o?.cause_of_hd || "",
          date_of_hd: o?.date_of_hd || "",
        },
        blood_transfusion: false,
        blood_transfusion_rh: "",
        blood_transfusion_amount: "",
        blood_transfusion_unit_type: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load patient data");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    loadData();
  }, [patientId]);

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

  // Handlers
  const norm = (v) => (v ?? "").toString().trim();

  const hasChanged = (a, b) => norm(a) !== norm(b);
  const onSaveDoctorOrderAll = async () => {
    try {
      const calls = [];

      // 1) Blood group (patient table)
      if (hasChanged(doctorOrderForm.blood_group, patient?.blood_group)) {
        calls.push(api.updatePatient(patientId, { blood_group: doctorOrderForm.blood_group }));
      }

      // 2) Serology (upsert) — only if changed vs latest
      const serChanged =
        hasChanged(doctorOrderForm.serology.hcv_status, latestSerology?.hcv_status) ||
        hasChanged(doctorOrderForm.serology.hbv_status, latestSerology?.hbv_status) ||
        hasChanged(doctorOrderForm.serology.hiv_status, latestSerology?.hiv_status) ||
        (doctorOrderForm.serology.date && hasChanged(doctorOrderForm.serology.date, latestSerology?.date));

      if (serChanged) {
        calls.push(
          api.upsertViralSerology(patientId, {
            ...doctorOrderForm.serology,
            date: doctorOrderForm.serology.date,
          })
        );
      }

      // 3) Anticoag — add only if changed (prevents duplicates)
      const acChanged =
        hasChanged(doctorOrderForm.anticoag.drug_name, latestAnticoag?.drug_name) ||
        hasChanged(doctorOrderForm.anticoag.dose, latestAnticoag?.dose) ||
        (doctorOrderForm.anticoag.date && hasChanged(doctorOrderForm.anticoag.date, latestAnticoag?.date));

      if (acChanged && (norm(doctorOrderForm.anticoag.dose) || norm(doctorOrderForm.anticoag.drug_name))) {
        calls.push(
          api.addAnticoagulation(patientId, {
            ...doctorOrderForm.anticoag,
            date: doctorOrderForm.anticoag.date,
          })
        );
      }

      // 4) Dry weight — add only if changed
      const dwChanged =
        hasChanged(doctorOrderForm.dry_weight.weight_kg, latestDryWeight?.weight_kg) ||
        (doctorOrderForm.dry_weight.recorded_date &&
          hasChanged(doctorOrderForm.dry_weight.recorded_date, latestDryWeight?.recorded_date));

      if (dwChanged && norm(doctorOrderForm.dry_weight.weight_kg)) {
        calls.push(
          api.addDryWeight(patientId, {
            weight_kg: Number(doctorOrderForm.dry_weight.weight_kg),
            recorded_date: doctorOrderForm.dry_weight.recorded_date,
          })
        );
      }

      // 5) IV access — add if changed
      const ivChanged =
        hasChanged(doctorOrderForm.iv_access.access_type, latestIvAccess?.access_type) ||
        hasChanged(doctorOrderForm.iv_access.site, latestIvAccess?.site) ||
        hasChanged(doctorOrderForm.iv_access.side, latestIvAccess?.side) ||
        (doctorOrderForm.iv_access.date && hasChanged(doctorOrderForm.iv_access.date, latestIvAccess?.date));

      if (ivChanged) {
        calls.push(
          api.addIvAccess(patientId, {
            ...doctorOrderForm.iv_access,
            date: doctorOrderForm.iv_access.date,
          })
        );
      }

      // 6) HD Session (Doctor Order details) — frequency + hours
      const hdChanged =
        hasChanged(doctorOrderForm.hd_order.cause_of_hd, hdSession?.cause_of_hd) ||
        hasChanged(doctorOrderForm.hd_order.date_of_hd, hdSession?.date_of_hd) ||
        hasChanged(doctorOrderForm.hours, hdSession?.ordered_hours) ||
        hasChanged(doctorOrderForm.frequency, hdSession?.frequency);

      if (hdChanged) {
        const payload = {
          patient_id: patientId,
          ordered_hours: doctorOrderForm.hours ? Number(doctorOrderForm.hours) : undefined,
          frequency: doctorOrderForm.frequency ? Number(doctorOrderForm.frequency) : undefined,
          cause_of_hd: doctorOrderForm.hd_order.cause_of_hd,
          date_of_hd: doctorOrderForm.hd_order.date_of_hd,
          doctor_name: user.full_name,
        };
        if (hdSession) {
          calls.push(api.updateHdSession(patientId, hdSession.session_id, payload));
        } else {
          calls.push(api.addHdSession(patientId, payload));
        }
      }

      if (calls.length === 0) {
        toast.success("Nothing to save");
        setSavedEmpty(true);
        return;
      }

      await Promise.all(calls);
      setSavedEmpty(true);
      toast.success("Doctor order saved");
      await refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save doctor order");
    }
  };
  //   const onSaveDoctorOrderAll = async () => {
  //   try {
  //     const today = new Date().toISOString().split("T")[0];

  //     if (!doctorOrderForm.schedule.days || doctorOrderForm.schedule.days.length === 0) {
  //       toast.error("Please select at least one schedule day");
  //       return;
  //     }

  //     const calls = [];

  //     // 1) Blood group (patient table)
  //     calls.push(api.updatePatient(patientId, { blood_group: doctorOrderForm.blood_group }));

  //     // 2) Serology (upsert)
  //     calls.push(api.upsertViralSerology(patientId, {
  //       ...doctorOrderForm.serology,
  //       date: doctorOrderForm.serology.date || today,
  //     }));

  //     // 3) Anticoag (only if something entered)
  //     if (doctorOrderForm.anticoag.dose || doctorOrderForm.anticoag.drug_name) {
  //       calls.push(api.addAnticoagulation(patientId, {
  //         ...doctorOrderForm.anticoag,
  //         date: doctorOrderForm.anticoag.date || today,
  //       }));
  //     }

  //     // 4) Dry weight
  //     if (doctorOrderForm.dry_weight.weight_kg) {
  //       calls.push(api.addDryWeight(patientId, {
  //         weight_kg: Number(doctorOrderForm.dry_weight.weight_kg),
  //         recorded_date: doctorOrderForm.dry_weight.recorded_date || today,
  //       }));
  //     }

  //     // 5) IV access
  //     if (doctorOrderForm.iv_access.access_type && doctorOrderForm.iv_access.site) {
  //       calls.push(api.addIvAccess(patientId, {
  //         ...doctorOrderForm.iv_access,
  //         date: doctorOrderForm.iv_access.date || today,
  //       }));
  //     }

  //     // 6) Schedule bulk replace
  //     const slots = doctorOrderForm.schedule.days.map((day) => ({
  //       day_of_week: day,
  //       period: Number(doctorOrderForm.schedule.period),
  //       session_hours: Number(doctorOrderForm.schedule.hours),
  //     }));
  //     calls.push(api.bulkReplaceSchedule(patientId, slots));

  //     await Promise.all(calls);

  //     toast.success("Doctor order saved");
  //     await refreshData();
  //   } catch (err) {
  //     toast.error(err?.message || "Failed to save doctor order");
  //   }
  // };


  const onSaveHdSession = async (data: HdSession) => {
    const payload = {
      ...data,
      patient_id: patientId,
      ordered_hours: Number(data.ordered_hours),
      doctor_name: user.full_name,
    };
    try {
      if (hdSession) {
        await api.updateHdSession(patientId, hdSession.session_id, payload);
        toast.success("HD session updated");
      } else {
        await api.addHdSession(patientId, payload);
        toast.success("HD session created");
      }
      await refreshData();
      setIsOrderOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save HD session");
    }
  };

  const onSaveBloodGroup = async () => {
    try {
      await api.updatePatient(patientId, { blood_group: bloodGroupVal });
      toast.success("Blood group updated");
      await refreshData();
      setIsBloodGroupOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update blood group");
    }
  };

  // Viral serology — upsert (update if exists, create if not)
  const onSaveSerology = async () => {
    try {
      await api.upsertViralSerology(patientId, {
        ...serologyForm,
        date: serologyForm.date || new Date().toISOString().split("T")[0],
      });
      toast.success(latestSerology ? "Viral serology updated" : "Viral serology added");
      await refreshData();
      setIsSerologyOpen(false);
      setSerologyForm({ date: "", hcv_status: "Negative", hbv_status: "Negative", hiv_status: "Negative" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save viral serology");
    }
  };

  const onAddAnticoag = async () => {
    try {
      await api.addAnticoagulation(patientId, {
        ...anticoagForm,
        date: anticoagForm.date || new Date().toISOString().split("T")[0],
      });
      toast.success("Anti-coagulant updated");
      await refreshData();
      setIsAnticoagOpen(false);
      setAnticoagForm({ drug_name: "Heparin", dose: "", date: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add anti-coagulant");
    }
  };

  const onAddDryWeight = async () => {
    try {
      await api.addDryWeight(patientId, {
        weight_kg: Number(dryWeightForm.weight_kg),
        recorded_date: dryWeightForm.recorded_date || new Date().toISOString().split("T")[0],
      });
      toast.success("Ideal dry weight recorded");
      await refreshData();
      setIsDryWeightOpen(false);
      setDryWeightForm({ weight_kg: "", recorded_date: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to record dry weight");
    }
  };

  const onAddIvAccess = async () => {
    try {
      await api.addIvAccess(patientId, {
        ...ivAccessForm,
        date: ivAccessForm.date || new Date().toISOString().split("T")[0],
      });
      toast.success("IV access recorded");
      await refreshData();
      setIsIvAccessOpen(false);
      setIvAccessForm({ access_type: "AV Fistula", site: "Brachial", side: "Left", date: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to record IV access");
    }
  };

  // Schedule — bulk replace with selected days
  const onSaveSchedule = async () => {
    if (schedSelectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }
    try {
      const slots = schedSelectedDays.map((day) => ({
        day_of_week: day,
        period: Number(schedPeriod),
        session_hours: Number(schedHours),
        room: schedRoom || undefined,
      }));
      await api.bulkReplaceSchedule(patientId, slots);
      toast.success("Schedule updated");
      await refreshData();
      setIsScheduleOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update schedule");
    }
  };

  const toggleSchedDay = (day: string) => {
    setSchedSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSavePatientEdit = async () => {
    try {
      // Save patient fields
      await api.updatePatient(patientId, {
        first_name_ar: editPatientForm.first_name_ar || undefined,
        middle_name_ar: editPatientForm.middle_name_ar || undefined,
        last_name_ar: editPatientForm.last_name_ar || undefined,
        gender: editPatientForm.gender || undefined,
        date_of_birth: editPatientForm.date_of_birth || undefined,
        id_number: editPatientForm.id_number || undefined,
        mobile: editPatientForm.mobile || undefined,
        city: editPatientForm.city || undefined,
        district: editPatientForm.district || undefined,
        status: editPatientForm.status || undefined,
      });
      // Save schedule if days are selected
      if (schedSelectedDays.length > 0) {
        const slots = schedSelectedDays.map((day) => ({
          day_of_week: day,
          period: Number(schedPeriod),
          session_hours: Number(schedHours),
          room: schedRoom || undefined,
        }));
        await api.bulkReplaceSchedule(patientId, slots);
      }
      toast.success("Patient updated");
      await refreshData();
      setIsEditPatientOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update patient");
    }
  };


  const onAddMed = async () => {
    const name = selectedDrug === "Others" ? otherDrugName : selectedDrug;
    if (!name) { toast.error("Please enter a drug name"); return; }
    try {
      await api.addPatientMedication(patientId, {
        drug_name: name,
        dose: drugDose || undefined,
        frequency: drugFrequency || undefined,
        date_written: drugDate || new Date().toISOString().split("T")[0],
        note: drugNote || undefined,
      });
      toast.success("Medication added");
      await refreshData();
      setIsMedOpen(false);
      setOtherDrugName("");
      setDrugDose("");
      setDrugFrequency("Once daily");
      setDrugDate("");
      setDrugNote("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add medication");
    }
  };

  const onEditMedSave = async () => {
    if (!editMed) return;
    try {
      await api.updatePatientMedication(patientId, editMed.medication_id, {
        drug_name: editMed.drug_name,
        dose: editMed.dose || undefined,
        frequency: editMed.frequency || undefined,
        date_written: editMed.date_written || undefined,
        note: editMed.note || undefined,
      });
      toast.success("Medication updated");
      await refreshData();
      setIsEditMedOpen(false);
      setEditMed(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update medication");
    }
  };

  const onDeleteMed = async (medId: number) => {
    try {
      await api.deletePatientMedication(patientId, medId);
      toast.success("Medication removed");
      await refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove medication");
    }
  };


  const onAddLabBatch = async () => {
    const regularCodes = ["WBC", "HB", "MCV", "PLT", "GLU", "UREA", "CREAT", "UA", "NA", "K", "TCA", "PHOS"];
    const importantCodes = ["SIRON", "TIBC", "TSAT", "FERR", "TSH", "PTH", "INR"];
    const specialCodes = ["ASTALT", "ALP", "TPRT", "SALB", "CHOLTG", "CKLDH"];

    const allTests = [
      { name: "WBC", code: "WBC" }, { name: "Hb", code: "HB" },
      { name: "MCV", code: "MCV" }, { name: "PLT", code: "PLT" },
      { name: "Glu", code: "GLU" }, { name: "Urea", code: "UREA" },
      { name: "Creat", code: "CREAT" }, { name: "U/A", code: "UA" },
      { name: "Na", code: "NA" }, { name: "K", code: "K" },
      { name: "T.Ca", code: "TCA" }, { name: "Phosph", code: "PHOS" },
      { name: "S.Iron", code: "SIRON" }, { name: "T.I.B.C", code: "TIBC" },
      { name: "TSAT", code: "TSAT" }, { name: "Ferritin", code: "FERR" },
      { name: "TSH", code: "TSH" }, { name: "PTH", code: "PTH" },
      { name: "INR", code: "INR" },
      { name: "AST/ALT", code: "ASTALT" }, { name: "ALP", code: "ALP" },
      { name: "T.prt", code: "TPRT" }, { name: "s. Alb", code: "SALB" },
      { name: "Chol/TG", code: "CHOLTG" }, { name: "CK/LDH", code: "CKLDH" },
    ];

    const regEntries: any[] = [];
    const impEntries: any[] = [];
    const spcEntries: any[] = [];

    (Object.entries(labValues) as [string, string][])
      .filter(([, v]) => v.trim() !== "")
      .forEach(([code, result]) => {
        const entry = {
          investigation_name: allTests.find((t) => t.code === code)?.name || code,
          investigation_code: code,
          result,
        };
        if (regularCodes.includes(code)) regEntries.push(entry);
        else if (importantCodes.includes(code)) impEntries.push(entry);
        else if (specialCodes.includes(code)) spcEntries.push(entry);
      });

    if (regEntries.length === 0 && impEntries.length === 0 && spcEntries.length === 0) {
      toast.error("Please enter at least one result");
      return;
    }

    try {
      const calls = [];
      if (regEntries.length > 0) calls.push(api.addLabsBatch(patientId, labDates.regular, regEntries));
      if (impEntries.length > 0) calls.push(api.addLabsBatch(patientId, labDates.important, impEntries));
      if (spcEntries.length > 0) calls.push(api.addLabsBatch(patientId, labDates.special, spcEntries));

      await Promise.all(calls);
      toast.success("Lab results saved");
      setLabValues({});
      await refreshData();
      setIsLabOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save lab results");
    }
  };



  const onAddCulture = async () => {
    if (!cultureForm.date) { toast.error("Please enter a date"); return; }
    try {
      await api.addCulture(patientId, cultureForm);
      toast.success("Culture result added");
      await refreshData();
      setIsCultureOpen(false);
      setCultureForm({ date: "", specimen: "", result: "", sensitivity: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add culture");
    }
  };

  const onEditCultureSave = async () => {
    if (!editCulture) return;
    try {
      await api.updateCulture(patientId, editCulture.cultures_id, {
        date: editCulture.date,
        specimen: editCulture.specimen,
        result: editCulture.result,
        sensitivity: editCulture.sensitivity,
      });
      toast.success("Culture updated");
      await refreshData();
      setIsEditCultureOpen(false);
      setEditCulture(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update culture");
    }
  };

  const onDeleteCulture = async (cultureId: number) => {
    if (!window.confirm("Delete this culture result?")) return;
    try {
      await api.deleteCulture(patientId, cultureId);
      toast.success("Culture deleted");
      await refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete culture");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen" role="status">
        <Spinner size="lg" className="text-primary" />
        <span className="sr-only">Loading patient data</span>
      </div>
    );
  if (!patient)
    return (
      <div className="p-4 sm:p-8 text-center text-sm">Patient not found</div>
    );

  const latestDryWeight = dryWeights.length > 0 ? dryWeights[0] : null;
  const latestAnticoag = anticoag.length > 0 ? anticoag[0] : null;
  const latestIvAccess = ivAccess.length > 0 ? ivAccess[0] : null;
  const latestSerology = viralSerology.length > 0 ? viralSerology[0] : null;

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="bg-card border rounded-lg p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="mt-0.5 flex-shrink-0"
            onClick={() => onNavigate(fromPage || "patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            {/* Name + blood group badge */}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              {patient.first_name_ar}{patient.middle_name_ar ? ` ${patient.middle_name_ar}` : ""} {patient.last_name_ar}
              {patient.blood_group && (
                <Badge variant={patient.blood_group.includes("+") ? "default" : "destructive"} className="text-xs font-semibold">
                  {patient.blood_group}
                </Badge>
              )}
            </h1>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <span>File <span className="font-semibold text-foreground">#{patient.file_number}</span></span>
              <span>ID <span className="font-semibold text-foreground">{patient.id_number}</span></span>
              {patient.date_of_birth && (
                <span>DOB <span className="font-semibold text-foreground">{formatDate(patient.date_of_birth)}</span> <span className="text-xs">({calcAge(patient.date_of_birth)}y)</span></span>
              )}
              <span>Gender <span className="font-semibold text-foreground">{patient.gender === "M" ? "Male" : "Female"}</span></span>
              {latestDryWeight && (
                <span>Dry Wt <span className="font-semibold text-foreground">{latestDryWeight.weight_kg} kg</span></span>
              )}
              {/* Status as plain text */}
              <span className={`text-xs font-medium ${(patient.status || "Active") === "Active" ? "text-green-700"
                : (patient.status || "Active") === "Passed Away" ? "text-gray-500"
                  : "text-yellow-700"
                }`}>● {patient.status || "Active"}</span>
            </div>

            {/* Schedule pills */}
            {schedule && schedule.length > 0 && (() => {
              const period = schedule[0]?.period ?? 0;
              const pillCls =
                period === 1 ? "bg-blue-100 text-blue-800 border-blue-200" :
                  period === 2 ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                    period === 3 ? "bg-amber-100 text-amber-800 border-amber-200" :
                      "bg-muted text-foreground border-border";
              return (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[...schedule].sort((a, b) => HD_DAYS.indexOf(a.day_of_week) - HD_DAYS.indexOf(b.day_of_week)).map(s => (
                    <span key={s.schedule_id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pillCls}`}>
                      {s.day_of_week}
                    </span>
                  ))}
                  {schedule[0].period && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pillCls}`}>
                      Period {schedule[0].period}
                    </span>
                  )}
                  {schedule[0].room && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border">
                      Room {schedule[0].room}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right: Edit button — admin only */}
        {user.role === "admin" && (
          <Button variant="outline" size="sm" className="flex-shrink-0 self-start md:self-center"
            onClick={() => {
              if (patient) {
                setEditPatientForm({
                  first_name_ar: patient.first_name_ar || "",
                  middle_name_ar: patient.middle_name_ar || "",
                  last_name_ar: patient.last_name_ar || "",
                  gender: patient.gender || "M",
                  date_of_birth: patient.date_of_birth || "",
                  id_number: patient.id_number || "",
                  mobile: patient.mobile || "",
                  city: patient.city || "",
                  district: patient.district || "",
                  status: patient.status || "Active",
                });
                setSchedSelectedDays(schedule.map(s => s.day_of_week));
                setSchedPeriod(String(schedule[0]?.period ?? "1"));
                setSchedHours(String(schedule[0]?.session_hours ?? "4"));
                setSchedRoom(String(schedule[0]?.room ?? ""));
              }
              setIsEditPatientOpen(true);
            }}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="doctor_order">Doctor's Order</TabsTrigger>
          <TabsTrigger value="dialysis_record">Dialysis Record</TabsTrigger>
          <TabsTrigger value="drugs">Drugs</TabsTrigger>
          <TabsTrigger value="labs">Lab Investigations</TabsTrigger>
          <TabsTrigger value="cultures">Cultures</TabsTrigger>
        </TabsList>

        {/* ===================== TAB 1: DOCTOR'S ORDER ===================== */}
        <TabsContent value="doctor_order" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Doctor Order Sheet</CardTitle>
                <CardDescription>Fill everything here, then Save All once.</CardDescription>
              </div>
              {canEditClinical && (
                <div className="flex gap-2">
                  {!isEditingDoctorOrder ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingDoctorOrder(true)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Sheet
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm"
                        onClick={async () => { await refreshData(); setIsEditingDoctorOrder(false); setSavedEmpty(false); }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm"
                        onClick={async () => { await onSaveDoctorOrderAll(); setIsEditingDoctorOrder(false); }}
                      >
                        Save All
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* HD Order Details */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <HeartPulse className="h-4 w-4" /> HD Order Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cause of HD</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.hd_order.cause_of_hd}
                      placeholder="e.g. End-stage renal disease"
                      className={reqCls(doctorOrderForm.hd_order.cause_of_hd)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          hd_order: { ...prev.hd_order, cause_of_hd: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of HD (Start)</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      type="date"
                      value={doctorOrderForm.hd_order.date_of_hd}
                      className={reqCls(doctorOrderForm.hd_order.date_of_hd)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          hd_order: { ...prev.hd_order, date_of_hd: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Blood Group RH & Blood Transfusion — side by side */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <Droplets className="h-4 w-4" /> Blood Group RH & Transfusion
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Group RH</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.blood_group}
                      className={reqCls(doctorOrderForm.blood_group)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({ ...prev, blood_group: e.target.value }))
                      }
                    >
                      <option value="">— Unknown —</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Transfusion</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.blood_transfusion ? "yes" : "no"}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          blood_transfusion: e.target.value === "yes",
                        }))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </Select>
                  </div>
                </div>

                {doctorOrderForm.blood_transfusion && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Type</Label>
                      <Select
                        disabled={!isEditingDoctorOrder}
                        value={doctorOrderForm.blood_transfusion_unit_type}
                        onChange={(e) =>
                          setDoctorOrderForm((prev) => ({
                            ...prev,
                            blood_transfusion_unit_type: e.target.value,
                          }))
                        }
                      >
                        <option value="">— Select —</option>
                        <option value="Packed Cells">Packed Cells</option>
                        <option value="Whole Blood">Whole Blood</option>
                        <option value="F.F. Plasma">F.F. Plasma</option>
                        <option value="Cryoprecipitate">Cryoprecipitate</option>
                        <option value="Platelets">Platelets</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>RH</Label>
                      <Select
                        disabled={!isEditingDoctorOrder}
                        value={doctorOrderForm.blood_transfusion_rh}
                        onChange={(e) =>
                          setDoctorOrderForm((prev) => ({
                            ...prev,
                            blood_transfusion_rh: e.target.value,
                          }))
                        }
                      >
                        <option value="">— Select —</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (mL)</Label>
                      <Input
                        disabled={!isEditingDoctorOrder}
                        type="number"
                        value={doctorOrderForm.blood_transfusion_amount}
                        placeholder="e.g. 300"
                        onChange={(e) =>
                          setDoctorOrderForm((prev) => ({
                            ...prev,
                            blood_transfusion_amount: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Viral Serology */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Viral Serology
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      type="date"
                      value={doctorOrderForm.serology.date}
                      className={reqCls(doctorOrderForm.serology.date)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          serology: { ...prev.serology, date: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>HCV</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.serology.hcv_status}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          serology: { ...prev.serology, hcv_status: e.target.value },
                        }))
                      }
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>HBV</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.serology.hbv_status}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          serology: { ...prev.serology, hbv_status: e.target.value },
                        }))
                      }
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>HIV</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.serology.hiv_status}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          serology: { ...prev.serology, hiv_status: e.target.value },
                        }))
                      }
                    >
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </Select>
                  </div>
                </div>

                {!isEditingDoctorOrder && latestSerology && (
                  <p className="text-xs text-muted-foreground">
                    Last tested: {formatDate(latestSerology.date)}
                  </p>
                )}
              </div>
              {/* Anti-Coagulant */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <Syringe className="h-4 w-4" /> Anti-Coagulant
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Drug</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.anticoag.drug_name}
                      className={reqCls(doctorOrderForm.anticoag.drug_name)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          anticoag: { ...prev.anticoag, drug_name: e.target.value },
                        }))
                      }
                    >
                      <option value="">— None —</option>
                      <option value="Heparin">Heparin</option>
                      <option value="Clexan">Clexan (LMWH)</option>
                      <option value="Fraxiparine">Fraxiparine</option>
                      <option value="No anticoag">No anticoagulation</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dose</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.anticoag.dose}
                      placeholder="e.g. 5000"
                      className={reqCls(doctorOrderForm.anticoag.dose)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          anticoag: { ...prev.anticoag, dose: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      type="date"
                      value={doctorOrderForm.anticoag.date}
                      className={reqCls(doctorOrderForm.anticoag.date)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          anticoag: { ...prev.anticoag, date: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {!isEditingDoctorOrder && latestAnticoag && (
                  <p className="text-xs text-muted-foreground">
                    Current: {latestAnticoag.drug_name} • Dose: {latestAnticoag.dose || "-"} • Since:{" "}
                    {formatDate(latestAnticoag.date)}
                  </p>
                )}
              </div>
              {/* Ideal Dry Weight */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Ideal Dry Weight
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      type="number"
                      step="0.1"
                      value={doctorOrderForm.dry_weight.weight_kg}
                      className={reqCls(doctorOrderForm.dry_weight.weight_kg)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          dry_weight: { ...prev.dry_weight, weight_kg: e.target.value },
                        }))
                      }
                      placeholder="e.g. 70.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      type="date"
                      value={doctorOrderForm.dry_weight.recorded_date}
                      className={reqCls(doctorOrderForm.dry_weight.recorded_date)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          dry_weight: { ...prev.dry_weight, recorded_date: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {!isEditingDoctorOrder && latestDryWeight && (
                  <p className="text-xs text-muted-foreground">
                    Latest: {latestDryWeight.weight_kg} kg • Recorded: {formatDate(latestDryWeight.recorded_date)}
                  </p>
                )}
              </div>
              {/* IV Access */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" /> IV Access
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Access Type</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.iv_access.access_type}
                      className={reqCls(doctorOrderForm.iv_access.access_type)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          iv_access: { ...prev.iv_access, access_type: e.target.value },
                        }))
                      }
                    >
                      <option value="">— None —</option>
                      {IV_ACCESS_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Body Side</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.iv_access.side}
                      className={reqCls(doctorOrderForm.iv_access.side)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          iv_access: { ...prev.iv_access, side: e.target.value },
                        }))
                      }
                    >
                      <option value="">— None —</option>
                      <option value="Left">Left</option>
                      <option value="Right">Right</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.iv_access.site}
                      className={reqCls(doctorOrderForm.iv_access.site)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          iv_access: { ...prev.iv_access, site: e.target.value },
                        }))
                      }
                    >
                      <option value="">— None —</option>
                      {IV_ACCESS_SITES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      disabled={!isEditingDoctorOrder}
                      type="date"
                      value={doctorOrderForm.iv_access.date}
                      className={reqCls(doctorOrderForm.iv_access.date)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          iv_access: { ...prev.iv_access, date: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {!isEditingDoctorOrder && latestIvAccess && (
                  <p className="text-xs text-muted-foreground">
                    Latest: {latestIvAccess.access_type} • {latestIvAccess.side || "-"} • {latestIvAccess.site} • Since:{" "}
                    {formatDate(latestIvAccess.date)}
                  </p>
                )}
              </div>
              {/* Frequency & Hours */}
              <div className="space-y-3">
                <div className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Session Frequency & Hours
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency (sessions per week)</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.frequency}
                      className={reqCls(doctorOrderForm.frequency)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          frequency: e.target.value,
                        }))
                      }
                    >
                      <option value="">— None —</option>
                      <option value="1">1 per week</option>
                      <option value="2">2 per week</option>
                      <option value="3">3 per week</option>
                      <option value="4">4 per week</option>
                      <option value="5">5 per week</option>
                      <option value="6">6 per week</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Session Hours</Label>
                    <Select
                      disabled={!isEditingDoctorOrder}
                      value={doctorOrderForm.hours}
                      className={reqCls(doctorOrderForm.hours)}
                      onChange={(e) =>
                        setDoctorOrderForm((prev) => ({
                          ...prev,
                          hours: e.target.value,
                        }))
                      }
                    >
                      <option value="">— None —</option>
                      <option value="2">2 Hours</option>
                      <option value="2.5">2.5 Hours</option>
                      <option value="3">3 Hours</option>
                      <option value="3.5">3.5 Hours</option>
                      <option value="4">4 Hours</option>
                      <option value="4.5">4.5 Hours</option>
                    </Select>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== TAB 2: DIALYSIS RECORD ===================== */}
        <TabsContent value="dialysis_record">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" /> Dialysis History
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Historical record of all dialysis sessions.
                </CardDescription>
              </div>
              {user.role !== "guest" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate("session_details", 0)}
                >
                  <Plus className="mr-2 h-4 w-4" /> New Session
                </Button>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">BP (Pre)</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Weight Loss</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Duration</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Meds During Dialysis</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Notes</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No sessions recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...sessions]
                      .sort((a, b) => (b.session_date ?? "").localeCompare(a.session_date ?? ""))
                      .map((s) => (
                        <TableRow key={s.session_id}>
                          <TableCell className="font-medium">{formatDate(s.session_date)}</TableCell>
                          <TableCell>{s.bp_before_sys}/{s.bp_before_dia} mmHg</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {((s.weight_before_kg ?? 0) - (s.weight_after_kg ?? 0)).toFixed(2)} kg
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {(() => {
                              const on = s.time_on;
                              const off = s.time_off;
                              if (on && off) {
                                const [h1, m1] = on.split(":").map(Number);
                                const [h2, m2] = off.split(":").map(Number);
                                const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                                if (mins > 0) return `${(mins / 60).toFixed(1)} hrs`;
                              }
                              return s.duration_hours ? `${s.duration_hours} hrs` : "—";
                            })()}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate hidden md:table-cell">
                            {s.medication_during_dialysis || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground hidden lg:table-cell">
                            {s.notes || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"
                              onClick={() => onNavigate("session_details", s.session_id)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== TAB 3: DRUGS ===================== */}
        <TabsContent value="drugs">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" /> Medication Orders
                </CardTitle>
                <CardDescription>Standing medications list.</CardDescription>
              </div>
              {canEditClinical && (
                <Button size="sm" variant="outline" onClick={() => setIsMedOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Prescribe Drug
                </Button>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Dose</TableHead>
                    <TableHead className="hidden sm:table-cell">Frequency</TableHead>
                    <TableHead className="hidden md:table-cell">Date Written</TableHead>
                    <TableHead className="hidden lg:table-cell">Note</TableHead>
                    {canEditClinical && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEditClinical ? 6 : 5} className="text-center py-4 text-muted-foreground">
                        No active medications.
                      </TableCell>
                    </TableRow>
                  ) : (
                    meds.map((m) => (
                      <TableRow key={m.medication_id}>
                        <TableCell className="font-semibold">{m.drug_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{m.dose || "-"}</TableCell>
                        <TableCell className="hidden sm:table-cell">{m.frequency || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(m.date_written)}</TableCell>
                        <TableCell className="text-muted-foreground hidden lg:table-cell">{m.note || "-"}</TableCell>
                        {canEditClinical && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"
                              onClick={() => { setEditMed({ ...m }); setIsEditMedOpen(true); }}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500"
                              onClick={() => onDeleteMed(m.medication_id)}>
                              Remove
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== TAB 4: LAB INVESTIGATIONS ===================== */}
        <TabsContent value="labs">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Lab Investigation Results
                </CardTitle>
                <CardDescription>Results grouped by date</CardDescription>
              </div>
              {canEditClinical && (
                <Button size="sm" variant="outline" onClick={() => setIsLabOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Results
                </Button>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {labs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No lab results found.</p>
              ) : (() => {
                // Build comparison table: rows = test names, columns = dates (newest first)
                const byDate = labs.reduce<Record<string, typeof labs>>((acc, l) => {
                  const d = l.date || "Unknown";
                  if (!acc[d]) acc[d] = [];
                  acc[d].push(l);
                  return acc;
                }, {});
                // Sort dates oldest first → newest on right (RTL reading, right=newest)
                const sortedDates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));


                // Collect all unique test names in a fixed clinical order
                const TEST_ORDER = [
                  "WBC", "Hb", "MCV", "PLT",
                  "Glu", "Urea", "Creat", "U/A", "Na", "K", "T.Ca", "Phosph",
                  "S.Iron", "T.I.B.C", "TSAT", "Ferritin", "TSH", "PTH", "INR",
                  "AST/ALT", "ALP", "T.prt", "s. Alb", "Chol/TG", "CK/LDH",
                ];
                const allNames = new Set<string>(labs.map(l => l.investigation_name));
                const orderedNames: string[] = [
                  ...TEST_ORDER.filter(n => allNames.has(n)),
                  ...[...allNames].filter((n: string) => !TEST_ORDER.includes(n)).sort(),
                ];

                // Build lookup: date -> name -> result
                const lookup: Record<string, Record<string, string>> = {};
                sortedDates.forEach(d => {
                  lookup[d] = {};
                  byDate[d].forEach(l => { lookup[d][l.investigation_name] = l.result || "-"; });
                });

                return (
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-background z-10 text-left px-3 py-2 border-b border-r font-semibold text-muted-foreground whitespace-nowrap">
                          Test
                        </th>
                        {sortedDates.map(d => (
                          <th key={d} className="px-3 py-2 border-b border-r text-center font-semibold whitespace-nowrap">
                            {formatDate(d)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderedNames.map((name, i) => (
                        <tr key={name} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                          <td className="sticky left-0 bg-inherit z-10 px-3 py-1.5 border-r font-semibold text-muted-foreground whitespace-nowrap">
                            {name}
                          </td>
                          {sortedDates.map(d => {
                            const val = lookup[d][name];
                            return (
                              <td key={d} className="px-3 py-1.5 border-r text-center font-medium">
                                {val ?? <span className="text-muted-foreground/40">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== TAB 5: CULTURES ===================== */}
        <TabsContent value="cultures">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" /> Culture Results
                </CardTitle>
                <CardDescription>Microbiological culture results and sensitivities.</CardDescription>
              </div>
              {canEditClinical && (
                <Button size="sm" variant="outline" onClick={() => setIsCultureOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Culture
                </Button>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Specimen</TableHead>
                    <TableHead className="hidden sm:table-cell">Result</TableHead>
                    <TableHead className="hidden md:table-cell">Sensitivity</TableHead>
                    {canEditClinical && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cultures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEditClinical ? 5 : 4} className="text-center py-6 text-muted-foreground">
                        No culture results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cultures.map((c) => (
                      <TableRow key={c.cultures_id}>
                        <TableCell className="font-medium">{formatDate(c.date)}</TableCell>
                        <TableCell>{c.specimen || "-"}</TableCell>
                        <TableCell className="font-semibold hidden sm:table-cell">{c.result || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{c.sensitivity || "-"}</TableCell>
                        {canEditClinical && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"
                              onClick={() => { setEditCulture({ ...c }); setIsEditCultureOpen(true); }}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500"
                              onClick={() => onDeleteCulture(c.cultures_id)}>
                              Delete
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===================== MODALS ===================== */}

      {/* Blood Group Modal */}
      <Dialog open={isBloodGroupOpen} onOpenChange={setIsBloodGroupOpen}>
        <DialogHeader>
          <DialogTitle>Set Blood Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={bloodGroupVal} onChange={(e) => setBloodGroupVal(e.target.value)}>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBloodGroupOpen(false)}>Cancel</Button>
            <Button onClick={onSaveBloodGroup}>Save</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Viral Serology Modal — Update (upsert) */}
      <Dialog open={isSerologyOpen} onOpenChange={setIsSerologyOpen}>
        <DialogHeader>
          <DialogTitle>{latestSerology ? "Update Viral Serology" : "Add Viral Serology"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={serologyForm.date}
              onChange={(e) => setSerologyForm({ ...serologyForm, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>HCV</Label>
              <Select value={serologyForm.hcv_status}
                onChange={(e) => setSerologyForm({ ...serologyForm, hcv_status: e.target.value })}>
                <option value="Negative">Negative</option>
                <option value="Positive">Positive</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HBV</Label>
              <Select value={serologyForm.hbv_status}
                onChange={(e) => setSerologyForm({ ...serologyForm, hbv_status: e.target.value })}>
                <option value="Negative">Negative</option>
                <option value="Positive">Positive</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HIV</Label>
              <Select value={serologyForm.hiv_status}
                onChange={(e) => setSerologyForm({ ...serologyForm, hiv_status: e.target.value })}>
                <option value="Negative">Negative</option>
                <option value="Positive">Positive</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSerologyOpen(false)}>Cancel</Button>
            <Button onClick={onSaveSerology}>{latestSerology ? "Update" : "Save"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Anti-Coagulant Modal */}
      <Dialog open={isAnticoagOpen} onOpenChange={setIsAnticoagOpen}>
        <DialogHeader>
          <DialogTitle>Update Anti-Coagulant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Drug</Label>
              <Select value={anticoagForm.drug_name}
                onChange={(e) => setAnticoagForm({ ...anticoagForm, drug_name: e.target.value })}>
                <option value="Heparin">Heparin</option>
                <option value="Clexan">Clexan</option>
                <option value="Fraxiparine">Fraxiparine</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dose (mm)</Label>
              <Input value={anticoagForm.dose} placeholder="e.g. 5000"
                onChange={(e) => setAnticoagForm({ ...anticoagForm, dose: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={anticoagForm.date}
              onChange={(e) => setAnticoagForm({ ...anticoagForm, date: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnticoagOpen(false)}>Cancel</Button>
            <Button onClick={onAddAnticoag}>Save</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Ideal Dry Weight Modal */}
      <Dialog open={isDryWeightOpen} onOpenChange={setIsDryWeightOpen}>
        <DialogHeader>
          <DialogTitle>Record Ideal Dry Weight</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input type="number" step="0.1" value={dryWeightForm.weight_kg}
              onChange={(e) => setDryWeightForm({ ...dryWeightForm, weight_kg: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={dryWeightForm.recorded_date}
              onChange={(e) => setDryWeightForm({ ...dryWeightForm, recorded_date: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDryWeightOpen(false)}>Cancel</Button>
            <Button onClick={onAddDryWeight}>Save</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* IV Access Modal — with body side */}
      <Dialog open={isIvAccessOpen} onOpenChange={setIsIvAccessOpen}>
        <DialogHeader>
          <DialogTitle>Update IV Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Access Type</Label>
            <Select value={ivAccessForm.access_type}
              onChange={(e) => setIvAccessForm({ ...ivAccessForm, access_type: e.target.value })}>
              {IV_ACCESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Body Side</Label>
              <Select value={ivAccessForm.side}
                onChange={(e) => setIvAccessForm({ ...ivAccessForm, side: e.target.value })}>
                <option value="Left">Left</option>
                <option value="Right">Right</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={ivAccessForm.site}
                onChange={(e) => setIvAccessForm({ ...ivAccessForm, site: e.target.value })}>
                {IV_ACCESS_SITES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={ivAccessForm.date}
              onChange={(e) => setIvAccessForm({ ...ivAccessForm, date: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIvAccessOpen(false)}>Cancel</Button>
            <Button onClick={onAddIvAccess}>Save</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Edit Patient Modal (admin only) */}
      <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={editPatientForm.first_name_ar}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, first_name_ar: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input value={editPatientForm.middle_name_ar}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, middle_name_ar: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={editPatientForm.last_name_ar}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, last_name_ar: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input value={editPatientForm.id_number}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, id_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={editPatientForm.date_of_birth}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, date_of_birth: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={editPatientForm.gender} onChange={(e) => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editPatientForm.status} onChange={(e) => setEditPatientForm({ ...editPatientForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Passed Away">Passed Away</option>
                <option value="Transferred">Transferred</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={editPatientForm.mobile}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, mobile: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={editPatientForm.city}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={editPatientForm.district}
                onChange={(e) => setEditPatientForm({ ...editPatientForm, district: e.target.value })} />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">HD Schedule</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Days (Sat–Thu)</Label>
                <div className="flex flex-wrap gap-2">
                  {HD_DAYS.map((day) => (
                    <button key={day} type="button" onClick={() => toggleSchedDay(day)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${schedSelectedDays.includes(day)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                        }`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={schedPeriod} onChange={(e) => setSchedPeriod(e.target.value)}>
                    <option value="1">Period 1</option>
                    <option value="2">Period 2</option>
                    <option value="3">Period 3</option>
                    <option value="4">Period 4</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Input value={schedRoom} onChange={(e) => setSchedRoom(e.target.value)} placeholder="e.g. 1, 2, 3..." />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPatientOpen(false)}>Cancel</Button>
            <Button onClick={onSavePatientEdit}>Save Changes</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Schedule Modal (kept for legacy use) */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogHeader>
          <DialogTitle>Set HD Schedule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Select Days (Sat–Thu)</Label>
            <div className="flex flex-wrap gap-2">
              {HD_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleSchedDay(day)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${schedSelectedDays.includes(day)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={schedPeriod} onChange={(e) => setSchedPeriod(e.target.value)}>
                <option value="1">Period 1</option>
                <option value="2">Period 2</option>
                <option value="3">Period 3</option>
                <option value="4">Period 4</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={schedRoom}
                onChange={(e) => setSchedRoom(e.target.value)}
                placeholder="e.g. 1, 2, 3..."
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This will replace the entire schedule. Selected: {schedSelectedDays.length > 0 ? schedSelectedDays.join(", ") : "none"}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
            <Button onClick={onSaveSchedule}>Save Schedule</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Prescribe Drug Modal — with dose + frequency + date */}
      <Dialog open={isMedOpen} onOpenChange={setIsMedOpen}>
        <DialogHeader>
          <DialogTitle>Prescribe Medication</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Select Drug</Label>
            <Select value={selectedDrug} onChange={(e) => setSelectedDrug(e.target.value)}>
              {PREDEFINED_DRUGS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="Others">Others</option>
            </Select>
          </div>
          {selectedDrug === "Others" && (
            <div className="space-y-2">
              <Label>Drug Name</Label>
              <Input value={otherDrugName} onChange={(e) => setOtherDrugName(e.target.value)}
                placeholder="Enter drug name" required />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dose</Label>
              <Input value={drugDose} onChange={(e) => setDrugDose(e.target.value)}
                placeholder="e.g. 500 mg" />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={drugFrequency} onChange={(e) => setDrugFrequency(e.target.value)}>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date Written</Label>
            <Input type="date" value={drugDate}
              onChange={(e) => setDrugDate(e.target.value)}
              placeholder={new Date().toISOString().split("T")[0]} />
            <p className="text-xs text-muted-foreground">Leave blank to use today's date.</p>
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea value={drugNote} onChange={(e) => setDrugNote(e.target.value)}
              placeholder="e.g. Take after meals" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMedOpen(false)}>Cancel</Button>
            <Button onClick={onAddMed}>Prescribe</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Edit Drug Modal */}
      <Dialog open={isEditMedOpen} onOpenChange={setIsEditMedOpen}>
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
        </DialogHeader>
        {editMed && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Drug Name</Label>
              <Input value={editMed.drug_name}
                onChange={(e) => setEditMed({ ...editMed, drug_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dose</Label>
                <Input value={editMed.dose || ""}
                  onChange={(e) => setEditMed({ ...editMed, dose: e.target.value })} placeholder="e.g. 500 mg" />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={editMed.frequency || ""}
                  onChange={(e) => setEditMed({ ...editMed, frequency: e.target.value })}>
                  <option value="">— None —</option>
                  {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Written</Label>
              <Input type="date" value={editMed.date_written || ""}
                onChange={(e) => setEditMed({ ...editMed, date_written: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea value={editMed.note || ""}
                onChange={(e) => setEditMed({ ...editMed, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditMedOpen(false); setEditMed(null); }}>Cancel</Button>
              <Button onClick={onEditMedSave}>Save Changes</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Lab Result Modal */}
      <Dialog open={isLabOpen} onOpenChange={setIsLabOpen}>
        <DialogHeader>
          <DialogTitle>Enter Lab Results</DialogTitle>
          <CardDescription>Fill in the values for this date. Leave blank to skip.</CardDescription>
        </DialogHeader>
        <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Groups */}
          {(() => {
            const LAB_GROUPS_LOCAL = [
              {
                label: "Regular Investigations",
                code: "regular",
                headerClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                tests: [
                  { name: "WBC", code: "WBC" }, { name: "Hb", code: "HB" },
                  { name: "MCV", code: "MCV" }, { name: "PLT", code: "PLT" },
                  { name: "Glu", code: "GLU" }, { name: "Urea", code: "UREA" },
                  { name: "Creat", code: "CREAT" }, { name: "U/A", code: "UA" },
                  { name: "Na", code: "NA" }, { name: "K", code: "K" },
                  { name: "T.Ca", code: "TCA" }, { name: "Phosph", code: "PHOS" },
                ],
              },
              {
                label: "Important Investigations",
                code: "important",
                headerClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                tests: [
                  { name: "S.Iron", code: "SIRON" }, { name: "T.I.B.C", code: "TIBC" },
                  { name: "TSAT", code: "TSAT" }, { name: "Ferritin", code: "FERR" },
                  { name: "TSH", code: "TSH" }, { name: "PTH", code: "PTH" },
                  { name: "INR", code: "INR" },
                ],
              },
              {
                label: "Special Investigations",
                code: "special",
                headerClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                tests: [
                  { name: "AST/ALT", code: "ASTALT" }, { name: "ALP", code: "ALP" },
                  { name: "T.prt", code: "TPRT" }, { name: "s. Alb", code: "SALB" },
                  { name: "Chol/TG", code: "CHOLTG" }, { name: "CK/LDH", code: "CKLDH" },
                ],
              },
            ];
            return LAB_GROUPS_LOCAL.map((group) => (
              <div key={group.label} className="space-y-3">
                <div className={`flex items-center justify-between px-3 py-1.5 rounded-md ${group.headerClass}`}>
                  <span className="text-xs font-bold uppercase">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold">Date:</span>
                    <Input
                      type="date"
                      className="h-6 w-32 text-[10px] py-0 px-1 bg-white/50 border-none"
                      value={labDates[group.code as keyof typeof labDates]}
                      onChange={(e) => setLabDates(prev => ({ ...prev, [group.code]: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {group.tests.map((test) => (
                    <div key={test.code} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-16 flex-shrink-0 text-right">
                        {test.name}
                      </span>
                      <Input
                        id={`lab-${test.code}`}
                        className="h-8 text-sm"
                        placeholder="—"
                        value={labValues[test.code] || ""}
                        onChange={(e) =>
                          setLabValues((prev) => ({ ...prev, [test.code]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => { setIsLabOpen(false); setLabValues({}); }}>Cancel</Button>
          <Button onClick={onAddLabBatch}>
            <Plus className="mr-2 h-4 w-4" /> Save Results
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Culture Modal — Add */}
      <Dialog open={isCultureOpen} onOpenChange={setIsCultureOpen}>
        <DialogHeader>
          <DialogTitle>Add Culture Result</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={cultureForm.date}
              onChange={(e) => setCultureForm({ ...cultureForm, date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Specimen</Label>
            <Input value={cultureForm.specimen} placeholder="e.g. Blood, Urine, Catheter tip"
              onChange={(e) => setCultureForm({ ...cultureForm, specimen: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Result</Label>
            <Input value={cultureForm.result} placeholder="e.g. No growth, MRSA"
              onChange={(e) => setCultureForm({ ...cultureForm, result: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Sensitivity</Label>
            <Textarea value={cultureForm.sensitivity} placeholder="e.g. Sensitive to Vancomycin, Resistant to Ampicillin"
              onChange={(e) => setCultureForm({ ...cultureForm, sensitivity: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCultureOpen(false)}>Cancel</Button>
            <Button onClick={onAddCulture}>Add Culture</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Culture Modal — Edit */}
      <Dialog open={isEditCultureOpen} onOpenChange={setIsEditCultureOpen}>
        <DialogHeader>
          <DialogTitle>Edit Culture Result</DialogTitle>
        </DialogHeader>
        {editCulture && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={editCulture.date || ""}
                onChange={(e) => setEditCulture({ ...editCulture, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specimen</Label>
              <Input value={editCulture.specimen || ""} placeholder="e.g. Blood, Urine"
                onChange={(e) => setEditCulture({ ...editCulture, specimen: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Input value={editCulture.result || ""} placeholder="e.g. No growth, MRSA"
                onChange={(e) => setEditCulture({ ...editCulture, result: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sensitivity</Label>
              <Textarea value={editCulture.sensitivity || ""}
                placeholder="e.g. Sensitive to Vancomycin"
                onChange={(e) => setEditCulture({ ...editCulture, sensitivity: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditCultureOpen(false); setEditCulture(null); }}>Cancel</Button>
              <Button onClick={onEditCultureSave}>Save Changes</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
