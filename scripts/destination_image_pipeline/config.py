from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_USER_AGENT = "TankuaDestinationImages/1.0 (contact: admin@tankua.app)"


def load_dotenv(path: Path = Path(".env")) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


@dataclass(frozen=True, slots=True)
class Settings:
    supabase_url: str
    service_key: str
    bucket: str = "destinations"
    concurrency: int = 4
    request_timeout: int = 35
    requests_per_second: float = 2.0
    auto_threshold: float = 0.85
    reject_threshold: float = 0.45
    max_candidates_per_provider: int = 5
    cache_path: str = ".cache/destination_image_pipeline.sqlite3"
    work_dir: str = ".cache/destination_image_work"
    google_api_key: str = ""
    flickr_api_key: str = ""
    unsplash_access_key: str = ""
    user_agent: str = DEFAULT_USER_AGENT

    @classmethod
    def from_env(cls) -> "Settings":
        load_dotenv()
        url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
        return cls(
            supabase_url=url.rstrip("/"), service_key=key,
            bucket=os.getenv("DEST_IMAGE_BUCKET", "destinations"),
            concurrency=int(os.getenv("DEST_IMAGE_CONCURRENCY", "4")),
            request_timeout=int(os.getenv("DEST_IMAGE_TIMEOUT", "35")),
            requests_per_second=float(os.getenv("DEST_IMAGE_RPS", "2")),
            auto_threshold=float(os.getenv("DEST_IMAGE_AUTO_THRESHOLD", "0.85")),
            reject_threshold=float(os.getenv("DEST_IMAGE_REJECT_THRESHOLD", "0.45")),
            max_candidates_per_provider=int(os.getenv("DEST_IMAGE_CANDIDATES_PER_PROVIDER", "5")),
            cache_path=os.getenv("DEST_IMAGE_CACHE", ".cache/destination_image_pipeline.sqlite3"),
            work_dir=os.getenv("DEST_IMAGE_WORK_DIR", ".cache/destination_image_work"),
            google_api_key=os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY", ""),
            flickr_api_key=os.getenv("FLICKR_API_KEY", ""),
            unsplash_access_key=os.getenv("UNSPLASH_ACCESS_KEY", ""),
            user_agent=os.getenv("DEST_IMAGE_USER_AGENT", DEFAULT_USER_AGENT),
        )
