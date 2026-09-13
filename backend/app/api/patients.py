from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import datetime

from ..db.database import get_db
from ..db.models import PatientData, User, DialysisSession
from ..schemas.patient import PatientCreate, PatientUpdate, PatientRead
from ..core.security import get_current_user, require_write_access

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def _generate_file_number(db: Session) -> int:
    """Auto-generate file number as max + 1."""
    result = db.query(func.max(PatientData.file_number)).scalar()
    return (result or 0) + 1


@router.get("", response_model=list[PatientRead])
def list_patients(
    limit: int = Query(5000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    q = db.query(PatientData)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (PatientData.first_name_ar.ilike(pattern))
            | (PatientData.last_name_ar.ilike(pattern))
            | (PatientData.id_number.ilike(pattern))
        )
    return q.order_by(PatientData.patient_id).offset(offset).limit(limit).all()


@router.get("/count")
def count_patients(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return {"count": db.query(PatientData).count()}


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    p = db.query(PatientData).filter(PatientData.patient_id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    body: PatientCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    data = body.model_dump()

    # Auto-generate file number if not provided
    if not data.get("file_number"):
        data["file_number"] = _generate_file_number(db)
    else:
        # Check unique file number
        if db.query(PatientData).filter(PatientData.file_number == data["file_number"]).first():
            raise HTTPException(status_code=400, detail="File number already exists")

    patient = PatientData(**data)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.patch("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: int,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    patient = db.query(PatientData).filter(PatientData.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    patient = db.query(PatientData).filter(PatientData.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
