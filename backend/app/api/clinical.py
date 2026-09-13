"""
Clinical-data endpoints for all patient-nested resources.
Each resource follows: list, create, (get by id), (delete by id).
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..db.models import (
    PatientData, PatientMedication, LabInvestigation, Analysis, Culture,
    DryWeight, HdSchedule, HdSession, ViralSerology, Anticoagulation, IvAccess, User,
)
from ..schemas.clinical import (
    PatientMedicationCreate, PatientMedicationRead,
    LabInvestigationCreate, LabInvestigationRead,
    AnalysisCreate, AnalysisRead,
    CultureCreate, CultureRead,
    DryWeightCreate, DryWeightRead,
    HdScheduleCreate, HdScheduleRead,
    HdSessionCreate, HdSessionUpdate, HdSessionRead,
    ViralSerologyCreate, ViralSerologyRead,
    AnticoagulationCreate, AnticoagulationRead,
    IvAccessCreate, IvAccessRead,
)
from ..core.security import get_current_user, require_write_access

router = APIRouter(tags=["Clinical"])


def _ensure_patient(db: Session, patient_id: int):
    if not db.query(PatientData).filter(PatientData.patient_id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")


# ===================== Patient Medications =====================
@router.get("/api/patients/{patient_id}/patient-medications", response_model=list[PatientMedicationRead])
def list_patient_meds(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(PatientMedication).filter(PatientMedication.patient_id == patient_id).order_by(PatientMedication.medication_id.desc()).all()


@router.post("/api/patients/{patient_id}/patient-medications", response_model=PatientMedicationRead, status_code=201)
def add_patient_med(patient_id: int, body: PatientMedicationCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = PatientMedication(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/api/patients/{patient_id}/patient-medications/{med_id}", status_code=204)
def delete_patient_med(patient_id: int, med_id: int, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(PatientMedication).filter(PatientMedication.medication_id == med_id, PatientMedication.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.delete(obj)
    db.commit()


class MedicationUpdate(BaseModel):
    drug_name: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    date_written: Optional[str] = None
    note: Optional[str] = None


@router.put("/api/patients/{patient_id}/patient-medications/{med_id}", response_model=PatientMedicationRead)
def update_patient_med(patient_id: int, med_id: int, body: MedicationUpdate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(PatientMedication).filter(PatientMedication.medication_id == med_id, PatientMedication.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Medication not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


# ===================== Lab Investigations =====================
@router.get("/api/patients/{patient_id}/labs", response_model=list[LabInvestigationRead])
def list_labs(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(LabInvestigation).filter(LabInvestigation.patient_id == patient_id).order_by(LabInvestigation.investigation_id.desc()).all()


@router.post("/api/patients/{patient_id}/labs", response_model=LabInvestigationRead, status_code=201)
def add_lab(patient_id: int, body: LabInvestigationCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = LabInvestigation(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/api/patients/{patient_id}/labs/{lab_id}", status_code=204)
def delete_lab(patient_id: int, lab_id: int, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(LabInvestigation).filter(LabInvestigation.investigation_id == lab_id, LabInvestigation.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Lab not found")
    db.delete(obj)
    db.commit()


# ===================== Analysis =====================
@router.get("/api/patients/{patient_id}/analysis", response_model=list[AnalysisRead])
def list_analysis(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(Analysis).filter(Analysis.patient_id == patient_id).order_by(Analysis.analysis_id.desc()).all()


@router.post("/api/patients/{patient_id}/analysis", response_model=AnalysisRead, status_code=201)
def add_analysis(patient_id: int, body: AnalysisCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = Analysis(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ===================== Cultures =====================
@router.get("/api/patients/{patient_id}/cultures", response_model=list[CultureRead])
def list_cultures(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(Culture).filter(Culture.patient_id == patient_id).order_by(Culture.cultures_id.desc()).all()


@router.post("/api/patients/{patient_id}/cultures", response_model=CultureRead, status_code=201)
def add_culture(patient_id: int, body: CultureCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = Culture(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


class CultureUpdate(BaseModel):
    date: Optional[str] = None
    specimen: Optional[str] = None
    result: Optional[str] = None
    sensitivity: Optional[str] = None


@router.put("/api/patients/{patient_id}/cultures/{culture_id}", response_model=CultureRead)
def update_culture(patient_id: int, culture_id: int, body: CultureUpdate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(Culture).filter(Culture.cultures_id == culture_id, Culture.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Culture not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/api/patients/{patient_id}/cultures/{culture_id}", status_code=204)
def delete_culture(patient_id: int, culture_id: int, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(Culture).filter(Culture.cultures_id == culture_id, Culture.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Culture not found")
    db.delete(obj)
    db.commit()



# ===================== Dry Weights =====================
@router.get("/api/patients/{patient_id}/dry-weights", response_model=list[DryWeightRead])
def list_dry_weights(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(DryWeight).filter(DryWeight.patient_id == patient_id).order_by(DryWeight.dry_weight_id.desc()).all()


@router.post("/api/patients/{patient_id}/dry-weights", response_model=DryWeightRead, status_code=201)
def add_dry_weight(patient_id: int, body: DryWeightCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = DryWeight(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ===================== HD Schedule =====================
@router.get("/api/patients/{patient_id}/hd-schedule", response_model=list[HdScheduleRead])
def list_hd_schedule(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(HdSchedule).filter(HdSchedule.patient_id == patient_id).order_by(HdSchedule.schedule_id).all()


@router.post("/api/patients/{patient_id}/hd-schedule", response_model=HdScheduleRead, status_code=201)
def add_hd_schedule(patient_id: int, body: HdScheduleCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = HdSchedule(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


class BulkScheduleItem(BaseModel):
    day_of_week: str
    period: Optional[int] = None
    session_hours: Optional[float] = None
    room: Optional[str] = None


class BulkScheduleBody(BaseModel):
    slots: list[BulkScheduleItem]


@router.put("/api/patients/{patient_id}/hd-schedule/bulk", response_model=list[HdScheduleRead])
def bulk_replace_hd_schedule(patient_id: int, body: BulkScheduleBody, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    """Replace ALL schedule slots for a patient at once."""
    _ensure_patient(db, patient_id)
    # Delete all existing
    db.query(HdSchedule).filter(HdSchedule.patient_id == patient_id).delete()
    # Insert new
    created = []
    for slot in body.slots:
        obj = HdSchedule(patient_id=patient_id, day_of_week=slot.day_of_week, period=slot.period, session_hours=slot.session_hours, room=slot.room)
        db.add(obj)
        created.append(obj)
    db.commit()
    for o in created:
        db.refresh(o)
    return created


@router.delete("/api/patients/{patient_id}/hd-schedule/{schedule_id}", status_code=204)
def delete_hd_schedule(patient_id: int, schedule_id: int, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(HdSchedule).filter(HdSchedule.schedule_id == schedule_id, HdSchedule.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(obj)
    db.commit()


# ---------- Schedule by day (for dashboard) — single JOIN, no N+1 ----------
class ScheduleWithPatientRead(BaseModel):
    schedule: HdScheduleRead
    patient: dict

    model_config = {"from_attributes": True}


@router.get("/api/schedules/by-day-with-patients")
def schedules_by_day_with_patients(
    day: str,
    db: Session = Depends(get_db),
    _u: User = Depends(get_current_user),
):
    """Return all schedules for a given day, with patient info embedded.
    A single JOIN query replaces the previous N+1 pattern.
    """
    rows = (
        db.query(HdSchedule, PatientData)
        .join(PatientData, HdSchedule.patient_id == PatientData.patient_id)
        .filter(HdSchedule.day_of_week == day)
        .all()
    )
    result = []
    for sched, patient in rows:
        result.append({
            "schedule": {
                "schedule_id": sched.schedule_id,
                "patient_id": sched.patient_id,
                "day_of_week": sched.day_of_week,
                "period": sched.period,
                "session_hours": sched.session_hours,
                "room": sched.room,
                "created_at": sched.created_at,
                "updated_at": sched.updated_at,
            },
            "patient": {
                "patient_id": patient.patient_id,
                "first_name_ar": patient.first_name_ar,
                "middle_name_ar": patient.middle_name_ar,
                "last_name_ar": patient.last_name_ar,
                "file_number": patient.file_number,
                "blood_group": patient.blood_group,
                "date_of_birth": str(patient.date_of_birth) if patient.date_of_birth else None,
                "gender": patient.gender,
                "mobile": patient.mobile,
                "city": patient.city,
                "district": patient.district,
                "id_number": patient.id_number,
            },
        })
    return result


# ---------- Schedule by day (legacy, kept for backward compat) ----------
@router.get("/api/schedules/by-day", response_model=list[HdScheduleRead])
def schedules_by_day(day: str, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    return db.query(HdSchedule).filter(HdSchedule.day_of_week == day).all()


# ===================== HD Sessions (Doctor Orders) =====================
@router.get("/api/patients/{patient_id}/hd-sessions", response_model=list[HdSessionRead])
def list_hd_sessions(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(HdSession).filter(HdSession.patient_id == patient_id).order_by(HdSession.session_id.desc()).all()


@router.post("/api/patients/{patient_id}/hd-sessions", response_model=HdSessionRead, status_code=201)
def add_hd_session(patient_id: int, body: HdSessionCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = HdSession(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/api/patients/{patient_id}/hd-sessions/{session_id}", response_model=HdSessionRead)
def update_hd_session(patient_id: int, session_id: int, body: HdSessionUpdate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    obj = db.query(HdSession).filter(HdSession.session_id == session_id, HdSession.patient_id == patient_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="HD Session not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


# ===================== Viral Serology =====================
@router.get("/api/patients/{patient_id}/viral-serology", response_model=list[ViralSerologyRead])
def list_serology(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(ViralSerology).filter(ViralSerology.patient_id == patient_id).order_by(ViralSerology.serology_id.desc()).all()


@router.post("/api/patients/{patient_id}/viral-serology", response_model=ViralSerologyRead, status_code=201)
def add_serology(patient_id: int, body: ViralSerologyCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = ViralSerology(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/api/patients/{patient_id}/viral-serology", response_model=ViralSerologyRead)
def upsert_serology(patient_id: int, body: ViralSerologyCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    """Update the latest existing serology or create a new one."""
    _ensure_patient(db, patient_id)
    existing = db.query(ViralSerology).filter(ViralSerology.patient_id == patient_id).order_by(ViralSerology.serology_id.desc()).first()
    if existing:
        for key, value in body.model_dump(exclude_unset=True).items():
            if key != "patient_id":
                setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        data = body.model_dump()
        data["patient_id"] = patient_id
        obj = ViralSerology(**data)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj


# ===================== Anticoagulation =====================
@router.get("/api/patients/{patient_id}/anticoagulation", response_model=list[AnticoagulationRead])
def list_anticoag(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(Anticoagulation).filter(Anticoagulation.patient_id == patient_id).order_by(Anticoagulation.anticoag_id.desc()).all()


@router.post("/api/patients/{patient_id}/anticoagulation", response_model=AnticoagulationRead, status_code=201)
def add_anticoag(patient_id: int, body: AnticoagulationCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = Anticoagulation(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ===================== IV Access =====================
@router.get("/api/patients/{patient_id}/iv-access", response_model=list[IvAccessRead])
def list_iv_access(patient_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    _ensure_patient(db, patient_id)
    return db.query(IvAccess).filter(IvAccess.patient_id == patient_id).order_by(IvAccess.access_id.desc()).all()


@router.post("/api/patients/{patient_id}/iv-access", response_model=IvAccessRead, status_code=201)
def add_iv_access(patient_id: int, body: IvAccessCreate, db: Session = Depends(get_db), _u: User = Depends(require_write_access)):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    obj = IvAccess(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
