from html import escape as e
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse

from ..db import db_dep
from ..security import current_user, optional_user, require_role
from ..services.audit import audit
from ..services.forensics import verify_chain

router = APIRouter(prefix="/api/cases", tags=["reports"])


def _rows(pairs) -> str:
    return "".join(f"<tr><th>{e(str(k))}</th><td>{e(str(v))}</td></tr>" for k, v in pairs)


def _html(c: dict) -> str:
    hops = "".join(f"<tr><td>{h['order']}</td><td>{e(str(h['ip']))}</td><td>{e(str(h['geo'].get('city') or '-'))}, {e(str(h['geo'].get('country') or 'unknown'))}</td><td>{e(str(h['geo'].get('org') or '-'))}</td></tr>" for h in c["hops"])
    factors = "".join(f"<tr><td>{e(str(f['name']))}</td><td>{f['points']} / {f['max']}</td><td>{e(str(f['detail']))}</td></tr>" for f in c["factors"])
    urls = "".join(f"<tr><td>{e(str(u['url']))}</td><td>{e('; '.join(u['flags']) or 'No flags')}</td></tr>" for u in c["urls"])
    atts = "".join(f"<tr><td>{e(str(a['filename']))}</td><td>{e(str(a['sha256']))}</td><td>{e('; '.join(a['flags']) or 'No flags')}</td></tr>" for a in c["attachments"])
    iocs = "".join(f"<tr><th>{t}</th><td>{e(', '.join(v)) or 'none'}</td></tr>" for t, v in c["iocs"].items())
    chain = "".join(f"<tr><td>{e(str(i['type']))}</td><td>{e(str(i['sha256']))}</td></tr>" for i in c["evidence"]["items"])
    return f"""<!doctype html><html lang="en"><meta charset="utf-8"><title>Forensic report {e(str(c['_id']))}</title>
<style>body{{font:14px/1.5 system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#14232B}}table{{border-collapse:collapse;width:100%;margin:8px 0 20px}}td,th{{border:1px solid #ccd;padding:6px 8px;text-align:left;vertical-align:top;word-break:break-word}}th{{width:28%;background:#f1f5f4}}</style>
<h1>Email forensic report</h1>
<table>{_rows([("Case ID", c['_id']), ("Analyzed", c['created_at']), ("Analyst", c['created_by']), ("Subject", c['subject']), ("From", c['from']),
("Risk level", f"{c['level']} ({c['score']}/100)"), ("Verdict", c['verdict'])])}</table>
<h2>Why this score</h2><table>{factors}</table>
<h2>Authentication</h2><table>{_rows(c['authentication'].items())}</table>
<h2>Route and approximate location</h2><table><tr><th>#</th><th>IP</th><th>Approximate location</th><th>Network</th></tr>{hops}</table>
<p>Geolocation is approximate context about servers and networks. It does not identify the sender or their physical location.</p>
<h2>Links</h2><table>{urls}</table><h2>Attachments (metadata only)</h2><table>{atts}</table>
<h2>Indicators of compromise</h2><table>{iocs}</table>
<h2>Evidence integrity</h2><p>Collected {e(str(c['evidence']['collected_at']))} by {e(str(c['evidence']['collected_by']))}. Chain head: {e(str(c['evidence']['chain_head']))}</p><table>{chain}</table>
<p>This report supports an investigation. Automated findings can be wrong and should be reviewed by an analyst.</p></html>"""


async def _case(db, case_id: str, with_raw: bool = False) -> dict:
    case = await db.cases.find_one({"_id": case_id}, {} if with_raw else {"raw_email": 0})
    if not case:
        raise HTTPException(404, "Case not found.")
    return case


@router.get("/{case_id}/report")
async def report(case_id: str, format: Literal["html", "json"] = "html", user=Depends(optional_user), db=Depends(db_dep)):
    case = await _case(db, case_id)
    if user:
        await audit(db, user["email"], "report", case_id, {"format": format})
    if format == "json":
        case["id"] = case.pop("_id")
        return case
    return HTMLResponse(_html(case), headers={"Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'"})


def _to_bytes(raw) -> bytes:
    if isinstance(raw, bytes):
        return raw
    if isinstance(raw, str):
        try:
            return raw.encode("latin1")
        except UnicodeEncodeError:
            return raw.encode("utf-8", errors="replace")
    return b""


def _synthesize_eml(case: dict) -> bytes:
    created = str(case.get("created_at") or "")
    cid = str(case.get("_id") or "")
    lines = [
        f"From: {case.get('from', 'analyst@sentinmail.org')}",
        f"Subject: {case.get('subject', 'Forensic Investigation Artifact')}",
        f"Date: {created}",
        f"Message-ID: <{cid}@sentinmail.forensics>",
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "",
        f"[SentinMail Forensic Email Evidence - Case {cid}]",
        f"Verdict: {case.get('verdict', 'unknown')}",
        f"Threat Level: {case.get('level', 'Low')} (Score: {case.get('score', 0)}/100)",
        f"Sender: {case.get('from', '')}",
        f"Investigating Analyst: {case.get('created_by', '')}",
    ]
    return "\r\n".join(lines).encode("utf-8")


@router.get("/{case_id}/evidence/verify")
async def verify(case_id: str, _=Depends(optional_user), db=Depends(db_dep)):
    case = await _case(db, case_id, with_raw=True)
    return verify_chain(case["evidence"], _to_bytes(case.get("raw_email")))


@router.get("/{case_id}/raw")
async def raw(case_id: str, user=Depends(optional_user), db=Depends(db_dep)):
    case = await _case(db, case_id, with_raw=True)
    raw_content = _to_bytes(case.get("raw_email"))
    if not raw_content:
        raw_content = _synthesize_eml(case)

    actor = user["email"] if user else "guest"
    await audit(db, actor, "download_raw", case_id)
    return Response(
        raw_content,
        media_type="message/rfc822",
        headers={
            "Content-Disposition": f'attachment; filename="{case_id}.eml"',
            "Content-Type": "message/rfc822",
            "Content-Length": str(len(raw_content)),
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
        },
    )
