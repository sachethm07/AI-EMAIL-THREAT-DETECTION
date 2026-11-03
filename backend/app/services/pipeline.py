import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from ..config import settings
from . import attachments, forensics, header_analysis, intel, nlp, scoring
from .alerts import raise_alert
from .audit import audit
from .geoip import GeoIP
from .ml_model import ThreatClassifier
from .parser import parse_email
from .url_analysis import analyze_url, extract_urls

classifier = ThreatClassifier(settings.model_path)
geo = GeoIP()


def build_iocs(p: dict, hops: list, urls: list, atts: list) -> dict:
    domains = {p["from_domain"], p["reply_to_domain"], p["return_path_domain"]} | {u["host"] for u in urls if u["host"]}
    emails = {p["from_addr"], p["reply_to"], p["return_path"]}
    return {
        "ip": sorted(h["ip"] for h in hops),
        "domain": sorted(d for d in domains if d),
        "url": sorted(u["url"] for u in urls),
        "email": sorted(e for e in emails if e),
        "hash": sorted(a["sha256"] for a in atts),
    }


async def analyze_email(db, raw: bytes, analyst: str) -> dict:
    p = parse_email(raw)
    text = f"{p['subject'] or ''}\n{p['body_text']}"
    lang = nlp.indicators(text)
    ml = classifier.predict(text, lang["points"])
    auth = header_analysis.authentication(p["authentication_results"], p["received_spf"])
    anomalies = header_analysis.anomalies(p)
    urls = [analyze_url(u) for u in extract_urls(text, p["html_links"])]
    atts = [{**a, "flags": attachments.flags(a)} for a in p["attachments"]]
    hops = header_analysis.extract_hops(p["received"])[:10]
    for hop, g in zip(hops, await asyncio.gather(*(geo.lookup(h["ip"]) for h in hops))):
        hop["geo"] = g
    iocs = build_iocs(p, hops, urls, atts)
    hits = await intel.correlate(db, iocs)
    result = scoring.score(ml, lang, auth, anomalies, urls, atts, hits)
    case = {
        "_id": uuid4().hex, "created_at": datetime.now(timezone.utc), "created_by": analyst,
        "subject": p["subject"], "from": p["from_addr"], "from_domain": p["from_domain"], **result,
        "ml": ml, "language": lang, "authentication": auth, "header_anomalies": anomalies,
        "urls": urls, "attachments": atts, "hops": hops, "iocs": iocs, "intel_hits": hits,
        "evidence": forensics.build_evidence(raw, p, iocs, analyst), "raw_email": raw,
    }
    await db.cases.insert_one(case)
    await audit(db, analyst, "analyze", case["_id"], {"score": case["score"], "level": case["level"]})
    await raise_alert(db, case)
    return case


def public(case: dict) -> dict:
    out = {k: v for k, v in case.items() if k != "raw_email"}
    out["id"] = out.pop("_id")
    return out
