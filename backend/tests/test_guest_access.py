import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import get_db
from app.main import app
from generate_demo_data import DEMO_DATABASE_NAME, generate_demo_data


def test_development_cors_accepts_vite_fallback_port():
    origin = "http://localhost:3001"
    with TestClient(app) as client:
        response = client.options(
            "/api/auth/guest",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


@pytest.fixture()
def guest_client(tmp_path: Path):
    path = tmp_path / DEMO_DATABASE_NAME
    generate_demo_data(12, 2026, path)
    engine = create_engine(
        f"sqlite:///{path.as_posix()}", connect_args={"check_same_thread": False}
    )
    Session = sessionmaker(bind=engine)

    def override_db():
        database = Session()
        try:
            yield database
        finally:
            database.close()

    app.dependency_overrides[get_db] = override_db
    try:
        yield TestClient(app), path
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_guest_can_browse_without_credentials_but_cannot_write(guest_client):
    client, path = guest_client
    response = client.post("/api/auth/guest")
    assert response.status_code == 200
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

    patients = client.get("/api/patients", headers=headers)
    assert patients.status_code == 200
    assert len(patients.json()) == 12
    patient_id = patients.json()[0]["patient_id"]

    assert client.get(f"/api/patients/{patient_id}/labs", headers=headers).status_code == 200
    assert client.get(f"/api/patients/{patient_id}/dialysis-sessions", headers=headers).status_code == 200

    new_patient = {
        "first_name_ar": "زائر",
        "last_name_ar": "تجريبي",
        "gender": "M",
        "id_number": "DEMO-GUEST-WRITE",
    }
    assert client.post("/api/patients", json=new_patient, headers=headers).status_code == 403
    assert client.post(
        f"/api/patients/{patient_id}/labs",
        json={"patient_id": patient_id, "investigation_name": "Demo", "result": "1"},
        headers=headers,
    ).status_code == 403

    connection = sqlite3.connect(path)
    session_id = connection.execute(
        "SELECT session_id FROM dialysis_sessions LIMIT 1"
    ).fetchone()[0]
    connection.close()
    assert client.patch(
        f"/api/dialysis-sessions/{session_id}", json={"notes": "blocked"}, headers=headers
    ).status_code == 403


def test_guest_cannot_use_password_login(guest_client):
    client, _path = guest_client
    response = client.post(
        "/api/auth/login",
        json={
            "email": "guest@demo.dialycore.local",
            "password": "guest-password-login-disabled",
        },
    )
    assert response.status_code == 400
