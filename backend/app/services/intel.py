from datetime import datetime, timezone

import httpx

from ..config import settings


async def _abuseipdb(ip: str):
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            r = await client.get("https://api.abuseipdb.com/api/v2/check",
                                 params={"ipAddress": ip, "maxAgeInDays": 90},
                                 headers={"Key": settings.abuseipdb_key, "Accept": "application/json"})
            r.raise_for_status()
            score = r.json()["data"]["abuseConfidenceScore"]
    except (httpx.HTTPError, KeyError, ValueError):
        return None
    return {"type": "ip", "value": ip, "severity": "high", "source": f"AbuseIPDB (confidence {score}%)"} if score >= 50 else None


async def correlate(db, iocs: dict) -> list[dict]:
    """Match extracted indicators against the local blocklist and, if configured, AbuseIPDB."""
    now = datetime.now(timezone.utc)
    values = [v.lower() for vals in iocs.values() for v in vals]
    hits = []
    if values:
        async for doc in db.iocs.find({"value": {"$in": values}}, {"_id": 0}):
            hits.append({**doc, "checked_at": now})
    if settings.abuseipdb_key:
        for ip in iocs.get("ip", [])[:5]:
            hit = await _abuseipdb(ip)
            if hit:
                hits.append({**hit, "checked_at": now})
    return hits
