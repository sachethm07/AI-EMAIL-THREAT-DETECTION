from datetime import datetime, timezone


async def audit(db, actor: str, action: str, target: str | None = None, meta: dict | None = None) -> None:
    await db.audit.insert_one({"ts": datetime.now(timezone.utc), "actor": actor, "action": action, "target": target, "meta": meta or {}})
