import asyncio
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from uuid import uuid4

from ..config import settings


class AlertHub:
    """Pushes new alerts to dashboards connected over WebSocket."""

    def __init__(self):
        self.sockets: set = set()

    async def connect(self, ws):
        await ws.accept()
        self.sockets.add(ws)

    def disconnect(self, ws):
        self.sockets.discard(ws)

    async def broadcast(self, message: dict):
        for ws in list(self.sockets):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(ws)


hub = AlertHub()


def _send_mail(subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = settings.alert_from or settings.smtp_user, settings.alert_to, subject
    msg.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as s:
        s.starttls()
        if settings.smtp_user:
            s.login(settings.smtp_user, settings.smtp_password)
        s.send_message(msg)


async def raise_alert(db, case: dict) -> None:
    if case["level"] not in ("High", "Critical"):
        return
    alert = {"_id": uuid4().hex, "ts": datetime.now(timezone.utc), "case_id": case["_id"], "level": case["level"],
             "score": case["score"], "subject": case["subject"], "verdict": case["verdict"], "read": False}
    await db.alerts.insert_one(alert)
    await hub.broadcast({"type": "alert", "id": alert["_id"], "case_id": alert["case_id"], "level": alert["level"],
                         "score": alert["score"], "subject": alert["subject"], "ts": alert["ts"].isoformat()})
    if settings.smtp_host and settings.alert_to:
        body = f"{case['level']} risk ({case['score']}/100), verdict: {case['verdict']}\nSubject: {case['subject']}\nCase: {case['_id']}"
        try:
            await asyncio.to_thread(_send_mail, f"[SentinMail] {case['level']} email threat detected", body)
        except (OSError, smtplib.SMTPException):
            pass  # an alert e-mail failure must never block the analysis
