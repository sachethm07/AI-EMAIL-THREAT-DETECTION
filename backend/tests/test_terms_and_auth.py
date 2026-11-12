import asyncio
import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_terms_metadata_endpoint(client):
    r = client.get("/api/auth/terms")
    assert r.status_code == 200
    data = r.json()
    assert data["version"] == "2026-11-v1"
    assert "Draft" in data["status"]
    assert "Terms and Conditions" in data["title"]
    assert "Privacy Policy" in data["privacy_policy_status"]


def test_registration_requires_terms_acceptance(client):
    db = get_db()
    test_email = "terms_evaluator_test@sentinmail.org"
    asyncio.run(db.users.delete_one({"email": test_email}))

    # 1. Attempt registration without terms_accepted (default false)
    r1 = client.post("/api/auth/register", json={
        "name": "Terms Tester",
        "email": test_email,
        "password": "Password123!",
        "role": "analyst"
    })
    assert r1.status_code == 400
    assert "Terms and Conditions" in r1.json()["detail"]

    # 2. Attempt registration with explicit terms_accepted=False
    r2 = client.post("/api/auth/register", json={
        "name": "Terms Tester",
        "email": test_email,
        "password": "Password123!",
        "role": "analyst",
        "terms_accepted": False
    })
    assert r2.status_code == 400

    # 3. Successful registration with terms_accepted=True
    r3 = client.post("/api/auth/register", json={
        "name": "Terms Tester",
        "email": test_email,
        "password": "Password123!",
        "role": "analyst",
        "terms_accepted": True,
        "terms_version": "2026-11-v1"
    })
    assert r3.status_code == 201

    # Verify terms audit and database fields
    async def verify_db():
        u = await db.users.find_one({"email": test_email})
        assert u is not None
        assert u.get("terms_accepted") is True
        assert u.get("terms_version") == "2026-11-v1"
        assert u.get("terms_accepted_at") is not None
    asyncio.run(verify_db())
