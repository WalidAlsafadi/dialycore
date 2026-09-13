import datetime as dt
import sqlite3
from pathlib import Path

import pytest

from generate_demo_data import DEMO_DATABASE_NAME, generate_demo_data


@pytest.fixture()
def demo_database(tmp_path: Path):
    path = tmp_path / DEMO_DATABASE_NAME
    counts = generate_demo_data(24, 2026, path, dt.date(2026, 9, 1))
    return path, counts


def test_generator_counts_and_identifiers(demo_database):
    path, counts = demo_database
    assert counts["patient_data"] == 24
    assert counts["users"] == 4
    assert counts["dialysis_sessions"] > 200
    assert counts["lab_investigations"] == 24 * 4 * 8

    connection = sqlite3.connect(path)
    rows = connection.execute(
        "SELECT id_number, file_number, mobile FROM patient_data"
    ).fetchall()
    assert len({row[0] for row in rows}) == 24
    assert len({row[1] for row in rows}) == 24
    assert all(row[0].startswith("DEMO-") for row in rows)
    assert all(row[2].startswith("DEMO-PHONE-") for row in rows)
    assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    connection.close()


def test_clinical_invariants(demo_database):
    path, _counts = demo_database
    connection = sqlite3.connect(path)
    invalid_schedule = connection.execute(
        """SELECT COUNT(*) FROM hd_schedule
           WHERE day_of_week NOT IN ('Sat','Sun','Mon','Tue','Wed','Thu')
              OR period NOT BETWEEN 1 AND 4
              OR session_hours NOT IN (3.5,4.0,4.5)"""
    ).fetchone()[0]
    invalid_session = connection.execute(
        """SELECT COUNT(*) FROM dialysis_sessions
           WHERE weight_before_kg <= 0 OR weight_after_kg <= 0
              OR weight_after_kg > weight_before_kg
              OR duration_hours NOT BETWEEN 3.0 AND 5.0
              OR time_on >= time_off
              OR bp_before_sys NOT BETWEEN 80 AND 220
              OR bp_after_sys NOT BETWEEN 80 AND 220"""
    ).fetchone()[0]
    assert invalid_schedule == 0
    assert invalid_session == 0
    connection.close()


def test_generator_refuses_arbitrary_database_name(tmp_path: Path):
    with pytest.raises(ValueError, match="must be named"):
        generate_demo_data(1, 2026, tmp_path / "private.db")


def test_same_seed_repeats_clinical_records(tmp_path: Path):
    first = tmp_path / "first" / DEMO_DATABASE_NAME
    second = tmp_path / "second" / DEMO_DATABASE_NAME
    generate_demo_data(8, 2026, first)
    generate_demo_data(8, 2026, second)
    tables = (
        "patient_data", "hd_schedule", "dialysis_sessions", "session_medications",
        "session_signatures", "patient_medications", "lab_investigations", "analysis",
        "cultures", "dry_weight", "hd_sessions", "viral_serology",
        "anticoagulation", "iv_access", "audit_log",
    )
    left = sqlite3.connect(first)
    right = sqlite3.connect(second)
    for table in tables:
        assert left.execute(f"SELECT * FROM {table}").fetchall() == right.execute(
            f"SELECT * FROM {table}"
        ).fetchall()
    left.close()
    right.close()
