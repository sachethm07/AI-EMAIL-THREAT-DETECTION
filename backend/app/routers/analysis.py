import os
import re
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from ..config import settings
from ..db import db_dep
from ..schemas import AnalyzeRequest
from ..security import current_user, require_role
from ..services.audit import audit
from ..services.pipeline import analyze_email, public

router = APIRouter(prefix="/api", tags=["analysis"])
analyst = require_role("analyst", "admin")

SAMPLES = [
    {
        "id": "legitimate_meeting",
        "title": "Legitimate Project Meeting",
        "type": "Legitimate",
        "description": "Standard benign team meeting notice with matching headers, passing SPF/DKIM/DMARC, and clean corporate text.",
        "raw": (
            "From: \"Alice Chen\" <alice.chen@cybercorp-research.org>\n"
            "To: \"Dev Team\" <team@cybercorp-research.org>\n"
            "Subject: Team Sync and Project Milestone Review Tomorrow\n"
            "Date: Thu, 29 Oct 2026 14:00:00 +0000\n"
            "Message-ID: <202610291400.alice@cybercorp-research.org>\n"
            "Reply-To: alice.chen@cybercorp-research.org\n"
            "Return-Path: <alice.chen@cybercorp-research.org>\n"
            "Authentication-Results: mx.cybercorp-research.org; spf=pass; dkim=pass; dmarc=pass\n"
            "Received: from mail.cybercorp-research.org ([209.85.220.41]) by mx.cybercorp-research.org; Thu, 29 Oct 2026 14:00:02 +0000\n"
            "Content-Type: text/plain; charset=utf-8\n\n"
            "Hi everyone,\n\nPlease find the agenda for tomorrow's 10:00 AM sprint review. We will go through the Q4 forensic metrics and platform performance.\n\nMeeting link: https://meet.google.com/abc-defg-hij\n\nBest regards,\nAlice Chen\nCyberCorp Research Team"
        ),
    },
    {
        "id": "spam_promo",
        "title": "Promotional / Marketing Spam",
        "type": "Spam",
        "description": "Unsolicited commercial marketing email with heavy promotional language and discount triggers.",
        "raw": (
            "From: \"Super Deals Hub\" <promo@discounts-unlimited-deals.top>\n"
            "To: \"Subscriber\" <victim@example.org>\n"
            "Subject: HUGE 80% DISCOUNT SALE! Claim your free gift reward today!\n"
            "Date: Thu, 29 Oct 2026 12:30:00 +0000\n"
            "Message-ID: <deals-992138@discounts-unlimited-deals.top>\n"
            "Reply-To: promo@discounts-unlimited-deals.top\n"
            "Return-Path: <bounces@discounts-unlimited-deals.top>\n"
            "Authentication-Results: mx.example.org; spf=neutral; dkim=none; dmarc=none\n"
            "Received: from bulk-mailer.top ([185.220.101.4]) by mx.example.org; Thu, 29 Oct 2026 12:30:10 +0000\n"
            "Content-Type: text/plain; charset=utf-8\n\n"
            "WINNER NOTIFICATION! You have been selected for our exclusive autumn shopping voucher.\n\nHuge discount sale on all designer watches, electronics, and apparel. Order today and save up to 80% with free worldwide shipping!\n\nClaim now at http://discounts-unlimited-deals.top/claim-reward\n\nTo unsubscribe from marketing offers, click http://discounts-unlimited-deals.top/optout"
        ),
    },
    {
        "id": "phishing_banking",
        "title": "Banking Credential Phishing",
        "type": "Phishing",
        "description": "Spoofed bank security alert with urgent threats, domain typosquatting, SPF/DMARC failure, and credential harvesting link.",
        "raw": (
            "From: \"HDFC Bank Security\" <security-alerts@hdfc-secure-bankk.top>\n"
            "To: \"Account Holder\" <user@clientcorp.com>\n"
            "Subject: URGENT: Your Online Banking Access is Suspended - Immediate Verification Required\n"
            "Date: Thu, 29 Oct 2026 15:15:00 +0000\n"
            "Message-ID: <sec-notice-8841029@hdfc-secure-bankk.top>\n"
            "Reply-To: recovery-officer.helpdesk@gmail.com\n"
            "Return-Path: <bounce@mailer-nl-bulletproof.ru>\n"
            "Authentication-Results: mx.clientcorp.com; spf=fail; dkim=none; dmarc=fail\n"
            "Received: from mailer-nl-bulletproof.ru ([45.9.148.22]) by mx.clientcorp.com; Thu, 29 Oct 2026 15:15:12 +0000\n"
            "Received: from tor-exit-node.de ([185.220.101.4]) by mailer-nl-bulletproof.ru; Thu, 29 Oct 2026 15:14:48 +0000\n"
            "Content-Type: text/plain; charset=utf-8\n\n"
            "Dear Customer,\n\nOur automated security team detected unauthorized login attempts to your net banking account from an unfamiliar IP address. As a safety precaution, your account access has been temporarily suspended.\n\nYou must verify your password, OTP, and KYC identity details within 24 hours to prevent permanent account deactivation and legal penalties.\n\nClick here immediately to verify your identity and restore access:\nhttp://hdfc-secure-bankk.top/login\n\nFailure to verify will result in immediate suspension.\n\nHDFC Fraud Prevention Department"
        ),
    },
    {
        "id": "malicious_attachment",
        "title": "Spear Phishing with Executable Attachment",
        "type": "Malicious",
        "description": "Financial wire fraud pretext with double-extension executable disguised as a PDF invoice.",
        "raw": (
            "From: \"Finance Director\" <director@finance-wire-processing.top>\n"
            "To: \"Accounts Payable\" <accounts@corp.org>\n"
            "Subject: URGENT: Outstanding Payment Remittance & Wire Instructions - Action Required Today\n"
            "Date: Thu, 29 Oct 2026 16:45:00 +0000\n"
            "Message-ID: <remittance-99120@finance-wire-processing.top>\n"
            "Reply-To: shadow-cfo@protonmail.com\n"
            "Return-Path: <bounces@russia-direct-host.ru>\n"
            "Authentication-Results: mx.corp.org; spf=fail; dkim=none; dmarc=fail\n"
            "Received: from russia-direct-host.ru ([193.106.191.12]) by mx.corp.org; Thu, 29 Oct 2026 16:45:05 +0000\n"
            "MIME-Version: 1.0\n"
            "Content-Type: multipart/mixed; boundary=\"====_BOUNDARY_12345_====\"\n\n"
            "--====_BOUNDARY_12345_====\n"
            "Content-Type: text/plain; charset=utf-8\n\n"
            "Urgent request: attached is the revised invoice and bank wire transfer instructions for Q4 payment.\n"
            "Please review the attached document and process the payment before end of business today.\n\n"
            "--====_BOUNDARY_12345_====\n"
            "Content-Type: application/octet-stream; name=\"Invoice_Oct2026.pdf.exe\"\n"
            "Content-Disposition: attachment; filename=\"Invoice_Oct2026.pdf.exe\"\n"
            "Content-Transfer-Encoding: base64\n\n"
            "TVpQAAIAAAAA//8AALgAAAAAAAAAQAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n"
            "AAAA4AAAAA4fug4AtAnNIbgBTM0hVGhpcyBwcm9ncmFtIGNhbm5vdCBiZSBydW4gaW4gRE9TIG1v\n"
            "ZGUKJDEwMDEyMw==\n"
            "--====_BOUNDARY_12345_====--"
        ),
    },
]


@router.get("/samples")
async def list_samples():
    """Return pre-configured sample emails for academic evaluation and demonstration."""
    return SAMPLES


@router.post("/analyze", status_code=201)
async def analyze_text(body: AnalyzeRequest, user=Depends(analyst), db=Depends(db_dep)):
    return public(await analyze_email(db, body.raw_email.encode("utf-8", "replace"), user["email"]))


ALLOWED_EMAIL_EXTENSIONS = {".eml", ".msg", ".txt", ".rfc822", ".mbox", ".email"}


@router.post("/analyze/upload", status_code=201)
async def analyze_upload(file: UploadFile = File(...), user=Depends(analyst), db=Depends(db_dep)):
    filename = (file.filename or "").strip()
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext and ext not in ALLOWED_EMAIL_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. SentinMail inspects RFC 5322 email files (.eml, .msg, .txt). Direct binaries/executables cannot be uploaded as email files."
            )

    raw = await file.read(settings.max_upload_bytes + 1)
    if len(raw) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum upload limit of {settings.max_upload_bytes // (1024*1024)} MB.")
    if not raw.strip():
        raise HTTPException(status_code=400, detail="The uploaded email file is empty.")

    # Guard against binary files disguised as emails
    if raw.startswith(b"MZ"):
        raise HTTPException(status_code=400, detail="Uploaded file is a Windows executable binary (.exe/.dll), not an email message.")
    if raw.startswith(b"\x7fELF"):
        raise HTTPException(status_code=400, detail="Uploaded file is a Linux ELF binary, not an email message.")
    if raw.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is a PDF document, not an email message. Attach the document inside an .eml message to analyze.")
    if raw.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="Uploaded file is a ZIP or Office archive, not an email message.")
    if raw.startswith(b"\x89PNG") or raw.startswith(b"\xff\xd8\xff") or raw.startswith(b"GIF8"):
        raise HTTPException(status_code=400, detail="Uploaded file is an image file, not an email message.")

    return public(await analyze_email(db, raw, user["email"]))


@router.get("/cases")
async def list_cases(level: Literal["Low", "Medium", "High", "Critical"] | None = None, q: str | None = Query(None, max_length=100),
                     skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
                     _=Depends(current_user), db=Depends(db_dep)):
    filt: dict = {}
    if level:
        filt["level"] = level
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        filt["$or"] = [{"subject": rx}, {"from": rx}]
    proj = {"subject": 1, "from": 1, "score": 1, "level": 1, "verdict": 1, "created_at": 1, "created_by": 1}
    items = [{**{k: v for k, v in d.items() if k != "_id"}, "id": d["_id"]}
             async for d in db.cases.find(filt, proj).sort("created_at", -1).skip(skip).limit(limit)]
    return {"total": await db.cases.count_documents(filt), "items": items}


@router.get("/cases/{case_id}")
async def get_case(case_id: str, _=Depends(current_user), db=Depends(db_dep)):
    case = await db.cases.find_one({"_id": case_id}, {"raw_email": 0})
    if not case:
        raise HTTPException(404, "Case not found.")
    case["id"] = case.pop("_id")
    return case


@router.delete("/cases/{case_id}", status_code=204)
async def delete_case(case_id: str, admin=Depends(require_role("admin")), db=Depends(db_dep)):
    if not (await db.cases.delete_one({"_id": case_id})).deleted_count:
        raise HTTPException(404, "Case not found.")
    await audit(db, admin["email"], "delete_case", case_id)


@router.get("/stats")
async def stats(_=Depends(current_user), db=Depends(db_dep)):
    count = lambda field: [{"_id": f"${field}", "n": {"$sum": 1}}]  # noqa: E731
    group = lambda field: db.cases.aggregate([{"$group": {"_id": f"${field}", "n": {"$sum": 1}}}])  # noqa: E731
    hop_stage = [{"$unwind": "$hops"}, {"$match": {"hops.geo.lat": {"$ne": None}}}]
    since = datetime.now(timezone.utc) - timedelta(days=7)
    return {
        "total": await db.cases.count_documents({}),
        "by_level": {d["_id"]: d["n"] async for d in group("level")},
        "by_verdict": {d["_id"]: d["n"] async for d in group("verdict")},
        "top_countries": [{"country": d["_id"], "count": d["n"]} async for d in db.cases.aggregate(
            hop_stage + [{"$group": {"_id": "$hops.geo.country", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}, {"$limit": 10}])],
        "map_points": [{"lat": d["_id"]["lat"], "lon": d["_id"]["lon"], "city": d["_id"]["city"], "count": d["n"]}
                       async for d in db.cases.aggregate(hop_stage + [
                           {"$group": {"_id": {"lat": "$hops.geo.lat", "lon": "$hops.geo.lon", "city": "$hops.geo.city"}, "n": {"$sum": 1}}},
                           {"$limit": 300}])],
        "last_7_days": [{"date": d["_id"], "count": d["n"]} async for d in db.cases.aggregate([
            {"$match": {"created_at": {"$gte": since}}},
            {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}, "n": {"$sum": 1}}},
            {"$sort": {"_id": 1}}])],
    }
