import difflib
import re
from urllib.parse import urlparse

BRANDS = ("paypal", "google", "microsoft", "apple", "amazon", "hdfc", "sbi", "icici", "netflix", "facebook", "linkedin")
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "ow.ly", "rebrand.ly"}
RISKY_TLDS = {"top", "xyz", "ru", "tk", "click", "zip", "work", "gq", "cf", "ml", "cn"}
_URL = re.compile(r"https?://[^\s<>\"')\]]+", re.I)
_IPV4 = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")


def extract_urls(text: str, html_links: list[str]) -> list[str]:
    urls = {u.rstrip(".,;:!") for u in _URL.findall(text or "")}
    urls.update(u for u in html_links if u.lower().startswith(("http://", "https://")))
    return sorted(urls)[:200]


def analyze_url(url: str) -> dict:
    try:
        p = urlparse(url)
        host = (p.hostname or "").lower()
    except ValueError:
        return {"url": url, "host": None, "flags": ["Malformed URL"]}
    flags = []
    labels = host.split(".")
    registered = ".".join(labels[-2:]) if len(labels) >= 2 else host  # rough; ignores co.uk style suffixes
    if _IPV4.match(host):
        flags.append("IP address used as host")
    if host in SHORTENERS:
        flags.append("URL shortener hides the destination")
    if labels[-1] in RISKY_TLDS:
        flags.append("Top-level domain often used in abuse")
    if len(labels) > 4:
        flags.append("Excessive subdomains")
    if "xn--" in host:
        flags.append("Punycode (possible look-alike characters)")
    if host.count("-") >= 2:
        flags.append("Many hyphens in domain")
    if p.scheme == "http":
        flags.append("Not using HTTPS")
    if "@" in url.split("?")[0]:
        flags.append("Contains @ before the path")
    if len(url) > 120:
        flags.append("Unusually long URL")
    parts = [x for x in re.split(r"[.-]", registered) if x]
    first = registered.split(".")[0]
    for b in BRANDS:
        if first != b and any(x == b for x in parts):
            flags.append(f"Uses the brand name '{b}' in an unrelated domain")
        elif first != b and any(difflib.SequenceMatcher(None, x, b).ratio() >= 0.8 for x in parts if len(x) >= 4):
            flags.append(f"Looks like a misspelling of '{b}'")
    return {"url": url, "host": host, "registered_domain": registered, "flags": flags}
