from email.message import EmailMessage

import pytest

from app.services import attachments, forensics, header_analysis, scoring, url_analysis
from app.services.parser import parse_email


def sample_email() -> bytes:
    msg = EmailMessage()
    msg["From"] = '"HDFC Bank Security" <alerts@hdfc-secure-bankk.top>'
    msg["Reply-To"] = "support.desk@gmail.com"
    msg["Return-Path"] = "<bounce@mailer-xk.ru>"
    msg["To"] = "user@example.org"
    msg["Subject"] = "URGENT: verify your password"
    msg["Authentication-Results"] = "mx.example.org; spf=fail; dkim=none; dmarc=fail"
    msg.add_header("Received", "from unknown ([45.9.148.22]) by mail.example.org; Fri, 16 Oct 2026 09:14:00 +0530")
    msg.add_header("Received", "from [185.220.101.4] by relay.example.net; Fri, 16 Oct 2026 03:43:58 +0000")
    msg.set_content("Verify now at http://hdfc-secure-bankk.top/login")
    msg.add_attachment(b"MZ-not-a-real-binary", maintype="application", subtype="octet-stream", filename="KYC_Form.pdf.exe")
    return msg.as_bytes()


def test_parse_and_header_findings():
    p = parse_email(sample_email())
    assert p["from_domain"] == "hdfc-secure-bankk.top"
    assert p["attachments"][0]["sha256"]
    assert [h["ip"] for h in header_analysis.extract_hops(p["received"])] == ["185.220.101.4", "45.9.148.22"]
    codes = {a["code"] for a in header_analysis.anomalies(p)}
    assert {"REPLY_TO_MISMATCH", "RETURN_PATH_MISMATCH"} <= codes
    assert header_analysis.authentication(p["authentication_results"], None) == {"spf": "fail", "dkim": "none", "dmarc": "fail"}


def test_url_and_attachment_flags():
    flags = url_analysis.analyze_url("http://hdfc-secure-bankk.top/login")["flags"]
    assert any("hdfc" in f for f in flags) and "Not using HTTPS" in flags
    att = parse_email(sample_email())["attachments"][0]
    assert "Double extension disguises the real file type" in attachments.flags(att)


def test_language_indicators():
    nlp = pytest.importorskip("app.services.nlp")
    out = nlp.indicators("URGENT: verify your password immediately or your account is suspended")
    assert {"urgency", "credentials", "threat"} <= set(out["categories"])


def test_scoring_separates_clean_from_malicious():
    clean = scoring.score({"label": "legitimate", "confidence": 0.95, "p_malicious": 0.05}, {"categories": {}, "points": 0},
                          {"spf": "pass", "dkim": "pass", "dmarc": "pass"}, [], [], [], [])
    assert clean["level"] == "Low" and clean["verdict"] == "legitimate"
    bad = scoring.score({"label": "phishing", "confidence": 0.95, "p_malicious": 0.95}, {"categories": {"urgency": ["urgent"]}, "points": 8},
                        {"spf": "fail", "dkim": "none", "dmarc": "fail"}, [{"points": 12, "detail": "x"}],
                        [{"flags": ["a", "b"]}], [{"flags": ["exe", "double"]}], [{"severity": "high"}])
    assert bad["level"] in ("High", "Critical") and bad["score"] <= 100


def test_evidence_chain_detects_tampering():
    raw = sample_email()
    ev = forensics.build_evidence(raw, parse_email(raw), {"ip": ["1.2.3.4"]}, "tester")
    assert forensics.verify_chain(ev, raw)["valid"]
    ev["items"][1]["sha256"] = "0" * 64
    assert not forensics.verify_chain(ev, raw)["valid"]


def test_allowed_extensions_and_binary_guards():
    from app.routers.analysis import ALLOWED_EMAIL_EXTENSIONS
    assert {".eml", ".msg", ".txt"} <= ALLOWED_EMAIL_EXTENSIONS
    assert ".exe" not in ALLOWED_EMAIL_EXTENSIONS
    assert ".pdf" not in ALLOWED_EMAIL_EXTENSIONS
    assert ".zip" not in ALLOWED_EMAIL_EXTENSIONS


def test_malformed_email_parser_resilience():
    # Corrupted encoding in body must parse without crashing
    malformed_body = b"Subject: Corrupted Packet\nFrom: alert@test.org\n\nGarbage body \x00\xff\xfe\xca\xfe"
    parsed = parse_email(malformed_body)
    assert parsed["subject"] == "Corrupted Packet"
    assert parsed["from_addr"] == "alert@test.org"
    assert "raw_sha256" in parsed
    assert len(parsed["raw_sha256"]) == 64

    # Completely unparseable binary header garbage must not crash
    raw_garbage = b"\x00\xff\xfe\xca\xfe\xba\xbe\n\nGarbage payload"
    parsed_garbage = parse_email(raw_garbage)
    assert parsed_garbage["raw_sha256"]
    assert parsed_garbage["subject"] is None

    # Completely empty message
    empty_parsed = parse_email(b"")
    assert empty_parsed["from_addr"] == ""
    assert empty_parsed["subject"] is None
    assert empty_parsed["body_text"] == ""


def test_geoip_disclaimer_and_approximate_context():
    from app.services.geoip import DISCLAIMER, DEMO_IP_CONTEXT
    assert "not of the sender" in DISCLAIMER.lower() or "approximate" in DISCLAIMER.lower()
    assert "185.220.101.4" in DEMO_IP_CONTEXT
    assert DEMO_IP_CONTEXT["185.220.101.4"]["country"] == "Germany"
