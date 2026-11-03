"""Parse a raw RFC 5322 message into a plain dict. Nothing in the message is executed."""
import hashlib
import re
from email import policy
from email.parser import BytesParser
from email.utils import parseaddr
from html.parser import HTMLParser


class _Html(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self.links: list[str] = []

    def handle_data(self, data):
        self.parts.append(data)

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.links += [v for k, v in attrs if k == "href" and v]


def domain_of(addr: str | None) -> str | None:
    m = re.search(r"@([A-Za-z0-9.-]+\.[A-Za-z]{2,})", addr or "")
    return m.group(1).lower() if m else None


def _content(part) -> str:
    try:
        return part.get_content()
    except (LookupError, UnicodeDecodeError):
        return (part.get_payload(decode=True) or b"").decode("utf-8", "replace")


def parse_email(raw: bytes) -> dict:
    msg = BytesParser(policy=policy.default).parsebytes(raw)
    text, html, atts = [], [], []
    for part in msg.walk():
        if part.is_multipart():
            continue
        name, ctype = part.get_filename(), part.get_content_type()
        if name or part.get_content_disposition() == "attachment":
            data = part.get_payload(decode=True) or b""
            atts.append({
                "filename": name or "(unnamed)",
                "content_type": ctype,
                "size": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "md5": hashlib.md5(data).hexdigest(),  # legacy value for threat-intel lookups only
            })
        elif ctype == "text/plain":
            text.append(_content(part))
        elif ctype == "text/html":
            html.append(_content(part))
    h = _Html()
    for chunk in html:
        h.feed(chunk)
    body_text = "\n".join(text).strip() or " ".join(h.parts).strip()
    get = lambda k: (str(msg[k]) if msg[k] is not None else None)  # noqa: E731
    from_name, from_addr = parseaddr(get("From") or "")
    _, reply_to = parseaddr(get("Reply-To") or "")
    _, return_path = parseaddr(get("Return-Path") or "")
    return {
        "subject": get("Subject"),
        "from_name": from_name,
        "from_addr": from_addr.lower(),
        "from_domain": domain_of(from_addr),
        "reply_to": reply_to.lower(),
        "reply_to_domain": domain_of(reply_to),
        "return_path": return_path.lower(),
        "return_path_domain": domain_of(return_path),
        "to": get("To"),
        "date": get("Date"),
        "message_id": get("Message-ID"),
        "received": [str(v) for v in (msg.get_all("Received") or [])],
        "authentication_results": [str(v) for v in (msg.get_all("Authentication-Results") or [])],
        "received_spf": get("Received-SPF"),
        "body_text": body_text[:200_000],
        "html_links": h.links[:500],
        "attachments": atts,
        "raw_sha256": hashlib.sha256(raw).hexdigest(),
    }
