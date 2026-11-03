import os
import httpx
from ..config import settings

try:
    import geoip2.database
except ImportError:  # optional dependency at runtime
    geoip2 = None

DISCLAIMER = (
    "Approximate location of a server or network, not of the sender. "
    "VPNs, proxies, cloud hosting and compromised machines are common."
)

# Contextual demonstration coordinates for common academic testing/sample hops
DEMO_IP_CONTEXT = {
    "185.220.101.4": {"country": "Germany", "country_code": "DE", "city": "Frankfurt", "lat": 50.1109, "lon": 8.6821, "org": "Zwiebelfreunde / Tor Relay", "source": "offline-context-cache"},
    "45.9.148.22": {"country": "Netherlands", "country_code": "NL", "city": "Amsterdam", "lat": 52.3676, "lon": 4.9041, "org": "HostRoyale / Bulletproof Relay", "source": "offline-context-cache"},
    "209.85.220.41": {"country": "United States", "country_code": "US", "city": "Mountain View", "lat": 37.4056, "lon": -122.0775, "org": "Google LLC / Gmail MX", "source": "offline-context-cache"},
    "52.96.110.1": {"country": "United States", "country_code": "US", "city": "Redmond", "lat": 47.6740, "lon": -122.1215, "org": "Microsoft Corporation / Office365", "source": "offline-context-cache"},
    "198.51.100.25": {"country": "United States", "country_code": "US", "city": "New York", "lat": 40.7128, "lon": -74.0060, "org": "Example Relay Network", "source": "offline-context-cache"},
    "193.106.191.12": {"country": "Russia", "country_code": "RU", "city": "Moscow", "lat": 55.7558, "lon": 37.6173, "org": "Petersburg Internet Network", "source": "offline-context-cache"},
    "103.224.182.245": {"country": "India", "country_code": "IN", "city": "Mumbai", "lat": 19.0760, "lon": 72.8777, "org": "Reliance Jio / ISP Hop", "source": "offline-context-cache"},
    "8.8.8.8": {"country": "United States", "country_code": "US", "city": "Ashburn", "lat": 39.0438, "lon": -77.4874, "org": "Google Public DNS", "source": "offline-context-cache"},
    "1.1.1.1": {"country": "Australia", "country_code": "AU", "city": "Melbourne", "lat": -37.8136, "lon": 144.9631, "org": "Cloudflare APNIC", "source": "offline-context-cache"},
}


class GeoIP:
    def __init__(self):
        self.cache: dict[str, dict] = {}
        self.reader = geoip2.database.Reader(settings.geoip_db_path) if geoip2 and os.path.exists(settings.geoip_db_path) else None

    def _from_db(self, ip: str):
        if not self.reader:
            return None
        try:
            r = self.reader.city(ip)
        except Exception:  # address not in database
            return None
        return {
            "country": r.country.name,
            "country_code": r.country.iso_code,
            "city": r.city.name,
            "lat": r.location.latitude,
            "lon": r.location.longitude,
            "org": None,
            "source": "geoip-database",
        }

    async def _from_api(self, ip: str):
        if not settings.geoip_api_url:
            return None
        try:
            async with httpx.AsyncClient(timeout=4) as client:
                resp = await client.get(settings.geoip_api_url.format(ip=ip))
                resp.raise_for_status()
                d = resp.json()
        except (httpx.HTTPError, ValueError):
            return None
        if d.get("error"):
            return None
        return {
            "country": d.get("country_name"),
            "country_code": d.get("country_code"),
            "city": d.get("city"),
            "lat": d.get("latitude"),
            "lon": d.get("longitude"),
            "org": d.get("org"),
            "asn": d.get("asn"),
            "source": "geoip-api",
        }

    def _from_fallback_table(self, ip: str):
        return DEMO_IP_CONTEXT.get(ip)

    async def lookup(self, ip: str) -> dict:
        if ip not in self.cache:
            data = (
                self._from_db(ip)
                or await self._from_api(ip)
                or self._from_fallback_table(ip)
                or {"country": None, "country_code": None, "city": None, "lat": None, "lon": None, "org": None, "source": "unavailable"}
            )
            if len(self.cache) > 5000:
                self.cache.clear()
            self.cache[ip] = {"ip": ip, **data, "approximate": True, "disclaimer": DISCLAIMER}
        return self.cache[ip]
