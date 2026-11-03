"""Evidence record with a hash chain, so later tampering with any entry is detectable."""
import hashlib
import json
from datetime import datetime, timezone


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canon(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, default=str).encode()


def _link(prev: str, item: dict) -> str:
    return sha256(f"{prev}|{item['type']}|{item['sha256']}|{item['collected_at']}".encode())


def build_evidence(raw: bytes, parsed: dict, iocs: dict, analyst: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    headers = {k: parsed[k] for k in ("from_addr", "reply_to", "return_path", "to", "subject", "date", "message_id", "received", "authentication_results")}
    items = [
        {"type": "raw_email", "sha256": sha256(raw), "size": len(raw)},
        {"type": "headers", "sha256": sha256(_canon(headers))},
        {"type": "iocs", "sha256": sha256(_canon(iocs))},
    ] + [{"type": "attachment", "name": a["filename"], "sha256": a["sha256"], "size": a["size"]} for a in parsed["attachments"]]
    prev = "0" * 64
    for item in items:
        item["collected_at"], item["prev_hash"] = now, prev
        item["entry_hash"] = prev = _link(prev, item)
    return {"collected_at": now, "collected_by": analyst, "items": items, "chain_head": prev}


def verify_chain(evidence: dict, raw: bytes | None = None) -> dict:
    prev, problems = "0" * 64, []
    for i, item in enumerate(evidence["items"]):
        if item["prev_hash"] != prev or item["entry_hash"] != _link(prev, item):
            problems.append(f"Entry {i} ({item['type']}) does not match the chain")
        prev = item["entry_hash"]
    if prev != evidence["chain_head"]:
        problems.append("Chain head does not match the last entry")
    if raw is not None and evidence["items"][0]["sha256"] != sha256(raw):
        problems.append("Stored raw email no longer matches its recorded hash")
    return {"valid": not problems, "problems": problems}
