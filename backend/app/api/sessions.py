from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import DialysisSession, SessionMedication, SessionSignature, PatientData, User
from ..schemas.session import (
    DialysisSessionCreate, DialysisSessionUpdate, DialysisSessionRead,
    SessionMedicationCreate, SessionMedicationRead,
    SessionSignatureCreate, SessionSignatureRead,
)
from ..core.security import get_current_user, require_write_access

router = APIRouter(tags=["Dialysis Sessions"])


# ---------- All sessions (for analytics) ----------
@router.get(
    "/api/dialysis-sessions/all",
    response_model=list[DialysisSessionRead],
)
def list_all_sessions(
    limit: int = Query(5000, ge=1, le=5000),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return (
        db.query(DialysisSession)
        .order_by(DialysisSession.session_id.desc())
        .limit(limit)
        .all()
    )



# ---------- Dialysis Sessions (nested under patient) ----------
@router.get(
    "/api/patients/{patient_id}/dialysis-sessions",
    response_model=list[DialysisSessionRead],
)
def list_sessions_by_patient(
    patient_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    _ensure_patient(db, patient_id)
    return (
        db.query(DialysisSession)
        .filter(DialysisSession.patient_id == patient_id)
        .order_by(DialysisSession.session_id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post(
    "/api/patients/{patient_id}/dialysis-sessions",
    response_model=DialysisSessionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    patient_id: int,
    body: DialysisSessionCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    _ensure_patient(db, patient_id)
    data = body.model_dump()
    data["patient_id"] = patient_id
    session = DialysisSession(**data)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ---------- Dialysis Sessions by ID (top-level) ----------
@router.get(
    "/api/dialysis-sessions/{session_id}",
    response_model=DialysisSessionRead,
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    s = db.query(DialysisSession).filter(DialysisSession.session_id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@router.patch(
    "/api/dialysis-sessions/{session_id}",
    response_model=DialysisSessionRead,
)
def update_session(
    session_id: int,
    body: DialysisSessionUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    s = db.query(DialysisSession).filter(DialysisSession.session_id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return s


@router.delete(
    "/api/dialysis-sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    s = db.query(DialysisSession).filter(DialysisSession.session_id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(s)
    db.commit()


# ---------- Session Medications ----------
@router.get(
    "/api/dialysis-sessions/{session_id}/medications",
    response_model=list[SessionMedicationRead],
)
def list_session_meds(
    session_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return (
        db.query(SessionMedication)
        .filter(SessionMedication.session_id == session_id)
        .order_by(SessionMedication.id)
        .all()
    )


@router.post(
    "/api/dialysis-sessions/{session_id}/medications",
    response_model=SessionMedicationRead,
    status_code=status.HTTP_201_CREATED,
)
def add_session_med(
    session_id: int,
    body: SessionMedicationCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    data = body.model_dump()
    data["session_id"] = session_id
    med = SessionMedication(**data)
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


# ---------- Session Signatures ----------
@router.get(
    "/api/dialysis-sessions/{session_id}/signatures",
    response_model=list[SessionSignatureRead],
)
def list_session_sigs(
    session_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return (
        db.query(SessionSignature)
        .filter(SessionSignature.session_id == session_id)
        .order_by(SessionSignature.id)
        .all()
    )


@router.post(
    "/api/dialysis-sessions/{session_id}/signatures",
    response_model=SessionSignatureRead,
    status_code=status.HTTP_201_CREATED,
)
def add_session_sig(
    session_id: int,
    body: SessionSignatureCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_write_access),
):
    data = body.model_dump()
    data["session_id"] = session_id
    sig = SessionSignature(**data)
    db.add(sig)
    db.commit()
    db.refresh(sig)
    return sig


# ---------- Helpers ----------
def _ensure_patient(db: Session, patient_id: int):
    if not db.query(PatientData).filter(PatientData.patient_id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")
