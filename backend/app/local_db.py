"""Local embedded database fallback when MongoDB is not running.
Implements the Motor async collection and cursor interface over SQLite.
"""
import asyncio
import copy
import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError


def _json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, bytes):
        return obj.decode("latin1")
    raise TypeError(f"Type {type(obj)} not serializable")


def _deserialize(d: dict) -> dict:
    for k in ("created_at", "ts", "collected_at"):
        if k in d and isinstance(d[k], str):
            try:
                d[k] = datetime.fromisoformat(d[k].replace("Z", "+00:00"))
            except Exception:
                pass
    if "evidence" in d and isinstance(d["evidence"], dict):
        if "collected_at" in d["evidence"] and isinstance(d["evidence"]["collected_at"], str):
            try:
                d["evidence"]["collected_at"] = datetime.fromisoformat(d["evidence"]["collected_at"].replace("Z", "+00:00"))
            except Exception:
                pass
    return d


class LocalCursor:
    def __init__(self, docs: list[dict], projection: dict | None = None):
        self._docs = docs
        self._projection = projection
        self._skip = 0
        self._limit = None
        self._sort_key = None
        self._sort_dir = 1
        self._index = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            k, d = key_or_list[0]
            self._sort_key = k
            self._sort_dir = d
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    def skip(self, n: int):
        self._skip = n
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def _apply(self) -> list[dict]:
        res = list(self._docs)
        if self._sort_key:
            rev = (self._sort_dir == -1)

            def sort_val(doc):
                v = doc.get(self._sort_key)
                if isinstance(v, datetime):
                    return v.timestamp()
                return v if v is not None else ""

            res.sort(key=sort_val, reverse=rev)
        if self._skip:
            res = res[self._skip:]
        if self._limit is not None:
            res = res[:self._limit]
        if self._projection is not None:
            out = []
            include_keys = {k for k, v in self._projection.items() if v == 1 and k != "_id"}
            exclude_keys = {k for k, v in self._projection.items() if v == 0}
            include_id = self._projection.get("_id", 1) != 0

            for doc in res:
                if include_keys:
                    d = {k: copy.deepcopy(doc[k]) for k in include_keys if k in doc}
                    if include_id and "_id" in doc:
                        d["_id"] = doc["_id"]
                    out.append(d)
                elif exclude_keys:
                    d = {k: copy.deepcopy(v) for k, v in doc.items() if k not in exclude_keys}
                    out.append(d)
                else:
                    out.append(copy.deepcopy(doc))
            return out
        return [copy.deepcopy(d) for d in res]

    def __aiter__(self):
        self._final = self._apply()
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self._final):
            item = self._final[self._index]
            self._index += 1
            return item
        raise StopAsyncIteration

    async def to_list(self, length: int | None = None) -> list[dict]:
        docs = self._apply()
        return docs if length is None else docs[:length]


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int):
        self.matched_count = matched_count
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class LocalCollection:
    def __init__(self, db_path: str, name: str):
        self.db_path = db_path
        self.name = name
        self._init_table()

    def _init_table(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.name} (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TEXT
                )
            """)
            conn.commit()

    def _matches(self, doc: dict, filter: dict | None) -> bool:
        if not filter:
            return True
        for k, v in filter.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if isinstance(v, dict):
                if "$in" in v:
                    target = doc.get(k)
                    in_list = v["$in"]
                    if isinstance(target, list):
                        if not any(item in in_list for item in target):
                            return False
                    elif target not in in_list:
                        return False
                elif "$regex" in v:
                    pattern = v["$regex"]
                    flags = re.I if v.get("$options") == "i" else 0
                    val = str(doc.get(k) or "")
                    if not re.search(pattern, val, flags):
                        return False
                elif "$gte" in v:
                    val = doc.get(k)
                    bound = v["$gte"]
                    if isinstance(val, str):
                        try:
                            val = datetime.fromisoformat(val)
                        except Exception:
                            pass
                    if val is None or val < bound:
                        return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    def _all_docs_sync(self) -> list[dict]:
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.cursor()
            cur.execute(f"SELECT data FROM {self.name}")
            rows = cur.fetchall()
            docs = []
            for (raw,) in rows:
                try:
                    d = json.loads(raw)
                    docs.append(_deserialize(d))
                except Exception:
                    pass
            return docs

    def _find_one_sync(self, filter: dict | None, projection: dict | None) -> dict | None:
        docs = self._all_docs_sync()
        for d in docs:
            if self._matches(d, filter):
                cursor = LocalCursor([d], projection)
                res = cursor._apply()
                return res[0] if res else None
        return None

    async def find_one(self, filter: dict | None = None, projection: dict | None = None) -> dict | None:
        return self._find_one_sync(filter, projection)

    def find(self, filter: dict | None = None, projection: dict | None = None) -> LocalCursor:
        docs = [d for d in self._all_docs_sync() if self._matches(d, filter)]
        return LocalCursor(docs, projection)

    def _insert_one_sync(self, doc: dict) -> str:
        doc_id = str(doc.get("_id") or os.urandom(16).hex())
        # Check unique constraint for users (email) and iocs (type, value)
        if self.name == "users" and "email" in doc:
            if self._find_one_sync({"email": doc["email"]}, None):
                raise DuplicateKeyError(f"User with email {doc['email']} already exists")
        elif self.name == "iocs" and "type" in doc and "value" in doc:
            if self._find_one_sync({"type": doc["type"], "value": doc["value"]}, None):
                raise DuplicateKeyError(f"IoC {doc['type']}:{doc['value']} already exists")

        doc_copy = copy.deepcopy(doc)
        doc_copy["_id"] = doc_id
        data_str = json.dumps(doc_copy, default=_json_serial)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(f"INSERT INTO {self.name} (id, data, created_at) VALUES (?, ?, ?)",
                         (doc_id, data_str, datetime.now(timezone.utc).isoformat()))
            conn.commit()
        return doc_id

    async def insert_one(self, doc: dict) -> InsertResult:
        return InsertResult(self._insert_one_sync(doc))

    def _update_one_sync(self, filter: dict, update: dict, upsert: bool) -> tuple[int, int]:
        docs = self._all_docs_sync()
        target = None
        for d in docs:
            if self._matches(d, filter):
                target = d
                break

        if not target:
            if upsert:
                new_doc = copy.deepcopy(filter)
                if "$set" in update:
                    new_doc.update(update["$set"])
                if "_id" not in new_doc:
                    new_doc["_id"] = os.urandom(16).hex()
                self._insert_one_sync(new_doc)
                return (0, 1)
            return (0, 0)

        if "$set" in update:
            target.update(update["$set"])

        data_str = json.dumps(target, default=_json_serial)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(f"UPDATE {self.name} SET data = ? WHERE id = ?", (data_str, target["_id"]))
            conn.commit()
        return (1, 1)

    async def update_one(self, filter: dict, update: dict, upsert: bool = False) -> UpdateResult:
        matched, modified = self._update_one_sync(filter, update, upsert)
        return UpdateResult(matched, modified)

    def _delete_one_sync(self, filter: dict) -> int:
        doc = self._find_one_sync(filter, None)
        if not doc:
            return 0
        doc_id = doc["_id"]
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (doc_id,))
            conn.commit()
        return 1

    async def delete_one(self, filter: dict) -> DeleteResult:
        return DeleteResult(self._delete_one_sync(filter))

    async def count_documents(self, filter: dict | None = None) -> int:
        docs = self._all_docs_sync()
        return sum(1 for d in docs if self._matches(d, filter))

    async def create_index(self, keys, **kwargs):
        return "ok"

    def aggregate(self, pipeline: list[dict]) -> LocalCursor:
        docs = self._all_docs_sync()
        results = []

        is_stats_level = any(stage.get("$group", {}).get("_id") == "$level" for stage in pipeline)
        is_stats_verdict = any(stage.get("$group", {}).get("_id") == "$verdict" for stage in pipeline)
        is_unwind_hops = any("$unwind" in stage for stage in pipeline)
        is_date_group = any("$dateToString" in str(stage) for stage in pipeline)

        if is_stats_level:
            counts = {}
            for d in docs:
                lvl = d.get("level", "Low")
                counts[lvl] = counts.get(lvl, 0) + 1
            results = [{"_id": k, "n": v} for k, v in counts.items()]
        elif is_stats_verdict:
            counts = {}
            for d in docs:
                v = d.get("verdict", "legitimate")
                counts[v] = counts.get(v, 0) + 1
            results = [{"_id": k, "n": v} for k, v in counts.items()]
        elif is_unwind_hops:
            hops = []
            for d in docs:
                for h in d.get("hops", []):
                    geo = h.get("geo") or {}
                    if geo.get("lat") is not None and geo.get("lon") is not None:
                        hops.append(h)
            if any("$hops.geo.country" in str(stage) for stage in pipeline):
                country_counts = {}
                for h in hops:
                    c = h.get("geo", {}).get("country") or "Unknown"
                    country_counts[c] = country_counts.get(c, 0) + 1
                sorted_c = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
                results = [{"_id": k, "n": v} for k, v in sorted_c[:10]]
            else:
                pts = {}
                for h in hops:
                    g = h.get("geo") or {}
                    key = (g.get("lat"), g.get("lon"), g.get("city") or "Unknown")
                    pts[key] = pts.get(key, 0) + 1
                results = [{"_id": {"lat": k[0], "lon": k[1], "city": k[2]}, "n": v} for k, v in pts.items()]
        elif is_date_group:
            counts = {}
            for d in docs:
                dt = d.get("created_at")
                if dt:
                    if isinstance(dt, datetime):
                        ds = dt.strftime("%Y-%m-%d")
                    else:
                        ds = str(dt)[:10]
                    counts[ds] = counts.get(ds, 0) + 1
            sorted_dates = sorted(counts.items())
            results = [{"_id": k, "n": v} for k, v in sorted_dates]
        else:
            results = docs

        return LocalCursor(results)


DEFAULT_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".sentinmail.db"))


class LocalDatabase:
    def __init__(self, db_path: str | None = None):
        self.db_path = db_path or os.getenv("SQLITE_DB_PATH") or DEFAULT_DB_PATH
        self._collections: dict[str, LocalCollection] = {}

    def __getitem__(self, name: str) -> LocalCollection:
        if name not in self._collections:
            self._collections[name] = LocalCollection(self.db_path, name)
        return self._collections[name]

    @property
    def users(self) -> LocalCollection:
        return self["users"]

    @property
    def cases(self) -> LocalCollection:
        return self["cases"]

    @property
    def iocs(self) -> LocalCollection:
        return self["iocs"]

    @property
    def audit(self) -> LocalCollection:
        return self["audit"]

    @property
    def alerts(self) -> LocalCollection:
        return self["alerts"]
