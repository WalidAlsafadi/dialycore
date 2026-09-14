import type {
  User, Patient, DialysisSession, SessionMedication, SessionSignature,
  PatientMedication, LabInvestigation, HdSession, Schedule,
  ViralSerology, Anticoagulation, IvAccess, DryWeight, Culture,
} from "../types";

// Production defaults to the same origin used by the compiled frontend. Local
// Vite development defaults to the standalone API unless explicitly overridden.
const BASE = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? "http://localhost:8000" : "");

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
let _token: string | null = localStorage.getItem("jwt_token");

export function setToken(t: string | null) {
  _token = t;
  if (t) localStorage.setItem("jwt_token", t);
  else localStorage.removeItem("jwt_token");
}

export function getToken() {
  return _token;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (_token) h["Authorization"] = `Bearer ${_token}`;
  return h;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function get<T>(path: string): Promise<T> {
  return fetch(`${BASE}${path}`, { headers: authHeaders() }).then(r => handleRes<T>(r));
}

function post<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${BASE}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }).then(r => handleRes<T>(r));
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${BASE}${path}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) }).then(r => handleRes<T>(r));
}

function put<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${BASE}${path}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) }).then(r => handleRes<T>(r));
}

function del(path: string): Promise<void> {
  return fetch(`${BASE}${path}`, { method: "DELETE", headers: authHeaders() }).then(r => handleRes<void>(r));
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  const tokenRes = await post<{ access_token: string }>("/api/auth/login", { email, password });
  setToken(tokenRes.access_token);
  const user = await get<User>("/api/auth/me");
  return { token: tokenRes.access_token, user };
}

export async function guestLoginApi(): Promise<{ token: string; user: User }> {
  const tokenRes = await post<{ access_token: string }>("/api/auth/guest", {});
  setToken(tokenRes.access_token);
  const user = await get<User>("/api/auth/me");
  return { token: tokenRes.access_token, user };
}

export function logoutApi() {
  setToken(null);
}

// ---------------------------------------------------------------------------
// Convenience wrapper — matches existing call sites
// ---------------------------------------------------------------------------
export const api = {
  // ---- Auth ----
  login: async (email: string, password: string): Promise<User> => {
    const { user } = await loginApi(email, password);
    return user;
  },

  loginAsGuest: async (): Promise<User> => {
    const { user } = await guestLoginApi();
    return user;
  },

  me: () => get<User>("/api/auth/me"),

  // ---- Patients ----
  getPatients: (search?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return get<Patient[]>(`/api/patients${qs ? `?${qs}` : ""}`);
  },

  getPatientById: (id: number) =>
    get<Patient>(`/api/patients/${id}`),

  addPatient: (data: Partial<Patient>) =>
    post<Patient>("/api/patients", data),

  updatePatient: (id: number, data: Partial<Patient>) =>
    patch<Patient>(`/api/patients/${id}`, data),

  deletePatient: (id: number) =>
    del(`/api/patients/${id}`),

  getPatientCount: () =>
    get<{ count: number }>("/api/patients/count"),

  // ---- All Dialysis Sessions (analytics) ----
  getAllSessions: () =>
    get<DialysisSession[]>("/api/dialysis-sessions/all?limit=5000"),

  // ---- Dialysis Sessions ----
  getSessionsByPatient: (pid: number) =>
    get<DialysisSession[]>(`/api/patients/${pid}/dialysis-sessions`),

  getSessionById: (sid: number) =>
    get<DialysisSession>(`/api/dialysis-sessions/${sid}`),

  createSession: (data: Partial<DialysisSession>) =>
    post<DialysisSession>(`/api/patients/${data.patient_id}/dialysis-sessions`, data),

  updateSession: (sid: number, data: Partial<DialysisSession>) =>
    patch<DialysisSession>(`/api/dialysis-sessions/${sid}`, data),

  deleteSession: (sid: number) =>
    del(`/api/dialysis-sessions/${sid}`),

  // ---- Session Medications ----
  getSessionMedications: (sid: number) =>
    get<SessionMedication[]>(`/api/dialysis-sessions/${sid}/medications`),

  addSessionMedication: (data: { session_id: number; med_name: string; dose?: string; route?: string }) =>
    post<SessionMedication>(`/api/dialysis-sessions/${data.session_id}/medications`, data),

  // ---- Session Signatures ----
  getSessionSignatures: (sid: number) =>
    get<SessionSignature[]>(`/api/dialysis-sessions/${sid}/signatures`),

  signSession: (data: { session_id: number; nurse_name: string }) =>
    post<SessionSignature>(`/api/dialysis-sessions/${data.session_id}/signatures`, data),

  // ---- Patient Medications ----
  getPatientMedications: (pid: number) =>
    get<PatientMedication[]>(`/api/patients/${pid}/patient-medications`),

  addPatientMedication: (pid: number, data: Partial<PatientMedication>) =>
    post<PatientMedication>(`/api/patients/${pid}/patient-medications`, { ...data, patient_id: pid }),

  deletePatientMedication: (pid: number, medId: number) =>
    del(`/api/patients/${pid}/patient-medications/${medId}`),

  updatePatientMedication: (pid: number, medId: number, data: Partial<PatientMedication>) =>
    put<PatientMedication>(`/api/patients/${pid}/patient-medications/${medId}`, data),


  // ---- Lab Investigations ----
  getLabsByPatient: (pid: number) =>
    get<LabInvestigation[]>(`/api/patients/${pid}/labs`),

  addLab: (pid: number, data: Partial<LabInvestigation>) =>
    post<LabInvestigation>(`/api/patients/${pid}/labs`, { ...data, patient_id: pid }),

  /** Submit multiple test results for one date in a single operation */
  addLabsBatch: async (
    pid: number,
    date: string,
    entries: Array<{ investigation_name: string; investigation_code: string; result: string }>,
  ): Promise<void> => {
    await Promise.all(
      entries
        .filter((e) => e.result.trim() !== "")
        .map((e) =>
          post<LabInvestigation>(`/api/patients/${pid}/labs`, {
            patient_id: pid,
            date,
            investigation_name: e.investigation_name,
            investigation_code: e.investigation_code,
            result: e.result.trim(),
          }),
        ),
    );
  },

  deleteLab: (pid: number, labId: number) =>
    del(`/api/patients/${pid}/labs/${labId}`),

  // ---- Cultures ----
  getCulturesByPatient: (pid: number) =>
    get<Culture[]>(`/api/patients/${pid}/cultures`),

  addCulture: (pid: number, data: Partial<Culture>) =>
    post<Culture>(`/api/patients/${pid}/cultures`, { ...data, patient_id: pid }),

  updateCulture: (pid: number, cultureId: number, data: Partial<Culture>) =>
    put<Culture>(`/api/patients/${pid}/cultures/${cultureId}`, data),

  deleteCulture: (pid: number, cultureId: number) =>
    del(`/api/patients/${pid}/cultures/${cultureId}`),


  // ---- HD Sessions (Doctor Orders) ----
  getHdSessionsByPatient: (pid: number) =>
    get<HdSession[]>(`/api/patients/${pid}/hd-sessions`),

  addHdSession: (pid: number, data: Partial<HdSession>) =>
    post<HdSession>(`/api/patients/${pid}/hd-sessions`, { ...data, patient_id: pid }),

  updateHdSession: (pid: number, sid: number, data: Partial<HdSession>) =>
    patch<HdSession>(`/api/patients/${pid}/hd-sessions/${sid}`, data),

  // Old name alias → new backend
  getDoctorOrderByPatient: async (pid: number): Promise<HdSession | null> => {
    const sessions = await get<HdSession[]>(`/api/patients/${pid}/hd-sessions`);
    return sessions.length > 0 ? sessions[0] : null;
  },

  // ---- Schedule ----
  getScheduleByPatient: (pid: number) =>
    get<Schedule[]>(`/api/patients/${pid}/hd-schedule`),

  addSchedule: (pid: number, data: Partial<Schedule>) =>
    post<Schedule>(`/api/patients/${pid}/hd-schedule`, { ...data, patient_id: pid }),

  deleteSchedule: (pid: number, sid: number) =>
    del(`/api/patients/${pid}/hd-schedule/${sid}`),

  bulkReplaceSchedule: (pid: number, slots: { day_of_week: string; period?: number; session_hours?: number }[]) =>
    put<Schedule[]>(`/api/patients/${pid}/hd-schedule/bulk`, { slots }),

  getSchedulesByDay: (day: string): Promise<{ schedule: Schedule; patient: Patient }[]> =>
    get(`/api/schedules/by-day-with-patients?day=${encodeURIComponent(day)}`),

  // ---- Viral Serology ----
  getViralSerologyByPatient: (pid: number) =>
    get<ViralSerology[]>(`/api/patients/${pid}/viral-serology`),

  addViralSerology: (pid: number, data: Partial<ViralSerology>) =>
    post<ViralSerology>(`/api/patients/${pid}/viral-serology`, { ...data, patient_id: pid }),

  upsertViralSerology: (pid: number, data: Partial<ViralSerology>) =>
    put<ViralSerology>(`/api/patients/${pid}/viral-serology`, { ...data, patient_id: pid }),

  // ---- Anticoagulation ----
  getAnticoagulationByPatient: (pid: number) =>
    get<Anticoagulation[]>(`/api/patients/${pid}/anticoagulation`),

  addAnticoagulation: (pid: number, data: Partial<Anticoagulation>) =>
    post<Anticoagulation>(`/api/patients/${pid}/anticoagulation`, { ...data, patient_id: pid }),

  // ---- IV Access ----
  getIvAccessByPatient: (pid: number) =>
    get<IvAccess[]>(`/api/patients/${pid}/iv-access`),

  addIvAccess: (pid: number, data: Partial<IvAccess>) =>
    post<IvAccess>(`/api/patients/${pid}/iv-access`, { ...data, patient_id: pid }),

  // ---- Dry Weight ----
  getDryWeightsByPatient: (pid: number) =>
    get<DryWeight[]>(`/api/patients/${pid}/dry-weights`),

  addDryWeight: (pid: number, data: Partial<DryWeight>) =>
    post<DryWeight>(`/api/patients/${pid}/dry-weights`, { ...data, patient_id: pid }),
};
