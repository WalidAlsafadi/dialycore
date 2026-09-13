export type Role = "doctor" | "nurse" | "admin" | "guest";

export interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface Patient {
  patient_id: number;
  first_name_ar: string;
  middle_name_ar?: string;
  last_name_ar: string;
  gender: string;
  id_number: string;
  file_number: number;
  date_of_birth?: string;
  blood_group?: string;
  mobile?: string;
  city?: string;
  district?: string;
  status?: string; // Active, Passed Away, Transferred
  created_at?: string;
  updated_at?: string;
}

export interface DialysisSession {
  session_id: number;
  patient_id: number;
  session_date?: string;
  heparin_type?: string;       // "Heparin" | "Clexan"
  anticoagulant_dose?: string;
  access_site?: string;
  needle_size?: string;
  time_on?: string;
  time_off?: string;
  duration_hours?: number;
  weight_before_kg?: number;
  weight_after_kg?: number;
  target_weight_kg?: number;
  bp_before_sys?: number;
  bp_before_dia?: number;
  bp_after_sys?: number;
  bp_after_dia?: number;
  ufr?: number;
  blood_flow_ml_min?: number;
  ven_pressure?: number;
  tmp?: number;
  anticoagulation_used?: boolean;
  erythropoietin?: boolean;
  venofer?: boolean;
  medication_during_dialysis?: string;
  notes?: string;
  blood_transfusion?: boolean;
  blood_transfusion_rh?: string;
  blood_transfusion_amount?: number;
  blood_transfusion_unit_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionMedication {
  id: number;
  session_id: number;
  med_name: string;
  dose?: string;
  route?: string;
  created_at?: string;
}

export interface SessionSignature {
  id: number;
  session_id: number;
  nurse_name: string;
  created_at?: string;
}

export interface PatientMedication {
  medication_id: number;
  patient_id: number;
  drug_name: string;
  dose?: string;
  frequency?: string;
  date_written?: string;
  note?: string;
  created_at?: string;
}

export interface LabInvestigation {
  investigation_id: number;
  patient_id: number;
  investigation_code?: string;
  investigation_name: string;
  result?: string;
  date?: string;
  created_at?: string;
}

export interface HdSession {
  session_id: number;
  patient_id: number;
  session_date?: string;
  ordered_hours?: number;
  frequency?: number;       // sessions per week: 1-6
  cause_of_hd?: string;
  date_of_hd?: string;
  doctor_name?: string;
  created_at?: string;
}

export interface Schedule {
  schedule_id: number;
  patient_id: number;
  day_of_week: string;
  period?: number;          // 1, 2, 3, 4
  session_hours?: number;   // 3, 3.5, 4
  room?: string;
  created_at?: string;
}

export interface ViralSerology {
  serology_id: number;
  patient_id: number;
  date?: string;
  hcv_status?: string;
  hbv_status?: string;
  hiv_status?: string;
  created_at?: string;
}

export interface Culture {
  cultures_id: number;
  patient_id: number;
  date?: string;
  specimen?: string;
  result?: string;
  sensitivity?: string;
  created_at?: string;
}

export interface DryWeight {
  dry_weight_id: number;
  patient_id: number;
  weight_kg: number;
  recorded_date?: string;
  created_at?: string;
}

export interface Anticoagulation {
  anticoag_id: number;
  patient_id: number;
  drug_name?: string;   // Heparin / Clexan / Fraxiparine
  dose?: string;        // e.g. "5000 IU"
  date?: string;
  created_at?: string;
}

export interface IvAccess {
  access_id: number;
  patient_id: number;
  access_type?: string;  // AV Fistula / HD Catheter Short-term / HD Catheter Long-term / Graft
  site?: string;         // Femoral / Subclavian / Internal Jugular / Brachial / Radial
  side?: string;         // Left / Right
  date?: string;
  created_at?: string;
}

export interface Analysis {
  analysis_id: number;
  patient_id: number;
  date?: string;
  type?: string;
  positive_ve_data?: string;
  created_at?: string;
}
