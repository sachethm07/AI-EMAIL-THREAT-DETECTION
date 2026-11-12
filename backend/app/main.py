import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import get_db, init_indexes
from .routers import alerts, analysis, auth, intel, reports, system
from .security import hash_password
from .services.imap_ingest import poll_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    if len(settings.jwt_secret) < 32:
        raise RuntimeError("Set JWT_SECRET to at least 32 random characters.")
    db = get_db()
    await init_indexes(db)
    if settings.admin_email and settings.admin_password:
        email = settings.admin_email.lower()
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({
                "_id": uuid4().hex,
                "email": email,
                "name": "Security Administrator",
                "role": "admin",
                "password_hash": hash_password(settings.admin_password),
                "terms_accepted": True,
                "terms_version": "2026-11-v1",
                "terms_accepted_at": datetime.now(timezone.utc),
                "created_at": datetime.now(timezone.utc),
            })

    analyst_email = "analyst@sentinmail.org"
    if not await db.users.find_one({"email": analyst_email}):
        await db.users.insert_one({
            "_id": uuid4().hex,
            "email": analyst_email,
            "name": "SOC Threat Analyst",
            "role": "analyst",
            "password_hash": hash_password("AnalystPassword123!"),
            "terms_accepted": True,
            "terms_version": "2026-11-v1",
            "terms_accepted_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })

    # Seed demo cases if none exist
    if await db.cases.count_documents({}) == 0:
        from .routers.analysis import SAMPLES
        from .services.pipeline import analyze_email
        for s in SAMPLES:
            try:
                await analyze_email(db, s["raw"].encode("utf-8"), "system@sentinmail.org")
            except Exception as e:
                pass

    # Seed sample threat intel IoCs if none exist
    if await db.iocs.count_documents({}) == 0:
        sample_iocs = [
            {"type": "ip", "value": "185.220.101.4", "severity": "high", "source": "Known Tor Exit / Phishing Relay"},
            {"type": "ip", "value": "45.9.148.22", "severity": "high", "source": "Bulletproof Hoster AS208044"},
            {"type": "domain", "value": "hdfc-secure-bankk.top", "severity": "high", "source": "Active Phishing Campaign Feed"},
            {"type": "domain", "value": "mailer-nl-bulletproof.ru", "severity": "medium", "source": "Suspicious Mailer Infrastructure"},
        ]
        for item in sample_iocs:
            await db.iocs.update_one({"type": item["type"], "value": item["value"]},
                                     {"$set": {"severity": item["severity"], "source": item["source"]}}, upsert=True)

    task = asyncio.create_task(poll_loop(db)) if settings.imap_enabled else None
    yield
    if task:
        task.cancel()


app = FastAPI(title="SentinMail API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


for r in (auth.router, analysis.router, reports.router, intel.router, alerts.router, system.router):
    app.include_router(r)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok"}


# Serve built frontend if available
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
