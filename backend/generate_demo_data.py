"""Generate deterministic, independent, fictional DialyCore demo data.

Nothing in this module is sampled or derived from patient data. Clinical values
are plausible UI fixtures only and must never be used for clinical decisions.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import random
from pathlib import Path

from sqlalchemy import create_engine, event, func
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.db.models import (
    Analysis, Anticoagulation, AuditLog, Base, Culture, DialysisSession,
    DryWeight, HdSchedule, HdSession, IvAccess, LabInvestigation, PatientData,
    PatientMedication, SessionMedication, SessionSignature, User, ViralSerology,
)

DEMO_DATABASE_NAME = "dialycore_demo.db"
DEFAULT_OUTPUT = Path(__file__).with_name(DEMO_DATABASE_NAME)
DEFAULT_ANCHOR_DATE = dt.date(2026, 9, 1)
DEMO_PASSWORD = "DialyCoreDemo!2026"

MALE_NAMES = ["أحمد", "محمد", "محمود", "يوسف", "خالد", "عمر", "سليم", "رامي", "سامر", "طارق", "إياد", "زياد", "فادي", "ماهر", "نبيل", "وليد", "هاني", "أنس", "باسل", "معاذ"]
FEMALE_NAMES = ["مريم", "سارة", "ليان", "نور", "هدى", "آية", "رنا", "دانا", "سلمى", "حنان", "ميس", "عبير", "نسرين", "ريم", "أمل", "إيمان", "ربى", "شهد", "سناء", "وفاء"]
MIDDLE_NAMES = ["أحمد", "محمود", "إبراهيم", "خليل", "سعيد", "حسن", "مصطفى", "عبد الله", "عادل", "جميل", "صلاح", "نجيب", "رشيد", "منير", "توفيق"]
FAMILY_NAMES = ["الكرمي", "القدسي", "الخالدي", "الصفدي", "التميمي", "الدجاني", "النعيمي", "البرغوثي", "الريماوي", "الجريري", "الحموي", "العابد", "السالم", "الناصر", "الحماد", "الزيتاوي", "الطيبي", "الربعي", "العمري", "البدوي", "الشامي", "المصري", "الحداد", "النجار", "الخطيب", "البيطار", "الراعي", "السميري", "الوافي", "الصالح"]
CITIES = ["القدس", "رام الله", "الخليل", "نابلس", "بيت لحم", "جنين", "طولكرم", "قلقيلية", "أريحا", "غزة", "خان يونس", "دير البلح", "رفح", "سلفيت", "طوباس"]
DISTRICTS = ["المركز", "الشمالية", "الجنوبية", "الشرقية", "الغربية", "البلدة القديمة"]
BLOOD_GROUPS = ["O+", "O+", "O+", "A+", "A+", "B+", "AB+", "O-", "A-", "B-"]
SCHEDULE_PATTERNS = [("Sat", "Mon", "Wed"), ("Sun", "Tue", "Thu")]
MEDICATIONS = [
    ("Calcium carbonate", "600 mg", "Twice daily"),
    ("Calcitriol", "0.25 mcg", "Once daily"),
    ("Amlodipine", "5 mg", "Once daily"),
    ("Sevelamer", "800 mg", "With meals"),
    ("Folic acid", "5 mg", "Once daily"),
    ("Omeprazole", "20 mg", "Once daily"),
]
LABS = [
    ("HB", "Hemoglobin", 8.8, 12.8, "{:.1f}"),
    ("CREAT", "Creatinine", 5.0, 12.0, "{:.1f}"),
    ("UREA", "Urea", 70, 190, "{:.0f}"),
    ("K", "Potassium", 3.7, 5.8, "{:.1f}"),
    ("CA", "Calcium", 7.8, 9.8, "{:.1f}"),
    ("PO4", "Phosphate", 3.0, 6.8, "{:.1f}"),
    ("ALB", "Albumin", 3.1, 4.5, "{:.1f}"),
    ("PTH", "Parathyroid hormone", 120, 720, "{:.0f}"),
]


def _recent_dates(anchor: dt.date, days: tuple[str, ...], count: int) -> list[dt.date]:
    dates = []
    while len(dates) < count:
        if anchor.strftime("%a") in days:
            dates.append(anchor)
        anchor -= dt.timedelta(days=1)
    return dates


def _time_off(time_on: str, duration: float) -> str:
    start = dt.datetime.strptime(time_on, "%H:%M")
    return (start + dt.timedelta(hours=duration)).strftime("%H:%M")


def _safe_reset(path: Path) -> None:
    """Replace only a regular, specifically named demo database."""
    if path.name != DEMO_DATABASE_NAME:
        raise ValueError(f"Demo output must be named {DEMO_DATABASE_NAME!r}")
    if path.is_symlink():
        raise ValueError("Refusing to replace a symlinked demo database")
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if not path.is_file():
            raise ValueError("Demo database path is not a regular file")
        path.unlink()


def generate_demo_data(
    patient_count: int = 300,
    seed: int = 2026,
    output_path: Path = DEFAULT_OUTPUT,
    anchor_date: dt.date = DEFAULT_ANCHOR_DATE,
) -> dict[str, int]:
    if not 1 <= patient_count <= 5_000:
        raise ValueError("patient_count must be between 1 and 5000")
    output_path = Path(output_path).resolve()
    _safe_reset(output_path)
    rng = random.Random(seed)
    engine = create_engine(f"sqlite:///{output_path.as_posix()}")

    @event.listens_for(engine, "connect")
    def _foreign_keys(connection, _record):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    fixed_timestamp = dt.datetime.combine(anchor_date, dt.time(9))

    @event.listens_for(db, "before_flush")
    def _deterministic_timestamps(session, _flush_context, _instances):
        for record in session.new:
            if hasattr(record, "created_at") and record.created_at is None:
                record.created_at = fixed_timestamp
            if hasattr(record, "updated_at") and record.updated_at is None:
                record.updated_at = fixed_timestamp

    users = [
        User(email="admin@demo.dialycore.local", full_name="Demo Administrator", password_hash=hash_password(DEMO_PASSWORD), role="admin"),
        User(email="doctor@demo.dialycore.local", full_name="Demo Doctor", password_hash=hash_password(DEMO_PASSWORD), role="doctor"),
        User(email="nurse@demo.dialycore.local", full_name="Demo Nurse", password_hash=hash_password(DEMO_PASSWORD), role="nurse"),
        User(email="guest@demo.dialycore.local", full_name="Guest Visitor", password_hash=hash_password("guest-password-login-disabled"), role="guest"),
    ]
    db.add_all(users)
    db.flush()

    name_space = len(MALE_NAMES) * len(MIDDLE_NAMES) * len(FAMILY_NAMES)
    if patient_count > name_space:
        raise ValueError(f"patient_count cannot exceed {name_space}")
    combinations = rng.sample(range(name_space), patient_count)
    patients = []
    for index, combination in enumerate(combinations, start=1):
        gender = "F" if index % 20 < 9 else "M"
        first_pool = FEMALE_NAMES if gender == "F" else MALE_NAMES
        age = rng.randint(19, 88)
        patient = PatientData(
            first_name_ar=first_pool[combination % len(first_pool)],
            middle_name_ar=MIDDLE_NAMES[(combination // len(first_pool)) % len(MIDDLE_NAMES)],
            last_name_ar=FAMILY_NAMES[(combination // (len(first_pool) * len(MIDDLE_NAMES))) % len(FAMILY_NAMES)],
            gender=gender,
            id_number=f"DEMO-{index:06d}",
            file_number=900000 + index,
            date_of_birth=(anchor_date - dt.timedelta(days=age * 365 + rng.randint(0, 364))).isoformat(),
            blood_group=BLOOD_GROUPS[index % len(BLOOD_GROUPS)],
            mobile=f"DEMO-PHONE-{index:06d}",
            city=CITIES[index % len(CITIES)],
            district=DISTRICTS[(index * 3) % len(DISTRICTS)],
            status="Transferred" if index % 20 == 0 else "Passed Away" if index % 20 == 1 else "Active",
            created_at=dt.datetime.combine(anchor_date - dt.timedelta(days=500), dt.time(9)),
        )
        patients.append(patient)
    db.add_all(patients)
    db.flush()

    for index, patient in enumerate(patients, start=1):
        dry_weight = round(rng.uniform(48.0, 104.0), 1)
        pattern = SCHEDULE_PATTERNS[index % 2]
        period = 1 + index % 4
        duration = (3.5, 4.0, 4.0, 4.5)[index % 4]
        if patient.status == "Active":
            db.add_all([HdSchedule(patient_id=patient.patient_id, day_of_week=day, period=period, session_hours=duration, room=f"Demo Room {1 + index % 6}") for day in pattern])

        db.add(IvAccess(patient_id=patient.patient_id, access_type=("AV Fistula", "AV Fistula", "Graft", "HD Catheter Long-term")[index % 4], site=("Brachial", "Radial", "Internal Jugular")[index % 3], side=("Left", "Right")[index % 2], date=(anchor_date - dt.timedelta(days=150 + index % 700)).isoformat()))
        if index % 10 == 0:
            db.add(IvAccess(patient_id=patient.patient_id, access_type="HD Catheter Short-term", site="Internal Jugular", side="Right", date=(anchor_date - dt.timedelta(days=800)).isoformat()))
        for history in range(3):
            db.add(DryWeight(patient_id=patient.patient_id, weight_kg=round(dry_weight + (history - 2) * rng.uniform(-0.5, 0.5), 1), recorded_date=(anchor_date - dt.timedelta(days=history * 45)).isoformat()))
        for offset in range(2 + index % 4):
            drug, dose, frequency = MEDICATIONS[(index + offset) % len(MEDICATIONS)]
            db.add(PatientMedication(patient_id=patient.patient_id, drug_name=drug, dose=dose, frequency=frequency, date_written=(anchor_date - dt.timedelta(days=30 + offset * 20)).isoformat(), note="Synthetic demonstration prescription."))
        for month in range(4):
            lab_date = anchor_date - dt.timedelta(days=month * 30 + index % 8)
            for code, name, low, high, formatter in LABS:
                db.add(LabInvestigation(patient_id=patient.patient_id, investigation_code=code, investigation_name=name, result=formatter.format(rng.uniform(low, high)), date=lab_date.isoformat()))
        for offset in (0, 180):
            db.add(ViralSerology(patient_id=patient.patient_id, date=(anchor_date - dt.timedelta(days=offset)).isoformat(), hcv_status="Positive" if index % 23 == 0 else "Negative", hbv_status="Positive" if index % 47 == 0 else "Negative", hiv_status="Positive" if index % 149 == 0 else "Negative"))
        db.add(Anticoagulation(patient_id=patient.patient_id, drug_name=("Heparin", "Heparin", "Clexan", "Fraxiparine")[index % 4], dose=("2500 IU", "5000 IU", "40 mg")[index % 3], date=(anchor_date - dt.timedelta(days=index % 28)).isoformat()))
        db.add(Analysis(patient_id=patient.patient_id, date=(anchor_date - dt.timedelta(days=index % 30)).isoformat(), type="Monthly dialysis review", positive_ve_data="Synthetic review flag" if index % 17 == 0 else "No demo flags"))
        if index % 5 == 0:
            positive = index % 20 == 0
            db.add(Culture(patient_id=patient.patient_id, date=(anchor_date - dt.timedelta(days=index % 90)).isoformat(), specimen=("Blood", "Catheter tip", "Wound swab")[index % 3], result="Synthetic organism isolated" if positive else "No growth", sensitivity="Synthetic sensitivity panel" if positive else "Not applicable"))

        order_count = 2 if patient.status == "Active" and index % 2 == 0 else 1
        for order in range(order_count):
            db.add(HdSession(patient_id=patient.patient_id, session_date=(anchor_date - dt.timedelta(days=order * 120 + index % 20)).isoformat(), ordered_hours=duration, frequency=3, cause_of_hd=("Diabetic kidney disease", "Hypertensive kidney disease", "Chronic glomerular disease")[index % 3], date_of_hd=(anchor_date - dt.timedelta(days=365 + index % 730)).isoformat(), doctor_name=f"Demo Doctor {1 + index % 3}"))

        session_count = 12 if patient.status == "Active" else 6
        for session_index, session_date in enumerate(_recent_dates(anchor_date, pattern, session_count)):
            gain = rng.uniform(1.2, 3.8)
            weight_before = round(dry_weight + gain, 1)
            weight_after = round(min(weight_before, dry_weight + rng.uniform(-0.3, 0.4)), 1)
            start_time = ("06:30", "10:30", "14:30", "18:30")[period - 1]
            transfusion = (index * 17 + session_index) % 97 == 0
            selector = (index * 13 + session_index) % 79
            notes = "Synthetic demo event: transient hypotension resolved per demo protocol." if selector == 0 else "Synthetic demo event: muscle cramps resolved during session." if selector == 1 else "Synthetic demonstration session completed without recorded complications."
            session = DialysisSession(
                patient_id=patient.patient_id, session_date=session_date.isoformat(),
                heparin_type=("Heparin", "Heparin", "Clexan", "Fraxiparine")[index % 4], anticoagulant_dose=("2500 IU", "5000 IU", "40 mg")[index % 3],
                access_site=f"{('Left', 'Right')[index % 2]} {('Brachial', 'Radial', 'Internal Jugular')[index % 3]}", needle_size=("G15", "G16", "G17")[index % 3],
                time_on=start_time, time_off=_time_off(start_time, duration), duration_hours=duration,
                weight_before_kg=weight_before, weight_after_kg=weight_after, target_weight_kg=dry_weight,
                bp_before_sys=rng.randint(118, 175), bp_before_dia=rng.randint(68, 100), bp_after_sys=rng.randint(105, 155), bp_after_dia=rng.randint(62, 92),
                ufr=round((weight_before - weight_after) * 1000 / duration), blood_flow_ml_min=rng.choice((250, 275, 300, 325, 350)), ven_pressure=rng.randint(90, 190), tmp=rng.randint(30, 110),
                anticoagulation_used=index % 13 != 0, erythropoietin=(index + session_index) % 2 == 0, venofer=(index + session_index) % 5 == 0,
                medication_during_dialysis="See structured synthetic administrations.", notes=notes,
                blood_transfusion=transfusion, blood_transfusion_rh=patient.blood_group if transfusion else None,
                blood_transfusion_amount=250.0 if transfusion else None, blood_transfusion_unit_type="Packed Cells" if transfusion else None,
            )
            db.add(session)
            db.flush()
            if session.erythropoietin:
                db.add(SessionMedication(session_id=session.session_id, med_name="Epoetin alfa", dose="4000 IU", route="IV"))
            if session.venofer:
                db.add(SessionMedication(session_id=session.session_id, med_name="Iron sucrose", dose="100 mg", route="IV"))
            db.add(SessionSignature(session_id=session.session_id, nurse_name=f"Demo Nurse {1 + (index + session_index) % 4}"))

    for index in range(36):
        db.add(AuditLog(user_id=users[index % 3].user_id, action=("LOGIN", "VIEW", "CREATE", "UPDATE")[index % 4], entity=("patients", "dialysis_sessions", "lab_investigations")[index % 3], entity_id=f"DEMO-{index + 1:04d}", at=dt.datetime.combine(anchor_date - dt.timedelta(days=index), dt.time(10)), meta_json=json.dumps({"synthetic": True})))

    db.commit()
    models = [User, PatientData, HdSchedule, DialysisSession, SessionMedication, SessionSignature, PatientMedication, LabInvestigation, Analysis, Culture, DryWeight, HdSession, ViralSerology, Anticoagulation, IvAccess, AuditLog]
    counts = {model.__tablename__: db.query(func.count()).select_from(model).scalar() for model in models}
    db.close()
    engine.dispose()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--patients", type=int, default=300)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--anchor-date", type=dt.date.fromisoformat, default=DEFAULT_ANCHOR_DATE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    counts = generate_demo_data(args.patients, args.seed, args.output, args.anchor_date)
    print(f"Created {args.output} with independent synthetic data:")
    print(json.dumps(counts, indent=2, sort_keys=True))
    print("Staff accounts use the documented demo password; guest access is passwordless.")


if __name__ == "__main__":
    main()
