import ipaddress
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

_IP4 = re.compile(r"(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])")
_IP6 = re.compile(r"\[([0-9a-fA-F:]{3,})\]")
_AUTH = re.compile(r"\b(spf|dkim|dmarc)\s*=\s*(\w+)", re.I)
BRANDS = ("paypal", "google", "microsoft", "apple", "amazon", "hdfc", "sbi", "icici", "axis", "netflix", "facebook", "linkedin")


def _public(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_global
    except ValueError:
        return False


def extract_hops(received: list[str]) -> list[dict]:
    """Public IPs from Received headers, origin first. The oldest hop is the least trustworthy to forge-check."""
    hops, seen = [], set()
    for line in reversed(received):
        for ip in _IP4.findall(line) + _IP6.findall(line):
            if ip not in seen and _public(ip):
                seen.add(ip)
                hops.append({"order": len(hops) + 1, "ip": ip, "received": line[:300]})
    return hops


def authentication(auth_headers: list[str], received_spf: str | None) -> dict:
    result, found = {"spf": "none", "dkim": "none", "dmarc": "none"}, set()
    for header in auth_headers:
        for mech, value in _AUTH.findall(header):
            mech = mech.lower()
            if mech not in found:
                result[mech], _ = value.lower(), found.add(mech)
    if "spf" not in found and received_spf:
        result["spf"] = received_spf.split()[0].lower()
    return result


def anomalies(p: dict) -> list[dict]:
    out = []

    def add(code, detail, points):
        out.append({"code": code, "detail": detail, "points": points})

    fd, rd, pd = p["from_domain"], p["reply_to_domain"], p["return_path_domain"]
    if fd and rd and fd != rd:
        add("REPLY_TO_MISMATCH", f"Reply-To domain {rd} differs from From domain {fd}", 6)
    if fd and pd and fd != pd:
        add("RETURN_PATH_MISMATCH", f"Return-Path domain {pd} differs from From domain {fd}", 6)
    if not p["message_id"]:
        add("NO_MESSAGE_ID", "Message-ID header is missing", 3)
    if not p["received"]:
        add("NO_RECEIVED", "No Received headers, so the routing path cannot be checked", 2)
    name = (p["from_name"] or "").lower()
    if fd and any(b in name and b not in fd for b in BRANDS):
        add("DISPLAY_NAME_BRAND", "Display name uses a brand that does not match the sender domain", 5)
    if p["date"]:
        try:
            sent = parsedate_to_datetime(p["date"])
            if sent.tzinfo and sent > datetime.now(timezone.utc) + timedelta(hours=24):
                add("FUTURE_DATE", "Date header is more than a day in the future", 2)
        except (TypeError, ValueError):
            add("BAD_DATE", "Date header could not be parsed", 1)
    else:
        add("NO_DATE", "Date header is missing", 1)
    return out
