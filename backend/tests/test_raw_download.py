import asyncio
import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app
from app.security import create_token


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_raw_eml_download_workflow(client):
    db = get_db()
    case_id = "test_raw_download_case_001"
    raw_content = b"From: test@domain.org\r\nTo: recipient@domain.org\r\nSubject: Download Verification Test\r\n\r\nTest EML body"

    async def setup():
        await db.cases.delete_one({"_id": case_id})
        await db.cases.insert_one({
            "_id": case_id,
            "subject": "Download Verification Test",
            "from": "test@domain.org",
            "created_by": "tester@sentinmail.org",
            "score": 10,
            "level": "Low",
            "verdict": "legitimate",
            "raw_email": raw_content,
        })
    asyncio.run(setup())

    token = create_token("analyst@sentinmail.org", "analyst")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Download without auth header (guest evaluation / direct browser link)
    r_guest = client.get(f"/api/cases/{case_id}/raw")
    assert r_guest.status_code == 200
    assert r_guest.headers.get("content-type", "").startswith("message/rfc822")
    assert f'filename="{case_id}.eml"' in r_guest.headers.get("content-disposition", "")
    assert r_guest.content == raw_content

    # 2. Download with Authorization Bearer header
    r_auth = client.get(f"/api/cases/{case_id}/raw", headers=headers)
    assert r_auth.status_code == 200
    assert r_auth.content == raw_content

    # 3. Download with ?token= query parameter
    r_query = client.get(f"/api/cases/{case_id}/raw?token={token}")
    assert r_query.status_code == 200
    assert r_query.content == raw_content

    # 4. Download non-existent case returns 404
    r_404 = client.get("/api/cases/nonexistent_case_id_xyz999/raw")
    assert r_404.status_code == 404
