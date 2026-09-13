from pydantic import BaseModel
from typing import Optional
import datetime


# ===================== Patient =====================
class PatientBase(BaseModel):
    first_name_ar: str
    middle_name_ar: Optional[str] = None
    last_name_ar: str
    gender: str
    id_number: str
    file_number: Optional[int] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    status: Optional[str] = None  # Active, Passed Away, Transferred


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name_ar: Optional[str] = None
    middle_name_ar: Optional[str] = None
    last_name_ar: Optional[str] = None
    gender: Optional[str] = None
    id_number: Optional[str] = None
    file_number: Optional[int] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    status: Optional[str] = None


class PatientRead(PatientBase):
    patient_id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}
