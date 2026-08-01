#!/usr/bin/env python3
"""Enrich destination rows with OpenStreetMap and optional Wikimedia images.

The source SQL is never modified. The script emits id-targeted UPDATE statements,
a CSV review report, and a resumable JSON cache.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

NOMINATIM = "https://nominatim.openstreetmap.org"
COMMONS = "https://commons.wikimedia.org/w/api.php"
ETHIOPIA_BOUNDS = (3.0, 32.5, 15.5, 48.5)  # south, west, north, east
CACHE_VERSION = 7
IMAGE_MATCH_VERSION = 5
CITY_KEYS = ("city", "town", "municipality", "village", "hamlet", "county")
REGION_KEYS = ("state", "region")
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.I)
IMAGE_STOPWORDS = {
    "ethiopia", "ethiopian", "center", "centre", "complex", "site", "grounds",
    "field", "hub", "outpost", "services", "service", "the", "and", "of",
}
IMAGE_TITLE_BLOCKLIST = {
    "diagram", "drawing", "flag", "icon", "logo", "manuscript", "map",
    "painting", "plan", "sign", "symbol", "coat of arms", "locator",
}
IMAGE_CATEGORY_TERMS = {
    "medical": {"hospital", "clinic", "medical", "health", "healthcare"},
    "agritourism": {
        "agriculture", "agricultural", "bamboo", "coffee", "estate", "farm",
        "farms", "mango", "orchard", "orchards", "plantation", "plantations",
    },
}
ANCHOR_STOPWORDS = IMAGE_STOPWORDS | {
    "accessible", "accessibility", "adventure", "agritourism", "ancient",
    "architecture", "business", "community", "cultural", "dark", "district",
    "educational", "historic", "historical", "luxury", "medical", "modern",
    "national", "nature", "park", "photography", "public", "religious", "resort",
    "retreat", "rural", "shopping", "space", "sports", "tourism", "trail",
    "trek", "trekking", "urban", "village", "volunteer", "voluntourism",
    "wellness", "wilderness", "hospital", "rehabilitation", "rehab", "bamboo",
    "mango", "farms", "farm", "dock", "hazard", "hazards", "lava", "extreme",
    "referral", "pastoral", "pastoralist", "communities", "education",
    "mount", "mountain", "lake", "river", "valley",
    "academy", "agro", "apartments", "artisans", "ballrooms", "base", "belt",
    "biosphere", "boating", "bush", "canopy", "cathedral", "city", "coffee",
    "conference", "conservation", "convention", "course", "crocodile", "date",
    "desert", "dining", "estate", "facilities", "farming", "ferry", "forest",
    "gold", "handicrafts", "hartebeest", "health", "highlands", "hillside",
    "honey", "hotel", "hot", "houses", "island", "lodge", "market", "memorial",
    "mine", "museum", "orchards", "palace", "palm", "pier", "pilgrims",
    "pottery", "projects", "racecourse", "research", "ridge", "safari", "sauna",
    "shore", "springs", "stadium", "statue", "stelae", "suites", "terminal",
    "training", "water", "waterfall", "wine", "women", "zipline",
    "african", "big", "culture", "encampment", "game", "haile", "pan",
    "rainforest",
}
REGION_TAG_ALIASES = {
    "addis": "addis ababa", "addis-ababa": "addis ababa", "afar": "afar",
    "amhara": "amhara", "benishangul": "benishangul-gumuz",
    "benishangul-gumuz": "benishangul-gumuz", "dire-dawa": "dire dawa",
    "gambella": "gambela", "gambela": "gambela", "harari": "harari",
    "oromia": "oromia", "sidama": "sidama", "somali": "somali",
    "tigray": "tigray",
}


def cli() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate safe SQL updates for destination location and image enrichment."
    )
    parser.add_argument("input", type=Path, help="SQL export containing INSERT INTO destinations")
    parser.add_argument(
        "--existing-csv",
        type=Path,
        help="Current CSV export used to preserve fields already populated in the database",
    )
    parser.add_argument("-o", "--output", type=Path, default=Path("destinations_enriched.sql"))
    parser.add_argument("--report", type=Path, default=Path("destinations_enrichment_report.csv"))
    parser.add_argument("--cache", type=Path, default=Path(".cache/destination_enrichment.json"))
    parser.add_argument("--email", default=os.getenv("NOMINATIM_EMAIL"), help="Contact email sent to Nominatim")
    parser.add_argument("--user-agent", default="TankuaDestinationEnricher/1.0")
    parser.add_argument("--limit", type=int, help="Process at most this many rows (useful for testing)")
    parser.add_argument("--offset", type=int, default=0, help="Skip this many source rows before processing")
    parser.add_argument("--delay", type=float, default=1.1, help="Seconds between Nominatim requests")
    parser.add_argument("--force", action="store_true", help="Replace fields that already contain values")
    parser.add_argument(
        "--accept-anchor",
        action="store_true",
        help="Generate updates for parent-area anchors after reviewing the CSV",
    )
    parser.add_argument(
        "--approved-anchor-ids",
        type=Path,
        help="Text file containing one reviewed destination UUID per line",
    )
    parser.add_argument(
        "--accept-anchor-min-score",
        type=float,
        help="Accept region-bearing anchors at or above this score (0 to 1)",
    )
    parser.add_argument(
        "--skip-geocoding",
        action="store_true",
        help="Skip location lookups (useful for a parallel image-only run)",
    )
    parser.add_argument("--images", action="store_true", help="Find one freely licensed Wikimedia image")
    parser.add_argument(
        "--image-search-limit", type=int, default=2,
        help="Maximum Wikimedia search queries per destination",
    )
    parser.add_argument(
        "--image-min-score", type=float, default=0.5,
        help="Minimum Wikimedia title relevance score",
    )
    parser.add_argument("--image-dir", type=Path, default=Path("destination-images"))
    parser.add_argument("--upload", action="store_true", help="Upload downloaded WebP files to Supabase Storage")
    parser.add_argument(
        "--approved-image-ids",
        type=Path,
        help="Text file containing reviewed destination UUIDs approved for image upload",
    )
    parser.add_argument("--bucket", default="destinations")
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL"))
    parser.add_argument("--supabase-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--dry-run", action="store_true", help="Query/cache results but do not write SQL or images")
    args = parser.parse_args()
    if args.upload and not args.images:
        parser.error("--upload requires --images")
    if args.upload and not args.approved_image_ids:
        parser.error("--upload requires --approved-image-ids")
    if args.skip_geocoding and not args.images:
        parser.error("--skip-geocoding requires --images")
    if args.upload and (not args.supabase_url or not args.supabase_key):
        parser.error("--upload requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    return args


def split_sql_values(text: str) -> list[str]:
    values, buf, quoted, depth, i = [], [], False, 0, 0
    while i < len(text):
        char = text[i]
        if char == "'":
            buf.append(char)
            if quoted and i + 1 < len(text) and text[i + 1] == "'":
                buf.append("'")
                i += 2
                continue
            quoted = not quoted
        elif not quoted and char in "([{":
            depth += 1
            buf.append(char)
        elif not quoted and char in ")]}":
            depth -= 1
            buf.append(char)
        elif not quoted and char == "," and depth == 0:
            values.append("".join(buf).strip())
            buf = []
        else:
            buf.append(char)
        i += 1
    values.append("".join(buf).strip())
    return values


def sql_scalar(value: str) -> Any:
    value = value.strip()
    if value.lower() == "null":
        return None
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1].replace("''", "'")
    if value.startswith("ARRAY["):
        inner = value[6:-1]
        return [] if not inner.strip() else [sql_scalar(item) for item in split_sql_values(inner)]
    return value


def parse_destinations(path: Path) -> list[dict[str, Any]]:
    source = path.read_text(encoding="utf-8-sig")
    match = re.search(
        r'INSERT\s+INTO\s+(?:"public"\.)?"destinations"\s*\((.*?)\)\s*VALUES\s*',
        source,
        flags=re.I | re.S,
    )
    if not match:
        raise ValueError("Could not find an INSERT INTO public.destinations ... VALUES statement")
    columns = [part.strip().strip('"') for part in split_sql_values(match.group(1))]
    rows, quoted, depth, start, i = [], False, 0, None, match.end()
    while i < len(source):
        char = source[i]
        if char == "'":
            if quoted and i + 1 < len(source) and source[i + 1] == "'":
                i += 2
                continue
            quoted = not quoted
        elif not quoted and char == "(":
            if depth == 0:
                start = i + 1
            depth += 1
        elif not quoted and char == ")":
            depth -= 1
            if depth == 0 and start is not None:
                raw = split_sql_values(source[start:i])
                if len(raw) != len(columns):
                    raise ValueError(f"Row {len(rows) + 1}: expected {len(columns)} fields, found {len(raw)}")
                rows.append(dict(zip(columns, map(sql_scalar, raw))))
                start = None
        elif not quoted and depth == 0 and char == ";":
            break
        i += 1
    if not rows:
        raise ValueError("The destinations INSERT contains no rows")
    return rows


def load_cache(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": CACHE_VERSION, "geocode": {}, "images": {}}
    cache = json.loads(path.read_text(encoding="utf-8"))
    if cache.get("version") == 6 and CACHE_VERSION == 7:
        cache["version"] = CACHE_VERSION
        return cache
    if cache.get("version") != CACHE_VERSION:
        # Request/normalization behavior changed; retain image lookups only.
        return {"version": CACHE_VERSION, "geocode": {}, "images": cache.get("images", {})}
    return cache


def save_cache(path: Path, cache: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    payload = json.dumps(cache, ensure_ascii=False, indent=2)
    for attempt in range(6):
        try:
            temp.write_text(payload, encoding="utf-8")
            temp.replace(path)
            return
        except PermissionError:
            if attempt == 5:
                raise
            time.sleep(0.25 * (attempt + 1))


def request_json(url: str, params: dict[str, Any], user_agent: str, timeout: int = 30) -> Any:
    request_url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(request_url, headers={"User-Agent": user_agent, "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504} or attempt == 3:
                raise
            retry_after = error.headers.get("Retry-After")
            wait = float(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
            time.sleep(min(wait, 30))
    raise RuntimeError("Request retry loop exited unexpectedly")


def query_candidates(row: dict[str, Any]) -> list[str]:
    name = str(row.get("name") or "").strip()
    tags = [str(tag) for tag in (row.get("tags") or [])]
    candidates = [f"{name}, Ethiopia"]
    # Generated rows describe an activity at a real parent place. Search the
    # geographic-looking tags independently instead of combining every concept.
    ranked_tags = sorted(
        tags,
        key=lambda tag: (
            tag.replace("-", " ").casefold() not in name.casefold(),
            len(tag) < 5,
        ),
    )
    anchor_tags = []
    for tag in ranked_tags:
        words = [word for word in tag.lower().split("-") if word not in ANCHOR_STOPWORDS]
        if words and any(len(word) >= 3 for word in words):
            anchor = " ".join(words)
            anchor_tags.append(anchor)
    # Combine independent anchors first to disambiguate names such as Lake Hora
    # (Bishoftu) and Haile Resort (Hawassa).
    if len(anchor_tags) >= 2:
        candidates.append(f"{anchor_tags[0]} {anchor_tags[1]}, Ethiopia")
    for anchor in anchor_tags:
        candidates.append(f"{anchor}, Ethiopia")
        # Common Ethiopian English transliterations vary in doubled consonants.
        simplified = re.sub(r"([a-z])\1", r"\1", anchor)
        if simplified != anchor:
            candidates.append(f"{simplified}, Ethiopia")
    # Progressive name prefixes catch anchors such as "Erta Ale" and "Lake Tana".
    name_words = re.findall(r"[A-Za-z0-9]+", name)
    for size in (3, 2):
        prefix = [word for word in name_words[:size] if word.casefold() not in ANCHOR_STOPWORDS]
        if prefix and any(len(word) >= 4 for word in prefix):
            candidates.append(f"{' '.join(prefix)}, Ethiopia")
    return list(dict.fromkeys(candidates))


def score_result(result: dict[str, Any], name: str, query: str) -> float:
    address = result.get("address") or {}
    country_code = str(address.get("country_code", "")).lower()
    try:
        lat, lon = float(result["lat"]), float(result["lon"])
    except (KeyError, TypeError, ValueError):
        return -1
    south, west, north, east = ETHIOPIA_BOUNDS
    if country_code and country_code != "et":
        return -1
    if not (south <= lat <= north and west <= lon <= east):
        return -1
    normalized_name = set(re.findall(r"\w+", name.casefold()))
    normalized_query = {
        token for token in re.findall(r"\w+", query.casefold())
        if token not in {"ethiopia", "et"}
    }
    normalized_display = set(re.findall(r"\w+", str(result.get("display_name", "")).casefold()))
    name_overlap = len(normalized_name & normalized_display) / max(1, len(normalized_name))
    query_overlap = len(normalized_query & normalized_display) / max(1, len(normalized_query))
    importance = float(result.get("importance") or 0)
    return max(name_overlap, query_overlap * 0.9) * 0.8 + min(importance, 1.0) * 0.2


def significant_tokens(value: Any) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9]+", slugify(str(value)).replace("-", " "))
        if token not in ANCHOR_STOPWORDS and len(token) >= 3
    }


def is_exact_place_match(row: dict[str, Any], result: dict[str, Any], query: str) -> bool:
    full_query = f"{str(row.get('name') or '').strip()}, Ethiopia".casefold()
    if query.casefold() != full_query:
        return False
    expected = significant_tokens(row.get("name"))
    actual = significant_tokens(result.get("display_name"))
    if not expected:
        return False
    return len(expected & actual) / len(expected) >= 0.6


def result_is_too_broad(result: dict[str, Any]) -> bool:
    """Reject administrative centroids when the row describes a specific place."""
    address = result.get("address") or {}
    has_locality = any(address.get(key) for key in CITY_KEYS)
    category = str(result.get("category") or result.get("class") or "").lower()
    result_type = str(result.get("type") or "").lower()
    return not has_locality and category == "boundary" and result_type == "administrative"


def normalize_region(value: Any) -> Any:
    """Keep region labels consistent with existing destination data."""
    if not isinstance(value, str):
        return value
    return re.sub(r"\s+Region$", "", value, flags=re.I).strip()


def normalize_city(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    aliases = {"asela": "Asella", "asosa": "Assosa"}
    return aliases.get(value.casefold().strip(), value.strip())


def canonical_region(value: Any) -> str:
    normalized = re.sub(
        r"-(?:region|regional-state)$", "", slugify(str(normalize_region(value) or ""))
    )
    aliases = {
        "benishangul-gumuz": "benishangul-gumuz", "binshangul-gumuz": "benishangul-gumuz",
        "gambella": "gambela", "gambela": "gambela",
        "south-ethiopia-regional-state": "south-ethiopia",
    }
    return aliases.get(normalized, normalized)


def hinted_region(row: dict[str, Any]) -> str | None:
    if row.get("region"):
        return canonical_region(row["region"])
    tags = {str(tag).casefold() for tag in row.get("tags") or []}
    for tag, region in REGION_TAG_ALIASES.items():
        if tag in tags:
            return canonical_region(region)
    return None


def geocode(row: dict[str, Any], args: argparse.Namespace, cache: dict[str, Any]) -> dict[str, Any]:
    cache_key = str(row["id"])
    if cache_key in cache["geocode"]:
        cached = cache["geocode"][cache_key]
        cached["region"] = normalize_region(cached.get("region"))
        cached["city"] = normalize_city(cached.get("city"))
        if cached.get("status") in {"matched", "anchor"} and float(cached.get("score") or 0) >= 0.35:
            exact = is_exact_place_match(
                row, {"display_name": cached.get("display_name")}, str(cached.get("query") or "")
            )
            cached["status"] = "matched" if exact else "anchor"
            cached["resolution_level"] = "exact" if exact else "anchor"
        return cached
    best, best_score, used_query = None, -1.0, ""
    for query in query_candidates(row):
        params = {
            "q": query,
            "format": "jsonv2",
            "addressdetails": 1,
            "accept-language": "en",
            "countrycodes": "et",
            "limit": 5,
        }
        if args.email:
            params["email"] = args.email
        try:
            results = request_json(f"{NOMINATIM}/search", params, args.user_agent)
        except (urllib.error.URLError, TimeoutError) as error:
            # Do not persist transient failures; the next run should retry them.
            return {"status": "error", "error": str(error)}
        for candidate in results:
            candidate_score = score_result(candidate, str(row["name"]), query)
            if result_is_too_broad(candidate):
                candidate_score = min(candidate_score, 0.34)
            source_region = hinted_region(row)
            candidate_region = next(
                ((candidate.get("address") or {}).get(key) for key in REGION_KEYS if (candidate.get("address") or {}).get(key)),
                None,
            )
            if source_region and candidate_region and source_region != canonical_region(candidate_region):
                candidate_score = -1
            if candidate_score > best_score:
                best, best_score, used_query = candidate, candidate_score, query
        time.sleep(max(args.delay, 1.0))
        if best_score >= 0.64:
            break
    if not best:
        result = {"status": "no_match"}
    else:
        address = best.get("address") or {}
        city = normalize_city(next((address.get(key) for key in CITY_KEYS if address.get(key)), None))
        region = normalize_region(next((address.get(key) for key in REGION_KEYS if address.get(key)), None))
        result = {
            "status": (
                "matched" if best_score >= 0.35 and is_exact_place_match(row, best, used_query)
                else "anchor" if best_score >= 0.35
                else "review"
            ),
            "resolution_level": (
                "exact" if best_score >= 0.35 and is_exact_place_match(row, best, used_query)
                else "anchor" if best_score >= 0.35
                else "review"
            ),
            "score": round(best_score, 3),
            "query": used_query,
            "lat": float(best["lat"]),
            "lng": float(best["lon"]),
            "city": city,
            "region": region,
            "display_name": best.get("display_name"),
            "osm_type": best.get("osm_type"),
            "osm_id": best.get("osm_id"),
        }
    cache["geocode"][cache_key] = result
    return result


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")[:80] or "destination"


def image_match_score(row: dict[str, Any], title: str) -> float:
    title = re.sub(r"^File:", "", title, flags=re.I)
    lowered_title = title.casefold().replace("_", " ").replace("-", " ")
    if any(blocked in lowered_title for blocked in IMAGE_TITLE_BLOCKLIST):
        return 0.0
    raw_title_tokens = set(re.findall(r"[a-z0-9]+", slugify(title).replace("-", " ")))
    title_tokens = {
        token for token in raw_title_tokens
        if token not in ANCHOR_STOPWORDS and len(token) >= 3
    }
    required_terms = IMAGE_CATEGORY_TERMS.get(str(row.get("category") or "").casefold())
    if required_terms and not (raw_title_tokens & required_terms):
        return 0.0
    tags = {str(tag).casefold() for tag in row.get("tags") or []}
    if "qusquam" in tags and not ({"qusquam", "kusquam"} & raw_title_tokens):
        return 0.0
    name_tokens = {
        token for token in re.findall(r"[a-z0-9]+", slugify(str(row.get("name") or "")).replace("-", " "))
        if token not in ANCHOR_STOPWORDS and len(token) >= 3
    }
    overlap = name_tokens & title_tokens
    if not overlap:
        return 0.0
    # One distinctive place name is useful; two shared terms are substantially safer.
    distinctive = any(len(token) >= 6 for token in overlap)
    if len(overlap) == 1 and not distinctive:
        return 0.0
    return min(1.0, len(overlap) / max(2, min(len(name_tokens), 5)))


def commons_image(row: dict[str, Any], geo: dict[str, Any], args: argparse.Namespace, cache: dict[str, Any]) -> dict[str, Any]:
    cache_key = str(row["id"])
    if cache_key in cache["images"]:
        cached = cache["images"][cache_key]
        if cached.get("match_version") == IMAGE_MATCH_VERSION:
            return cached
    candidates = []
    searches = [
        query.removesuffix(", Ethiopia")
        for query in query_candidates(row)[: max(1, args.image_search_limit)]
    ]
    if geo.get("query"):
        searches.insert(0, str(geo["query"]).removesuffix(", Ethiopia"))
    for search in dict.fromkeys(searches):
        params = {
            "action": "query", "generator": "search", "gsrsearch": f"{search} Ethiopia",
            "gsrnamespace": 6, "gsrlimit": 12, "prop": "imageinfo",
            "iiprop": "url|mime|extmetadata", "iiurlwidth": 1400, "format": "json",
            "maxlag": 5, "origin": "*",
        }
        try:
            data = request_json(COMMONS, params, args.user_agent)
        except (urllib.error.URLError, TimeoutError) as error:
            return {"status": "error", "error": str(error), "match_version": IMAGE_MATCH_VERSION}
        pages = (data.get("query") or {}).get("pages") or {}
        for page in pages.values():
            info = (page.get("imageinfo") or [{}])[0]
            mime = str(info.get("mime") or "")
            title = str(page.get("title") or "")
            score = image_match_score(row, title)
            if (
                mime.startswith("image/")
                and mime not in {"image/svg+xml", "image/gif", "image/vnd.djvu"}
                and score >= args.image_min_score
            ):
                candidates.append((score, page, info, search))
        time.sleep(0.35)
    if not candidates:
        result = {"status": "no_match", "match_version": IMAGE_MATCH_VERSION}
    else:
        score, page, info, search = max(candidates, key=lambda candidate: candidate[0])
        metadata = info.get("extmetadata") or {}
        result = {
            "status": "matched",
            "match_version": IMAGE_MATCH_VERSION,
            "match_score": round(score, 3),
            "search": search,
            "title": page.get("title"),
            "source_page": info.get("descriptionurl"),
            "download_url": info.get("thumburl") or info.get("url"),
            "artist": (metadata.get("Artist") or {}).get("value"),
            "license": (metadata.get("LicenseShortName") or {}).get("value"),
            "license_url": (metadata.get("LicenseUrl") or {}).get("value"),
        }
    cache["images"][cache_key] = result
    return result


def download_webp(image: dict[str, Any], row: dict[str, Any], args: argparse.Namespace) -> Path:
    try:
        from PIL import Image, ImageOps
    except ImportError as error:
        raise RuntimeError("Image conversion requires Pillow: python -m pip install Pillow") from error
    request = urllib.request.Request(image["download_url"], headers={"User-Agent": args.user_agent})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read(15 * 1024 * 1024)
    with Image.open(io.BytesIO(payload)) as source:
        converted = ImageOps.exif_transpose(source).convert("RGB")
        converted.thumbnail((1200, 900), Image.Resampling.LANCZOS)
        target_dir = args.image_dir / slugify(str(row["name"]))
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / "cover.webp"
        converted.save(target, "WEBP", quality=78, method=6, optimize=True)
    return target


def upload_supabase(path: Path, row: dict[str, Any], args: argparse.Namespace) -> str:
    object_path = f"{slugify(str(row['name']))}/cover.webp"
    url = (
        f"{args.supabase_url.rstrip('/')}/storage/v1/object/"
        f"{urllib.parse.quote(args.bucket)}/{urllib.parse.quote(object_path)}"
    )
    payload = path.read_bytes()
    for attempt in range(7):
        request = urllib.request.Request(
            url, data=payload, method="POST",
            headers={
                "Authorization": f"Bearer {args.supabase_key}",
                "apikey": args.supabase_key,
                "Content-Type": "image/webp",
                "x-upsert": "true",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=60):
                break
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 6:
                raise
            retry_after = error.headers.get("Retry-After")
            wait = float(retry_after) if retry_after and retry_after.isdigit() else min(5 * (attempt + 1), 30)
            time.sleep(wait)
    time.sleep(0.5)
    return (
        f"{args.supabase_url.rstrip('/')}/storage/v1/object/public/"
        f"{urllib.parse.quote(args.bucket)}/{urllib.parse.quote(object_path)}"
    )


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def load_approved_ids(path: Path | None) -> set[str]:
    if not path:
        return set()
    if not path.exists():
        raise ValueError(f"Approved-anchor file not found: {path}")
    approved = set()
    for line_number, line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
        value = line.strip()
        if not value or value.startswith("#"):
            continue
        if not UUID_RE.match(value):
            raise ValueError(f"{path}:{line_number}: invalid UUID: {value}")
        approved.add(value.lower())
    return approved


def update_sql(
    row: dict[str, Any], geo: dict[str, Any], image_url: str | None,
    force: bool, accept_anchor: bool = False,
) -> str | None:
    assignments = []
    geocode_accepted = geo.get("status") == "matched" or (
        accept_anchor and geo.get("status") == "anchor"
    )
    # Do not add coordinates to a regionless row when the geocoder could not
    # identify its region. Such partial updates look enriched but leave the
    # primary field this pipeline is intended to populate blank.
    if geocode_accepted and (row.get("region") or geo.get("region")):
        if force or not row.get("region"):
            if geo.get("region"):
                assignments.append(f"region = {sql_quote(str(geo['region']))}")
        if force or not row.get("city"):
            if geo.get("city"):
                assignments.append(f"city = {sql_quote(str(geo['city']))}")
        if force or not row.get("location"):
            location = json.dumps({"lat": geo["lat"], "lng": geo["lng"]}, separators=(",", ":"))
            assignments.append(f"location = {sql_quote(location)}")
    if image_url and (force or not row.get("images")):
        assignments.append(f"images = ARRAY[{sql_quote(image_url)}]::text[]")
    if not assignments:
        return None
    row_id = str(row["id"])
    if not UUID_RE.match(row_id):
        raise ValueError(f"Unsafe/non-UUID destination id: {row_id}")
    return f"UPDATE public.destinations\nSET {', '.join(assignments)}\nWHERE id = {sql_quote(row_id)}::uuid;"


def main() -> int:
    args = cli()
    if args.accept_anchor_min_score is not None and not 0 <= args.accept_anchor_min_score <= 1:
        raise ValueError("--accept-anchor-min-score must be between 0 and 1")
    rows = parse_destinations(args.input)
    if args.existing_csv:
        with args.existing_csv.open("r", encoding="utf-8-sig", newline="") as handle:
            existing_by_id = {str(item.get("id")): item for item in csv.DictReader(handle)}
        for row in rows:
            existing = existing_by_id.get(str(row.get("id")))
            if not existing:
                continue
            for field in ("region", "city", "location"):
                if existing.get(field):
                    row[field] = existing[field]
            existing_images = str(existing.get("images") or "").strip()
            if existing_images and existing_images not in {"[]", "{}", "null"}:
                row["images"] = existing_images
    if args.offset < 0:
        raise ValueError("--offset cannot be negative")
    rows = rows[args.offset:]
    if args.limit:
        rows = rows[: args.limit]
    cache = load_cache(args.cache)
    cache.setdefault("geocode", {})
    cache.setdefault("images", {})
    approved_anchor_ids = load_approved_ids(args.approved_anchor_ids)
    approved_image_ids = load_approved_ids(args.approved_image_ids)
    updates, report_rows = [], []
    for index, row in enumerate(rows, 1):
        print(f"[{index}/{len(rows)}] {row.get('name')}", flush=True)
        needs_geo = not args.skip_geocoding and (
            args.force or not (row.get("region") and row.get("city") and row.get("location"))
        )
        geo = geocode(row, args, cache) if needs_geo else {"status": "existing"}
        image, image_url, image_file = {"status": "disabled"}, None, None
        image_approved = str(row.get("id") or "").lower() in approved_image_ids
        if args.images and (args.force or not row.get("images")):
            image = commons_image(row, geo, args, cache)
            if (
                image.get("status") == "matched"
                and not args.dry_run
                and (not args.upload or image_approved)
            ):
                local_path = download_webp(image, row, args)
                image_file = local_path.as_posix()
                if args.upload:
                    image_url = upload_supabase(local_path, row, args)
        anchor_approved = str(row.get("id") or "").lower() in approved_anchor_ids
        if (
            not anchor_approved
            and args.accept_anchor_min_score is not None
            and geo.get("status") == "anchor"
            and geo.get("region")
            and float(geo.get("score") or 0) >= args.accept_anchor_min_score
        ):
            anchor_approved = True
        statement = update_sql(
            row, geo, image_url, args.force, args.accept_anchor or anchor_approved
        )
        if statement:
            updates.append(statement)
        report_rows.append({
            "id": row.get("id"), "name": row.get("name"), "geocode_status": geo.get("status"),
            "resolution_level": geo.get("resolution_level"),
            "anchor_approved": anchor_approved,
            "geocode_error": geo.get("error"),
            "score": geo.get("score"), "matched_query": geo.get("query"),
            "city": geo.get("city"), "region": geo.get("region"),
            "lat": geo.get("lat"), "lng": geo.get("lng"), "matched_address": geo.get("display_name"),
            "image_status": image.get("status"), "image_file": image_file,
            "image_match_score": image.get("match_score"),
            "image_search": image.get("search"),
            "image_source": image.get("source_page"),
            "image_license": image.get("license"), "generated_update": bool(statement),
            "image_approved": image_approved,
        })
        save_cache(args.cache, cache)
    if not args.dry_run:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        header = (
            "-- Generated by scripts/enrich_destinations.py\n"
            "-- Review destinations_enrichment_report.csv before applying.\n"
            "BEGIN;\n\n"
        )
        args.output.write_text(header + "\n\n".join(updates) + "\n\nCOMMIT;\n", encoding="utf-8")
        args.report.parent.mkdir(parents=True, exist_ok=True)
        with args.report.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(report_rows[0]) if report_rows else [])
            if report_rows:
                writer.writeheader()
                writer.writerows(report_rows)
    print(f"Done: {len(updates)} update statements; {len(report_rows)} rows reviewed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, urllib.error.HTTPError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
