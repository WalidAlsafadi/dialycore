from pydantic import BaseModel
from typing import Optional
import datetime


# ===================== DialysisSession =====================
class DialysisSessionBase(BaseModel):
    patient_id: int
    session_date: Optional[str] = None
    heparin_type: Optional[str] = None
    anticoagulant_dose: Optional[str] = None
    access_site: Optional[str] = None
    needle_size: Optional[str] = None
    time_on: Optional[str] = None
    time_off: Optional[str] = None
    duration_hours: Optional[float] = None
    weight_before_kg: Optional[float] = None
    weight_after_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    bp_before_sys: Optional[int] = None
    bp_before_dia: Optional[int] = None
    bp_after_sys: Optional[int] = None
    bp_after_dia: Optional[int] = None
    ufr: Optional[float] = None
    blood_flow_ml_min: Optional[int] = None
    ven_pressure: Optional[int] = None
    tmp: Optional[int] = None
    anticoagulation_used: Optional[bool] = False
    erythropoietin: Optional[bool] = False
    venofer: Optional[bool] = False
    medication_during_dialysis: Optional[str] = None
    notes: Optional[str] = None
    blood_transfusion: Optional[bool] = False
    blood_transfusion_rh: Optional[str] = None
    blood_transfusion_amount: Optional[float] = None
    blood_transfusion_unit_type: Optional[str] = None


class DialysisSessionCreate(DialysisSessionBase):
    pass


class DialysisSessionUpdate(BaseModel):
    session_date: Optional[str] = None
    heparin_type: Optional[str] = None
    anticoagulant_dose: Optional[str] = None
    access_site: Optional[str] = None
    needle_size: Optional[str] = None
    time_on: Optional[str] = None
    time_off: Optional[str] = None
    duration_hours: Optional[float] = None
    weight_before_kg: Optional[float] = None
    weight_after_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    bp_before_sys: Optional[int] = None
    bp_before_dia: Optional[int] = None
    bp_after_sys: Optional[int] = None
    bp_after_dia: Optional[int] = None
    ufr: Optional[float] = None
    blood_flow_ml_min: Optional[int] = None
    ven_pressure: Optional[int] = None
    tmp: Optional[int] = None
    anticoagulation_used: Optional[bool] = None
    erythropoietin: Optional[bool] = None
    venofer: Optional[bool] = None
    medication_during_dialysis: Optional[str] = None
    notes: Optional[str] = None
    blood_transfusion: Optional[bool] = None
    blood_transfusion_rh: Optional[str] = None
    blood_transfusion_amount: Optional[float] = None
    blood_transfusion_unit_type: Optional[str] = None


class DialysisSessionRead(DialysisSessionBase):
    session_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== SessionMedication =====================
class SessionMedicationBase(BaseModel):
    session_id: int
    med_name: str
    dose: Optional[str] = None
    route: Optional[str] = None


class SessionMedicationCreate(SessionMedicationBase):
    pass


class SessionMedicationRead(SessionMedicationBase):
    id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


# ===================== SessionSignature =====================
class SessionSignatureBase(BaseModel):
    session_id: int
    nurse_name: str


class SessionSignatureCreate(SessionSignatureBase):
    pass


class SessionSignatureRead(SessionSignatureBase):
    id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
