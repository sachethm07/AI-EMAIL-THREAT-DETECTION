import os
import httpx
from fastapi import APIRouter, Depends, HTTPException

from ..config import settings
from ..db import db_dep
from ..local_db import LocalDatabase
from ..schemas import KeyConfig, SmtpConfig, ImapConfig
from ..security import current_user, optional_user, require_role
from ..services.geoip import get_geoip_db_path

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/integrations")
async def get_integrations(user=Depends(optional_user), db=Depends(db_dep)):
    """Return live status of local engines and external intelligence integrations."""
    is_sqlite = isinstance(db, LocalDatabase)
    db_status = {
        "engine": "SQLite Document Store (.sentinmail.db)" if is_sqlite else "MongoDB Server",
        "mode": "embedded_fallback" if is_sqlite else "production_mongo",
        "connected": True,
        "location": getattr(db, "db_path", settings.mongo_uri),
        "note": "Embedded SQLite engine with Motor async collection/cursor compatibility layer active." if is_sqlite else "Dedicated MongoDB instance."
    }

    model_exists = os.path.exists(settings.model_path)
    ml_status = {
        "model_file": settings.model_path,
        "exists": model_exists,
        "status": "Active (Loaded in memory)" if model_exists else "Heuristic / Rule-based Fallback",
        "algorithm": "Logistic Regression + TF-IDF NLTK Stemming Pipeline",
        "classes": ["Legitimate", "Spam", "Phishing", "Malicious"],
        "training_dataset": "Enron / SpamAssassin / PhishingCorpus baseline"
    }

    active_mmdb = get_geoip_db_path()
    geoip_mmdb_exists = bool(active_mmdb)
    abuseipdb_configured = bool(settings.abuseipdb_key and len(settings.abuseipdb_key) > 8)
    geoip_api_configured = bool(settings.geoip_api_url and "{ip}" in settings.geoip_api_url)
    smtp_configured = bool(settings.smtp_host)
    imap_configured = bool(settings.imap_enabled and settings.imap_host)

    integrations = [
        {
            "id": "abuseipdb",
            "name": "AbuseIPDB Threat Intelligence API",
            "category": "External Threat Intelligence",
            "configured": abuseipdb_configured,
            "status": "Active (Live IP reputation queries enabled)" if abuseipdb_configured else "Unavailable (No API Key Configured)",
            "description": "Cross-references extracted routing IPs and sender hosts against AbuseIPDB's crowd-sourced malicious IP database.",
            "fallback": "Extracts IPs and matches them against local forensic blocklist; never fabricates fake scores.",
            "setup_guide": "1. Sign up for a free developer key at https://www.abuseipdb.com/\n2. Add ABUSEIPDB_KEY=<your_api_key> to backend/.env\n3. Restart backend service."
        },
        {
            "id": "geoip_mmdb",
            "name": "MaxMind GeoLite2 City MMDB",
            "category": "IP Geolocation",
            "configured": geoip_mmdb_exists,
            "status": f"Active (Local MMDB loaded: {os.path.basename(active_mmdb)})" if geoip_mmdb_exists else "Offline Context Cache (Context Coordinates Active)",
            "description": "Resolves public IPv4/IPv6 transit hops from Received headers to approximate country, city, and coordinates.",
            "fallback": "Uses verified offline context coordinates for sample hops. Clearly labeled as approximate network context, not attribution.",
            "setup_guide": "1. Create a free MaxMind account at https://dev.maxmind.com/geoip/geolite2-free-geolocation-data\n2. Download GeoLite2-City.mmdb\n3. Place the file at backend/data/GeoLite2-City.mmdb (or set GEOIP_DB_PATH in .env)."
        },
        {
            "id": "geoip_api",
            "name": "External GeoIP HTTP API",
            "category": "IP Geolocation",
            "configured": geoip_api_configured,
            "status": "Active (HTTP fallback query enabled)" if geoip_api_configured else "Not Configured",
            "description": "Optional HTTP web service fallback for looking up public IP geographical coordinates.",
            "fallback": "Falls back to local MMDB or offline cache; no external network queries are sent.",
            "setup_guide": "Set GEOIP_API_URL in backend/.env with the {ip} template parameter, e.g. https://ipapi.co/{ip}/json/"
        },
        {
            "id": "smtp",
            "name": "SMTP Threat Alert Dispatcher",
            "category": "Notifications & Dispatch",
            "configured": smtp_configured,
            "status": f"Active (Target: {settings.smtp_host}:{settings.smtp_port})" if smtp_configured else "Not Configured (In-App & WebSocket alerts active)",
            "description": "Sends instant email dispatch notifications to security team leads upon classification of High or Critical threats.",
            "fallback": "High and Critical severity alerts are automatically recorded in the database and delivered in real-time via WebSocket to all connected analyst dashboards.",
            "setup_guide": "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ALERT_FROM, and ALERT_TO in backend/.env."
        },
        {
            "id": "imap",
            "name": "IMAP Suspicious Mailbox Collector",
            "category": "Automated Ingestion",
            "configured": imap_configured,
            "status": f"Active (Polling {settings.imap_host} every {settings.imap_poll_seconds}s)" if imap_configured else "Disabled (Manual text paste and .eml upload active)",
            "description": "Background service that polls a dedicated security reporting inbox (e.g. phishing-report@corp.org) and ingests incoming emails automatically.",
            "fallback": "Analysts submit suspicious emails manually via pasted raw RFC 5322 text or by dragging and dropping .eml message files.",
            "setup_guide": "Set IMAP_ENABLED=true, IMAP_HOST=<mail_server>, IMAP_USER=<account>, IMAP_PASSWORD=<password> in backend/.env."
        }
    ]

    return {
        "database": db_status,
        "ml_engine": ml_status,
        "integrations": integrations
    }


@router.post("/integrations/abuseipdb")
async def update_abuseipdb_key(body: KeyConfig, admin=Depends(require_role("admin", "analyst"))):
    """Test key with AbuseIPDB API and save it to backend/.env."""
    key = body.api_key.strip()
    
    # Verify key by sending a test check to AbuseIPDB
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={"ipAddress": "185.220.101.4", "maxAgeInDays": 30},
                headers={"Key": key, "Accept": "application/json"}
            )
            if resp.status_code == 401 or resp.status_code == 403:
                raise HTTPException(400, "Invalid AbuseIPDB API key. Please check the key created in your AbuseIPDB account.")
            resp.raise_for_status()
            data = resp.json().get("data", {})
    except httpx.HTTPStatusError as e:
        raise HTTPException(400, f"AbuseIPDB returned status {e.response.status_code}: {e.response.text}")
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Unable to reach AbuseIPDB API: {e}")

    # Persist to backend/.env
    _persist_env({"ABUSEIPDB_KEY": key})

    # Update in-memory settings
    object.__setattr__(settings, "abuseipdb_key", key)

    return {
        "status": "ok",
        "message": "AbuseIPDB API key successfully verified and saved!",
        "confidence_score": data.get("abuseConfidenceScore"),
        "country": data.get("countryCode")
    }


def _persist_env(updates: dict):
    candidate_env_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
        os.path.abspath(".env"),
        os.path.abspath("backend/.env"),
    ]
    env_file = next((p for p in candidate_env_paths if os.path.exists(p)), candidate_env_paths[0])
    lines = []
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

    applied = set()
    new_lines = []
    for line in lines:
        matched_key = None
        for k in updates:
            if line.startswith(f"{k}="):
                matched_key = k
                break
        if matched_key:
            new_lines.append(f"{matched_key}={updates[matched_key]}\n")
            applied.add(matched_key)
        else:
            new_lines.append(line)

    for k, v in updates.items():
        if k not in applied:
            new_lines.append(f"{k}={v}\n")

    with open(env_file, "w", encoding="utf-8") as f:
        f.writelines(new_lines)


@router.post("/integrations/smtp")
async def update_smtp_config(body: SmtpConfig, admin=Depends(require_role("admin", "analyst"))):
    """Save SMTP dispatcher configuration and update in-memory settings."""
    host = body.smtp_host.strip()
    port = body.smtp_port
    user = body.smtp_user.strip()
    password = body.smtp_password.strip()
    alert_from = body.alert_from.strip() or user
    alert_to = body.alert_to.strip()

    updates = {
        "SMTP_HOST": host,
        "SMTP_PORT": str(port),
        "SMTP_USER": user,
        "SMTP_PASSWORD": password,
        "ALERT_FROM": alert_from,
        "ALERT_TO": alert_to,
    }
    _persist_env(updates)

    object.__setattr__(settings, "smtp_host", host)
    object.__setattr__(settings, "smtp_port", port)
    object.__setattr__(settings, "smtp_user", user)
    object.__setattr__(settings, "smtp_password", password)
    object.__setattr__(settings, "alert_from", alert_from)
    object.__setattr__(settings, "alert_to", alert_to)

    return {
        "status": "ok",
        "message": f"SMTP Dispatcher successfully active! Alert notifications routed via {host}:{port} to {alert_to or 'configured recipients'}.",
        "target": f"{host}:{port}"
    }


@router.post("/integrations/imap")
async def update_imap_config(body: ImapConfig, admin=Depends(require_role("admin", "analyst"))):
    """Save IMAP ingestion configuration and update in-memory settings."""
    host = body.imap_host.strip()
    user = body.imap_user.strip()
    password = body.imap_password.strip()
    poll = body.imap_poll_seconds
    enabled = body.imap_enabled

    updates = {
        "IMAP_ENABLED": "true" if enabled else "false",
        "IMAP_HOST": host,
        "IMAP_USER": user,
        "IMAP_PASSWORD": password,
        "IMAP_POLL_SECONDS": str(poll),
    }
    _persist_env(updates)

    object.__setattr__(settings, "imap_enabled", enabled)
    object.__setattr__(settings, "imap_host", host)
    object.__setattr__(settings, "imap_user", user)
    object.__setattr__(settings, "imap_password", password)
    object.__setattr__(settings, "imap_poll_seconds", poll)

    return {
        "status": "ok",
        "message": f"IMAP Mailbox Collector successfully {'activated' if enabled else 'disabled'} for {host} (polling every {poll}s).",
        "host": host
    }
