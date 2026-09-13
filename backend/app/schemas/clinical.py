from pydantic import BaseModel
from typing import Optional
import datetime


# ===================== PatientMedication =====================
class PatientMedicationBase(BaseModel):
    patient_id: int
    drug_name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    date_written: Optional[str] = None
    note: Optional[str] = None


class PatientMedicationCreate(PatientMedicationBase):
    pass


class PatientMedicationRead(PatientMedicationBase):
    medication_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== LabInvestigation =====================
class LabInvestigationBase(BaseModel):
    patient_id: int
    investigation_code: Optional[str] = None
    investigation_name: str
    result: Optional[str] = None
    date: Optional[str] = None


class LabInvestigationCreate(LabInvestigationBase):
    pass


class LabInvestigationRead(LabInvestigationBase):
    investigation_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== Analysis =====================
class AnalysisBase(BaseModel):
    patient_id: int
    date: Optional[str] = None
    type: Optional[str] = None
    positive_ve_data: Optional[str] = None


class AnalysisCreate(AnalysisBase):
    pass


class AnalysisRead(AnalysisBase):
    analysis_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== Culture =====================
class CultureBase(BaseModel):
    patient_id: int
    date: Optional[str] = None
    specimen: Optional[str] = None
    result: Optional[str] = None
    sensitivity: Optional[str] = None


class CultureCreate(CultureBase):
    pass


class CultureRead(CultureBase):
    cultures_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== DryWeight =====================
class DryWeightBase(BaseModel):
    patient_id: int
    weight_kg: float
    recorded_date: Optional[str] = None


class DryWeightCreate(DryWeightBase):
    pass


class DryWeightRead(DryWeightBase):
    dry_weight_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== HdSchedule =====================
class HdScheduleBase(BaseModel):
    patient_id: int
    day_of_week: str                           # Sat, Sun, Mon, Tue, Wed, Thu
    period: Optional[int] = None               # 1, 2, 3, 4
    session_hours: Optional[float] = None      # 3, 3.5, 4
    room: Optional[str] = None


class HdScheduleCreate(HdScheduleBase):
    pass


class HdScheduleRead(HdScheduleBase):
    schedule_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== HdSession (Doctor Order) =====================
class HdSessionBase(BaseModel):
    patient_id: int
    session_date: Optional[str] = None
    ordered_hours: Optional[float] = None
    frequency: Optional[int] = None          # sessions per week: 1-6
    cause_of_hd: Optional[str] = None
    date_of_hd: Optional[str] = None
    doctor_name: Optional[str] = None


class HdSessionCreate(HdSessionBase):
    pass


class HdSessionUpdate(BaseModel):
    session_date: Optional[str] = None
    ordered_hours: Optional[float] = None
    frequency: Optional[int] = None
    cause_of_hd: Optional[str] = None
    date_of_hd: Optional[str] = None
    doctor_name: Optional[str] = None


class HdSessionRead(HdSessionBase):
    session_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== ViralSerology =====================
class ViralSerologyBase(BaseModel):
    patient_id: int
    date: Optional[str] = None
    hcv_status: Optional[str] = None     # Positive / Negative
    hbv_status: Optional[str] = None     # Positive / Negative
    hiv_status: Optional[str] = None     # Positive / Negative


class ViralSerologyCreate(ViralSerologyBase):
    pass


class ViralSerologyRead(ViralSerologyBase):
    serology_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== Anticoagulation =====================
class AnticoagulationBase(BaseModel):
    patient_id: int
    drug_name: Optional[str] = None     # Heparin / Clexan / Fraxiparine
    dose: Optional[str] = None          # e.g. "5000 IU"
    date: Optional[str] = None


class AnticoagulationCreate(AnticoagulationBase):
    pass


class AnticoagulationRead(AnticoagulationBase):
    anticoag_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== IvAccess =====================
class IvAccessBase(BaseModel):
    patient_id: int
    access_type: Optional[str] = None   # AV Fistula / HD Catheter Short-term / HD Catheter Long-term / Graft
    site: Optional[str] = None          # Femoral / Subclavian / Internal Jugular / Brachial / Radial
    side: Optional[str] = None          # Left / Right
    date: Optional[str] = None


class IvAccessCreate(IvAccessBase):
    pass


class IvAccessRead(IvAccessBase):
    access_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
