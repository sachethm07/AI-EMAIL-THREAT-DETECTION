import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


def _bool(v: str) -> bool:
    return v.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db: str = os.getenv("MONGO_DB", "sentinmail")
    jwt_secret: str = os.getenv("JWT_SECRET", "sentinmail-super-secret-jwt-key-32-chars-academic-2026")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))
    cors_origins: tuple = tuple(
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000").split(",") if o.strip()
    )
    admin_email: str = os.getenv("ADMIN_EMAIL", "admin@sentinmail.org")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "AdminPassword123!")
    model_path: str = os.getenv("MODEL_PATH", "ml/model.joblib")
    geoip_db_path: str = os.getenv("GEOIP_DB_PATH", "data/GeoLite2-City.mmdb")
    geoip_api_url: str = os.getenv("GEOIP_API_URL", "")
    abuseipdb_key: str = os.getenv("ABUSEIPDB_KEY", "")
    max_upload_bytes: int = 5 * 1024 * 1024
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    alert_from: str = os.getenv("ALERT_FROM", "")
    alert_to: str = os.getenv("ALERT_TO", "")
    imap_enabled: bool = _bool(os.getenv("IMAP_ENABLED", "false"))
    imap_host: str = os.getenv("IMAP_HOST", "")
    imap_user: str = os.getenv("IMAP_USER", "")
    imap_password: str = os.getenv("IMAP_PASSWORD", "")
    imap_poll_seconds: int = int(os.getenv("IMAP_POLL_SECONDS", "120"))


settings = Settings()
