import os
from fastapi import APIRouter, Depends

from ..config import settings
from ..db import db_dep
from ..local_db import LocalDatabase
from ..security import current_user, optional_user

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

    geoip_mmdb_exists = bool(settings.geoip_db_path and os.path.exists(settings.geoip_db_path))
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
            "status": f"Active (Local MMDB at {settings.geoip_db_path})" if geoip_mmdb_exists else "Offline Context Cache (Context Coordinates Active)",
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
