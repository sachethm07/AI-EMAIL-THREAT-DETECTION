"""Optional: pull unread messages from a mailbox you are authorized to monitor."""
import asyncio
import imaplib

from ..config import settings
from .pipeline import analyze_email


def _fetch_unseen() -> list[bytes]:
    messages = []
    with imaplib.IMAP4_SSL(settings.imap_host) as box:
        box.login(settings.imap_user, settings.imap_password)
        box.select("INBOX")
        _, data = box.search(None, "UNSEEN")
        for num in data[0].split()[:25]:
            _, parts = box.fetch(num, "(RFC822)")
            if parts and isinstance(parts[0], tuple):
                messages.append(parts[0][1])
    return messages


async def poll_loop(db) -> None:
    while True:
        try:
            for raw in await asyncio.to_thread(_fetch_unseen):
                await analyze_email(db, raw, "imap-ingest")
        except (OSError, imaplib.IMAP4.error):
            pass  # try again on the next cycle
        await asyncio.sleep(settings.imap_poll_seconds)
