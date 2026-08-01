from __future__ import annotations

import asyncio
import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote

import aiohttp

from .config import Settings


class RateLimiter:
    def __init__(self, rate: float):
        self.interval = 1.0 / max(rate, 0.01)
        self.lock = asyncio.Lock()
        self.last = 0.0

    async def wait(self) -> None:
        async with self.lock:
            delay = self.interval - (time.monotonic() - self.last)
            if delay > 0:
                await asyncio.sleep(delay)
            self.last = time.monotonic()


class Cache:
    def __init__(self, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.execute("CREATE TABLE IF NOT EXISTS responses (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires REAL NOT NULL)")
        self.db.execute("CREATE TABLE IF NOT EXISTS completed (destination_id TEXT PRIMARY KEY, status TEXT NOT NULL, updated REAL NOT NULL)")
        self.db.commit()

    def get(self, key: str) -> Any | None:
        row = self.db.execute("SELECT value, expires FROM responses WHERE key=?", (key,)).fetchone()
        if not row or row[1] < time.time():
            return None
        return json.loads(row[0])

    def put(self, key: str, value: Any, ttl: int = 604800) -> None:
        self.db.execute("INSERT OR REPLACE INTO responses VALUES (?,?,?)", (key, json.dumps(value), time.time() + ttl)); self.db.commit()

    def completed(self, destination_id: str) -> bool:
        row=self.db.execute("SELECT status FROM completed WHERE destination_id=?", (destination_id,)).fetchone()
        return bool(row and row[0] in {"success","review","duplicate"})

    def finish(self, destination_id: str, status: str) -> None:
        self.db.execute("INSERT OR REPLACE INTO completed VALUES (?,?,?)", (destination_id, status, time.time())); self.db.commit()


class Http:
    def __init__(self, session: aiohttp.ClientSession, cache: Cache, limiter: RateLimiter, user_agent: str):
        self.session, self.cache, self.limiter, self.user_agent = session, cache, limiter, user_agent

    async def json(self, url: str, *, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None, ttl: int = 604800) -> Any:
        key = hashlib.sha256(json.dumps([url, params], sort_keys=True).encode()).hexdigest()
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        await self.limiter.wait()
        merged = {"User-Agent": self.user_agent, **(headers or {})}
        for attempt in range(4):
            async with self.session.get(url, params=params, headers=merged) as response:
                if response.status == 429 or response.status >= 500:
                    await asyncio.sleep(2 ** attempt); continue
                response.raise_for_status(); data = await response.json(content_type=None)
                self.cache.put(key, data, ttl); return data
        raise RuntimeError(f"request failed after retries: {url}")


class Supabase:
    def __init__(self, settings: Settings, session: aiohttp.ClientSession):
        self.s, self.session = settings, session
        self.headers = {"apikey": settings.service_key, "Authorization": f"Bearer {settings.service_key}"}

    async def destinations(self, limit: int | None = None, start_offset: int = 0) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []; offset = start_offset
        while True:
            page_size = min(1000, limit - len(rows)) if limit else 1000
            if page_size <= 0: break
            params = {"select": "id,name,region,city,location,category", "order": "id", "limit": str(page_size), "offset": str(offset)}
            async with self.session.get(f"{self.s.supabase_url}/rest/v1/destinations", params=params, headers=self.headers) as r:
                r.raise_for_status(); page = await r.json(); rows.extend(page)
            if len(page) < page_size: break
            offset += page_size
        return rows

    async def phashes(self) -> list[str]:
        async with self.session.get(f"{self.s.supabase_url}/rest/v1/destination_image_assets", params={"select":"phash","status":"eq.active"}, headers=self.headers) as r:
            if r.status == 404: return []
            r.raise_for_status(); return [x["phash"] for x in await r.json() if x.get("phash")]

    async def insert(self, table: str, payload: dict[str, Any] | list[dict[str, Any]], upsert: bool = False, on_conflict: str | None = None) -> None:
        headers = {**self.headers, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal" if upsert else "return=minimal"}
        params={"on_conflict":on_conflict} if on_conflict else None
        async with self.session.post(f"{self.s.supabase_url}/rest/v1/{table}", params=params, json=payload, headers=headers) as r:
            if r.status >= 300: raise RuntimeError(f"Supabase {table}: {r.status} {await r.text()}")

    async def patch_destination(self, destination_id: str, payload: dict[str, Any]) -> None:
        headers = {**self.headers, "Content-Type": "application/json", "Prefer": "return=minimal"}
        async with self.session.patch(f"{self.s.supabase_url}/rest/v1/destinations", params={"id": f"eq.{destination_id}"}, json=payload, headers=headers) as r:
            if r.status >= 300: raise RuntimeError(await r.text())

    async def patch_candidate(self, run_id: str, destination_id: str, source: str, source_id: str, status: str) -> None:
        params={"run_id":f"eq.{run_id}","destination_id":f"eq.{destination_id}","source":f"eq.{source}","source_id":f"eq.{source_id}"}
        headers={**self.headers,"Content-Type":"application/json","Prefer":"return=minimal"}
        async with self.session.patch(f"{self.s.supabase_url}/rest/v1/destination_image_candidates",params=params,json={"status":status},headers=headers) as r:
            if r.status >= 300: raise RuntimeError(await r.text())

    async def upload(self, path: str, content: bytes) -> str:
        url = f"{self.s.supabase_url}/storage/v1/object/{self.s.bucket}/{quote(path)}"
        headers = {**self.headers, "Content-Type": "image/webp", "x-upsert": "true", "Cache-Control": "31536000"}
        async with self.session.post(url, data=content, headers=headers) as r:
            if r.status >= 300: raise RuntimeError(f"upload: {r.status} {await r.text()}")
        return f"{self.s.supabase_url}/storage/v1/object/public/{self.s.bucket}/{path}"
