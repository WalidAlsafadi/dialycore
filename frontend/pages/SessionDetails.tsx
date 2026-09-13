import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  DialysisSession,
  SessionMedication,
  SessionSignature,
  User,
} from "../types";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../components/ui/table";
import { ArrowLeft, Save, Plus, PenTool, CheckCircle, Edit } from "lucide-react";
import { toast } from "../components/ui/toast";

export default function SessionDetails({
  sessionId,
  patientId,
  onNavigate,
  user,
}: {
  sessionId: number;
  patientId?: number;
  onNavigate: (page: string, id?: number) => void;
  user: User;
}) {
  const [loading, setLoading] = useState(false);
  const [sessionMeds, setSessionMeds] = useState<SessionMedication[]>([]);
  const [signature, setSignature] = useState<SessionSignature | undefined>(
    undefined,
  );

  // View vs Edit mode — new sessions start in edit, existing start in view
  const isNew = sessionId === 0;
  const [isEditing, setIsEditing] = useState(isNew);

  const { register, handleSubmit, reset, setValue, getValues, watch } =
    useForm<DialysisSession>();

  // Local state for adding med
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedRoute, setNewMedRoute] = useState("IV");

  useEffect(() => {
    if (sessionId && sessionId !== 0) {
      setLoading(true);
      Promise.all([
        api.getSessionById(sessionId),
        api.getSessionMedications(sessionId),
        api.getSessionSignatures(sessionId),
      ])
        .then(([session, meds, sigs]) => {
          if (session) {
            reset(session);
          }
          setSessionMeds(meds);
          setSignature(sigs.length > 0 ? sigs[0] : undefined);
          setLoading(false);
        })
        .catch((err) => {
          toast.error(err?.message || "Failed to load session");
          setLoading(false);
        });
    } else if (patientId) {
      setValue("patient_id", patientId);
      setValue("session_date", new Date().toISOString().split("T")[0]);
      setValue("needle_size", "");
    }
  }, [sessionId, patientId, reset, setValue]);

  const onSubmit = async (data: DialysisSession) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        patient_id: data.patient_id || patientId,
        weight_before_kg: Number(data.weight_before_kg),
        weight_after_kg: Number(data.weight_after_kg),
        target_weight_kg: Number(data.target_weight_kg),
        bp_before_sys: Number(data.bp_before_sys),
        bp_before_dia: Number(data.bp_before_dia),
        bp_after_sys: Number(data.bp_after_sys),
        bp_after_dia: Number(data.bp_after_dia),
        ufr: Number(data.ufr),
        blood_flow_ml_min: Number(data.blood_flow_ml_min),
        ven_pressure: Number(data.ven_pressure),
        tmp: Number(data.tmp),
        blood_transfusion_amount: data.blood_transfusion_amount ? Number(data.blood_transfusion_amount) : undefined,
      };

      if (sessionId && sessionId !== 0) {
        await api.updateSession(sessionId, payload);
        toast.success("Session updated successfully!");
        setIsEditing(false);
      } else {
        await api.createSession(payload as DialysisSession);
        toast.success("Session created successfully!");
      }
      setLoading(false);
      if (isNew) {
        onNavigate("patient_details", payload.patient_id);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save session");
      setLoading(false);
    }
  };

  const handleAddMed = async () => {
    if (!newMedName || !newMedDose || sessionId === 0) return;
    try {
      const med = await api.addSessionMedication({
        session_id: sessionId,
        med_name: newMedName,
        dose: newMedDose,
        route: newMedRoute,
      });
      setSessionMeds([...sessionMeds, med]);
      setNewMedName("");
      setNewMedDose("");
      toast.success("Medication added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add medication");
    }
  };

  const handleSign = async () => {
    if (sessionId === 0) return;
    try {
      const sig = await api.signSession({
        session_id: sessionId,
        nurse_name: user.full_name,
      });
      setSignature(sig);
      toast.success("Chart signed successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign chart");
    }
  };

  // Watch all form values to highlight empty required fields
  const watched = watch();

  // Helper: check if a value is truly empty (null, undefined, "", or 0 for numeric fields)
  const isEmpty = (v: unknown) => v === undefined || v === null || v === "" || v === 0;

  // Helper: red class for empty required fields
  const reqCls = (field: keyof DialysisSession) => {
    if (isNew) return "";
    return isEmpty(watched[field]) ? "border-red-400 bg-red-50/60" : "";
  };

  // Helper: return display value or red "—" for empty
  const displayVal = (field: keyof DialysisSession, suffix?: string) => {
    const v = watched[field];
    if (!isEmpty(v)) {
      return <span>{String(v)}{suffix ? ` ${suffix}` : ""}</span>;
    }
    return <span className="text-red-400 font-medium">—</span>;
  };

  // Helper for optional display (no red)
  const displayOpt = (field: keyof DialysisSession) => {
    const v = watched[field];
    if (!isEmpty(v)) {
      return <span>{String(v)}</span>;
    }
    return <span className="text-muted-foreground">—</span>;
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
    } catch { return d; }
  };

  // ─────────────────────── READ-ONLY VIEW ───────────────────────
  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Session Parameters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Session Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("session_date")}`}>
                {formatDate(watched.session_date)}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Time On</Label>
              <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("time_on")}`}>
                {displayVal("time_on")}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Time Off</Label>
              <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("time_off")}`}>
                {displayVal("time_off")}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Needle Size</Label>
              <div className="px-3 py-2 rounded-md border text-sm font-medium">
                {displayVal("needle_size")}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Anti-Coagulant</Label>
              <div className="px-3 py-2 rounded-md border text-sm font-medium">
                {displayOpt("heparin_type")}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Blood Transfusion</Label>
              <div className="px-3 py-2 rounded-md border text-sm font-medium">
                {watched.blood_transfusion ? <span className="text-red-600 font-semibold">Yes</span> : "No"}
              </div>
            </div>

            {watched.blood_transfusion && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit Type</Label>
                  <div className="px-3 py-2 rounded-md border text-sm font-medium">
                    {displayOpt("blood_transfusion_unit_type")}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Transfusion RH</Label>
                  <div className="px-3 py-2 rounded-md border text-sm font-medium">
                    {displayOpt("blood_transfusion_rh")}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Amount (mL)</Label>
                  <div className="px-3 py-2 rounded-md border text-sm font-medium">
                    {displayOpt("blood_transfusion_amount")}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <Label className="text-xs text-muted-foreground">Medication During Dialysis</Label>
              <div className="px-3 py-2 rounded-md border text-sm min-h-[40px]">
                {displayOpt("medication_during_dialysis")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vitals Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Vitals Pre-Dialysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("weight_before_kg")}`}>
                  {displayVal("weight_before_kg", "kg")}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">UF Goal (kg)</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("target_weight_kg")}`}>
                  {displayVal("target_weight_kg", "kg")}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">BP Systolic</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("bp_before_sys")}`}>
                  {displayVal("bp_before_sys", "mmHg")}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">BP Diastolic</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("bp_before_dia")}`}>
                  {displayVal("bp_before_dia", "mmHg")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Vitals Post-Dialysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("weight_after_kg")}`}>
                  {displayVal("weight_after_kg", "kg")}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">UFR (ml/hr)</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("ufr")}`}>
                  {displayVal("ufr", "ml/hr")}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">BP Systolic</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("bp_after_sys")}`}>
                  {displayVal("bp_after_sys", "mmHg")}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">BP Diastolic</Label>
                <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("bp_after_dia")}`}>
                  {displayVal("bp_after_dia", "mmHg")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Readings & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Machine Readings & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Blood Flow (ml/min)</Label>
              <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("blood_flow_ml_min")}`}>
                {displayVal("blood_flow_ml_min", "ml/min")}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Venous Pressure</Label>
              <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("ven_pressure")}`}>
                {displayVal("ven_pressure")}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">TMP</Label>
              <div className={`px-3 py-2 rounded-md border text-sm font-medium ${reqCls("tmp")}`}>
                {displayVal("tmp")}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nursing Notes</Label>
            <div className="px-3 py-2 rounded-md border text-sm min-h-[60px]">
              {displayOpt("notes")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );

  // ─────────────────────── EDIT FORM ───────────────────────
  const renderEditMode = () => (
    <form className="space-y-6">
      {/* Clinical Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Session Parameters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <input type="hidden" {...register("patient_id")} />

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" {...register("session_date")} className={reqCls("session_date")} />
          </div>
          <div className="space-y-2">
            <Label>Time On</Label>
            <Input type="time" {...register("time_on")} className={reqCls("time_on")} />
          </div>
          <div className="space-y-2">
            <Label>Time Off</Label>
            <Input type="time" {...register("time_off")} className={reqCls("time_off")} />
          </div>

          {/* Needle Size */}
          <div className="space-y-2">
            <Label>Needle Size</Label>
            <Select {...register("needle_size")}>
              <option value="">None</option>
              <option value="G16">G16</option>
              <option value="G17">G17</option>
            </Select>
          </div>

          {/* Anti-Coagulant */}
          <div className="space-y-2">
            <Label>Anti-Coagulant</Label>
            <Select {...register("heparin_type")} defaultValue="">
              <option value="">None</option>
              <option value="Heparin">Heparin</option>
              <option value="Clexan">Clexan</option>
              <option value="Fraxiparine">Fraxiparine</option>
            </Select>
          </div>

          {/* Blood Transfusion */}
          <div className="space-y-2">
            <Label>Blood Transfusion</Label>
            <Select
              value={watched.blood_transfusion ? "yes" : "no"}
              onChange={(e) => setValue("blood_transfusion", e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>

          {watched.blood_transfusion && (
            <>
              <div className="space-y-2">
                <Label>Unit Type</Label>
                <Select {...register("blood_transfusion_unit_type")}>
                  <option value="">— Select —</option>
                  <option value="Packed Cells">Packed Cells</option>
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="F.F. Plasma">F.F. Plasma</option>
                  <option value="Cryoprecipitate">Cryoprecipitate</option>
                  <option value="Platelets">Platelets</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transfusion RH</Label>
                <Select {...register("blood_transfusion_rh")}>
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
                  type="number"
                  {...register("blood_transfusion_amount")}
                  placeholder="e.g. 300"
                />
              </div>
            </>
          )}

          <div className="space-y-2 sm:col-span-2 md:col-span-3">
            <Label>Medication During Dialysis</Label>
            <Textarea
              {...register("medication_during_dialysis")}
              className="min-h-[60px]"
              placeholder="e.g. EPO 4000 IU, Venofer 100mg, Calcium Gluconate..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Vitals Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Vitals Pre-Dialysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" {...register("weight_before_kg")} className={reqCls("weight_before_kg")} />
              </div>
              <div className="space-y-2">
                <Label>UF Goal (kg)</Label>
                <Input type="number" step="0.1" {...register("target_weight_kg")} className={reqCls("target_weight_kg")} />
              </div>
              <div className="space-y-2">
                <Label>BP Systolic</Label>
                <Input type="number" {...register("bp_before_sys")} className={reqCls("bp_before_sys")} />
              </div>
              <div className="space-y-2">
                <Label>BP Diastolic</Label>
                <Input type="number" {...register("bp_before_dia")} className={reqCls("bp_before_dia")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Vitals Post-Dialysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" {...register("weight_after_kg")} className={reqCls("weight_after_kg")} />
              </div>
              <div className="space-y-2">
                <Label>UFR (ml/hr)</Label>
                <Input type="number" {...register("ufr")} className={reqCls("ufr")} />
              </div>
              <div className="space-y-2">
                <Label>BP Systolic</Label>
                <Input type="number" {...register("bp_after_sys")} className={reqCls("bp_after_sys")} />
              </div>
              <div className="space-y-2">
                <Label>BP Diastolic</Label>
                <Input type="number" {...register("bp_after_dia")} className={reqCls("bp_after_dia")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Machine Readings & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Blood Flow (ml/min)</Label>
              <Input type="number" {...register("blood_flow_ml_min")} className={reqCls("blood_flow_ml_min")} />
            </div>
            <div className="space-y-2">
              <Label>Venous Pressure</Label>
              <Input type="number" {...register("ven_pressure")} className={reqCls("ven_pressure")} />
            </div>
            <div className="space-y-2">
              <Label>TMP</Label>
              <Input type="number" {...register("tmp")} className={reqCls("tmp")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nursing Notes</Label>
            <Textarea
              {...register("notes")}
              className="min-h-[100px]"
              placeholder="Complications, meds given during session..."
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onNavigate(
                "patient_details",
                getValues("patient_id") || patientId,
              )
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isNew ? "New Dialysis Session" : isEditing ? "Edit Session" : "Session Details"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Clinical Record & Vitals
            </p>
          </div>
        </div>
        {user.role !== "guest" && <div className="flex gap-2">
          {/* Sign button — for existing sessions */}
          {!isNew && !signature && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSign}
              disabled={user.role !== "nurse"}
            >
              <PenTool className="mr-2 h-4 w-4" /> Sign Chart
            </Button>
          )}

          {/* Edit / Save / Cancel buttons */}
          {isNew ? (
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> Save Record
            </Button>
          ) : !isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Session
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Reset form to last saved values and exit edit mode
                  if (sessionId && sessionId !== 0) {
                    setLoading(true);
                    api.getSessionById(sessionId).then((session) => {
                      if (session) reset(session);
                      setLoading(false);
                    }).catch(() => setLoading(false));
                  }
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={loading}>
                <Save className="mr-2 h-4 w-4" /> Save Record
              </Button>
            </>
          )}
        </div>}
      </div>

      {isEditing ? renderEditMode() : renderViewMode()}

      {/* Signature Section — always visible for existing sessions */}
      {!isNew && (
        <Card className={signature ? "border-green-200 bg-green-50/50" : ""}>
          <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-sm">Nurse Signature</h4>
              {signature ? (
                <div className="flex items-center text-green-700 mt-1 gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Signed by {signature.nurse_name} at{" "}
                    {new Date(signature.created_at || "").toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Pending signature...
                </p>
              )}
            </div>
            {!signature && (
              <Button
                type="button"
                onClick={handleSign}
                variant="outline"
                className="border-dashed"
                disabled={user.role !== "nurse"}
              >
                {user.role === "nurse"
                  ? "Sign as Nurse"
                  : "Signature Required (Nurse Only)"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
