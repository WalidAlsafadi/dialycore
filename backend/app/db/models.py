import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .database import Base


def _now():
    return datetime.datetime.now(datetime.UTC).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# 1) patient_data
# ---------------------------------------------------------------------------
class PatientData(Base):
    __tablename__ = "patient_data"

    patient_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name_ar = Column(String, nullable=False)
    middle_name_ar = Column(String, nullable=True)
    last_name_ar = Column(String, nullable=False)
    gender = Column(String(1), nullable=False)
    id_number = Column(String, nullable=False)
    file_number = Column(Integer, nullable=False, unique=True)
    date_of_birth = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    status = Column(String, nullable=True, default="Active")  # Active, Passed Away, Transferred
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    # relationships
    dialysis_sessions = relationship("DialysisSession", back_populates="patient", cascade="all, delete-orphan")
    patient_medications = relationship("PatientMedication", back_populates="patient", cascade="all, delete-orphan")
    lab_investigations = relationship("LabInvestigation", back_populates="patient", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="patient", cascade="all, delete-orphan")
    cultures = relationship("Culture", back_populates="patient", cascade="all, delete-orphan")
    dry_weights = relationship("DryWeight", back_populates="patient", cascade="all, delete-orphan")
    hd_schedules = relationship("HdSchedule", back_populates="patient", cascade="all, delete-orphan")
    hd_sessions = relationship("HdSession", back_populates="patient", cascade="all, delete-orphan")
    viral_serologies = relationship("ViralSerology", back_populates="patient", cascade="all, delete-orphan")
    anticoagulations = relationship("Anticoagulation", back_populates="patient", cascade="all, delete-orphan")
    iv_accesses = relationship("IvAccess", back_populates="patient", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# 2) dialysis_sessions
# ---------------------------------------------------------------------------
class DialysisSession(Base):
    __tablename__ = "dialysis_sessions"

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    session_date = Column(String, nullable=True)
    heparin_type = Column(String, nullable=True)   # "Heparin" or "Clexan" or "Fraxiparine"
    anticoagulant_dose = Column(String, nullable=True)
    access_site = Column(String, nullable=True)
    needle_size = Column(String, nullable=True)
    time_on = Column(String, nullable=True)
    time_off = Column(String, nullable=True)
    duration_hours = Column(Float, nullable=True)
    weight_before_kg = Column(Float, nullable=True)
    weight_after_kg = Column(Float, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    bp_before_sys = Column(Integer, nullable=True)
    bp_before_dia = Column(Integer, nullable=True)
    bp_after_sys = Column(Integer, nullable=True)
    bp_after_dia = Column(Integer, nullable=True)
    ufr = Column(Float, nullable=True)
    blood_flow_ml_min = Column(Integer, nullable=True)
    ven_pressure = Column(Integer, nullable=True)
    tmp = Column(Integer, nullable=True)
    anticoagulation_used = Column(Boolean, default=False)
    erythropoietin = Column(Boolean, default=False)
    venofer = Column(Boolean, default=False)
    medication_during_dialysis = Column(Text, nullable=True)  # free-text for meds given during session
    notes = Column(Text, nullable=True)
    blood_transfusion = Column(Boolean, default=False)
    blood_transfusion_rh = Column(String, nullable=True)       # e.g. "O+", "A-", etc.
    blood_transfusion_amount = Column(Float, nullable=True)    # amount in mL
    blood_transfusion_unit_type = Column(String, nullable=True) # Packed Cells / Whole Blood / F.F. Plasma / Cryoprecipitate / Platelets
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="dialysis_sessions")
    medications = relationship("SessionMedication", back_populates="session", cascade="all, delete-orphan")
    signatures = relationship("SessionSignature", back_populates="session", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# 3) session_medications
# ---------------------------------------------------------------------------
class SessionMedication(Base):
    __tablename__ = "session_medications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("dialysis_sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    med_name = Column(String, nullable=False)
    dose = Column(String, nullable=True)
    route = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    session = relationship("DialysisSession", back_populates="medications")


# ---------------------------------------------------------------------------
# 4) session_signatures
# ---------------------------------------------------------------------------
class SessionSignature(Base):
    __tablename__ = "session_signatures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("dialysis_sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    nurse_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    session = relationship("DialysisSession", back_populates="signatures")


# ---------------------------------------------------------------------------
# 5) patient_medications
# ---------------------------------------------------------------------------
class PatientMedication(Base):
    __tablename__ = "patient_medications"

    medication_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    drug_name = Column(String, nullable=False)
    dose = Column(String, nullable=True)
    frequency = Column(String, nullable=True)      # e.g. "Once daily", "Twice daily", "3 times/day"
    date_written = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="patient_medications")


# ---------------------------------------------------------------------------
# 6) lab_investigations
# ---------------------------------------------------------------------------
class LabInvestigation(Base):
    __tablename__ = "lab_investigations"

    investigation_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_code = Column(String, nullable=True)
    investigation_name = Column(String, nullable=False)
    result = Column(String, nullable=True)
    date = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="lab_investigations")


# ---------------------------------------------------------------------------
# 7) analysis
# ---------------------------------------------------------------------------
class Analysis(Base):
    __tablename__ = "analysis"

    analysis_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String, nullable=True)
    type = Column(String, nullable=True)
    positive_ve_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="analyses")


# ---------------------------------------------------------------------------
# 8) cultures
# ---------------------------------------------------------------------------
class Culture(Base):
    __tablename__ = "cultures"

    cultures_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String, nullable=True)
    specimen = Column(String, nullable=True)
    result = Column(String, nullable=True)
    sensitivity = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="cultures")


# ---------------------------------------------------------------------------
# 9) dry_weight
# ---------------------------------------------------------------------------
class DryWeight(Base):
    __tablename__ = "dry_weight"

    dry_weight_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    weight_kg = Column(Float, nullable=False)
    recorded_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="dry_weights")


# ---------------------------------------------------------------------------
# 10) hd_schedule
# ---------------------------------------------------------------------------
class HdSchedule(Base):
    __tablename__ = "hd_schedule"

    schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(String, nullable=False)       # Sat, Sun, Mon, Tue, Wed, Thu
    period = Column(Integer, nullable=True)             # 1, 2, 3, 4
    session_hours = Column(Float, nullable=True)        # 3, 3.5, 4
    room = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="hd_schedules")


# ---------------------------------------------------------------------------
# 11) hd_sessions  (Doctor Orders)
# ---------------------------------------------------------------------------
class HdSession(Base):
    __tablename__ = "hd_sessions"

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    session_date = Column(String, nullable=True)
    ordered_hours = Column(Float, nullable=True)
    frequency = Column(Integer, nullable=True)        # sessions per week: 1, 2, 3, 4, 5, 6
    cause_of_hd = Column(String, nullable=True)
    date_of_hd = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="hd_sessions")


# ---------------------------------------------------------------------------
# 12) viral_serology
# ---------------------------------------------------------------------------
class ViralSerology(Base):
    __tablename__ = "viral_serology"

    serology_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String, nullable=True)
    hcv_status = Column(String, nullable=True)    # Positive / Negative
    hbv_status = Column(String, nullable=True)    # Positive / Negative
    hiv_status = Column(String, nullable=True)    # Positive / Negative
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="viral_serologies")


# ---------------------------------------------------------------------------
# 13) anticoagulation
# ---------------------------------------------------------------------------
class Anticoagulation(Base):
    __tablename__ = "anticoagulation"

    anticoag_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    drug_name = Column(String, nullable=True)      # Heparin / Clexan / Fraxiparine
    dose = Column(String, nullable=True)            # e.g. "5000 IU"
    date = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="anticoagulations")


# ---------------------------------------------------------------------------
# 14) iv_access
# ---------------------------------------------------------------------------
class IvAccess(Base):
    __tablename__ = "iv_access"

    access_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_data.patient_id", ondelete="CASCADE"), nullable=False, index=True)
    access_type = Column(String, nullable=True)    # AV Fistula / HD Catheter Short-term / HD Catheter Long-term / Graft
    site = Column(String, nullable=True)           # Femoral / Subclavian / Internal Jugular / Brachial / Radial
    side = Column(String, nullable=True)           # Left / Right
    date = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    patient = relationship("PatientData", back_populates="iv_accesses")


# ---------------------------------------------------------------------------
# 15) users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="nurse")  # admin | doctor | nurse
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    audit_logs = relationship("AuditLog", back_populates="user")


# ---------------------------------------------------------------------------
# 16) audit_log
# ---------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_log"

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entity = Column(String, nullable=True)   # table/resource name
    entity_id = Column(String, nullable=True)
    at = Column(DateTime, default=_now)
    meta_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="audit_logs")
