import logging
import os
import socket
from urllib.parse import urlparse

from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings
from .local_db import LocalDatabase

logger = logging.getLogger("sentinmail.db")

_client = None
_db = None


def _is_mongo_reachable(uri: str) -> bool:
    if os.getenv("USE_LOCAL_DB", "").lower() in ("1", "true", "yes"):
        return False
    try:
        p = urlparse(uri)
        host = p.hostname or "127.0.0.1"
        if host == "localhost":
            host = "127.0.0.1"
        port = p.port or 27017
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.15)
        res = s.connect_ex((host, port))
        s.close()
        return res == 0
    except Exception:
        return False


def get_db():
    global _client, _db
    if _db is not None:
        return _db

    if settings.mongo_uri and _is_mongo_reachable(settings.mongo_uri):
        try:
            _client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=1000)
            _db = _client[settings.mongo_db]
            logger.info(f"Connected to MongoDB at {settings.mongo_uri}")
            return _db
        except Exception as e:
            logger.warning(f"MongoDB connection failed ({e}), falling back to local SQLite database.")

    logger.info("Using local SQLite development database (.sentinmail.db).")
    _db = LocalDatabase()
    return _db


def db_dep():
    return get_db()


async def init_indexes(db) -> None:
    try:
        await db.users.create_index("email", unique=True)
        await db.cases.create_index([("created_at", -1)])
        await db.cases.create_index("level")
        await db.iocs.create_index([("type", 1), ("value", 1)], unique=True)
        await db.audit.create_index([("ts", -1)])
        await db.alerts.create_index([("ts", -1)])
    except Exception as e:
        logger.warning(f"Index initialization notice: {e}")
