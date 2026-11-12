"""Comprehensive end-to-end integration and workflow verification tests."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.analysis import SAMPLES


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_and_frontend(client):
    # Health endpoint
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

    # Frontend serving at root
    r = client.get("/")
    assert r.status_code == 200
    assert "SentinMail" in r.text or "<div id=\"root\">" in r.text


def test_samples_endpoint(client):
    r = client.get("/api/samples")
    assert r.status_code == 200
    samples = r.json()
    assert len(samples) >= 4
    types = {s["type"] for s in samples}
    assert {"Legitimate", "Spam", "Phishing", "Malicious"} <= types


def test_auth_login_admin(client):
    r = client.post("/api/auth/login", json={
        "email": "admin@sentinmail.org",
        "password": "AdminPassword123!"
    })
    assert r.status_code == 200, f"Login failed: {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "admin"


def test_auth_signup_and_login(client):
    new_email = "newanalyst@cybersec.org"
    new_pass = "SecurePass2026!"

    # Verify registration is blocked without terms acceptance
    r_unaccepted = client.post("/api/auth/register", json={
        "name": "Alex Analyst",
        "email": new_email,
        "password": new_pass,
        "role": "analyst",
        "terms_accepted": False
    })
    assert r_unaccepted.status_code == 400
    assert "Terms and Conditions" in r_unaccepted.json().get("detail", "")

    # Test registration / signup with terms accepted
    r = client.post("/api/auth/register", json={
        "name": "Alex Analyst",
        "email": new_email,
        "password": new_pass,
        "role": "analyst",
        "terms_accepted": True,
        "terms_version": "2026-11-v1"
    })
    assert r.status_code in (201, 409)

    # Test login with newly registered account
    r = client.post("/api/auth/login", json={
        "email": new_email,
        "password": new_pass
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "analyst"

    # Verify user profile endpoint
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == new_email


def test_email_analysis_legitimate(client):
    # Log in as admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@sentinmail.org",
        "password": "AdminPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    legit_sample = next(s for s in SAMPLES if s["type"] == "Legitimate")
    r = client.post("/api/analyze", json={"raw_email": legit_sample["raw"]}, headers=headers)
    assert r.status_code == 201
    case = r.json()
    assert case["level"] == "Low"
    assert case["verdict"] in ("legitimate", "spam")
    assert case["score"] < 40
    assert "factors" in case
    assert len(case["factors"]) > 0


def test_email_analysis_phishing(client):
    login_res = client.post("/api/auth/login", json={
        "email": "admin@sentinmail.org",
        "password": "AdminPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    phish_sample = next(s for s in SAMPLES if s["type"] == "Phishing")
    r = client.post("/api/analyze", json={"raw_email": phish_sample["raw"]}, headers=headers)
    assert r.status_code == 201
    case = r.json()
    assert case["level"] in ("High", "Critical")
    assert case["verdict"] in ("phishing", "malicious")
    assert case["score"] >= 50

    # Verify extracted indicators of compromise
    assert "iocs" in case
    assert len(case["iocs"]["ip"]) > 0 or len(case["iocs"]["domain"]) > 0
    assert "evidence" in case
    assert "chain_head" in case["evidence"]

    # Verify evidence chain
    case_id = case["id"]
    verify_res = client.get(f"/api/cases/{case_id}/evidence/verify", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True

    # Check report generation
    report_res = client.get(f"/api/cases/{case_id}/report?format=html", headers=headers)
    assert report_res.status_code == 200
    assert "Email forensic report" in report_res.text


def test_malformed_email_graceful_handling(client):
    login_res = client.post("/api/auth/login", json={
        "email": "admin@sentinmail.org",
        "password": "AdminPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Corrupt / random binary strings should not crash the server
    malformed = "Subject: ??? \x00\x01\x02\n\nGarbage data without headers"
    r = client.post("/api/analyze", json={"raw_email": malformed}, headers=headers)
    assert r.status_code == 201
    res = r.json()
    assert "score" in res
    assert "verdict" in res


def test_stats_and_iocs(client):
    login_res = client.post("/api/auth/login", json={
        "email": "admin@sentinmail.org",
        "password": "AdminPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Stats
    r = client.get("/api/stats", headers=headers)
    assert r.status_code == 200
    stats = r.json()
    assert "total" in stats
    assert stats["total"] >= 1
    assert "by_level" in stats

    # Threat Intel IoCs
    ioc_res = client.get("/api/iocs", headers=headers)
    assert ioc_res.status_code == 200
    assert len(ioc_res.json()) >= 1
