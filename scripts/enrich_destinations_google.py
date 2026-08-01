#!/usr/bin/env python3
"""Second-pass destination enrichment using Google Places Text Search (New)."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ENDPOINT = "https://places.googleapis.com/v1/places:searchText"
UUID_RE = re.compile(r"^[0-9a-f-]{36}$", re.I)
STOPWORDS = {
    "a", "an", "and", "at", "center", "centre", "city", "community",
    "complex", "district", "ethiopia", "facilities", "field", "grounds",
    "historic", "historical", "hub", "in", "of", "outpost", "park",
    "public", "region", "resort", "site", "the", "trail", "village",
}
REGION_ALIASES = {
    "አዲስ አበባ": "Addis Ababa",
    "አማራ": "Amhara",
    "ኦሮሚያ": "Oromia",
    "ትግራይ": "Tigray",
    "addis ababa": "Addis Ababa",
    "afar": "Afar",
    "amhara": "Amhara",
    "benishangul gumuz": "Benishangul-Gumuz",
    "central ethiopia": "Central Ethiopia Regional State",
    "dire dawa": "Dire Dawa",
    "gambela": "Gambela",
    "gambella": "Gambela",
    "harari": "Harar",
    "oromia": "Oromia",
    "sidama": "Sidama",
    "somali": "Somali",
    "south ethiopia": "South Ethiopia Regional State",
    "south west ethiopia peoples": "South West Ethiopia Peoples",
    "tigray": "Tigray",
}


def cli() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Current destinations CSV export")
    parser.add_argument("--output", type=Path, default=Path("database/destinations_google.sql"))
    parser.add_argument("--report", type=Path, default=Path("database/destinations_google_report.csv"))
    parser.add_argument("--cache", type=Path, default=Path(".cache/destination_google.json"))
    parser.add_argument("--api-key", default=os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"))
    parser.add_argument("--limit", type=int)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--delay", type=float, default=0.1)
    parser.add_argument("--min-score", type=float, default=0.58)
    args = parser.parse_args()
    if not args.api_key:
        args.api_key = dotenv_value(Path(".env"), "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY")
    if not args.api_key:
        parser.error("Google Maps API key not found")
    return args


def dotenv_value(path: Path, name: str) -> str | None:
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        match = re.match(rf"\s*{re.escape(name)}\s*=\s*(.*?)\s*$", line)
        if match:
            return match.group(1).strip().strip('"\'')
    return None


def load_cache(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": 1, "places": {}}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if data.get("version") == 1 else {"version": 1, "places": {}}


def save_cache(path: Path, cache: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def tokens(value: Any) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9]+", str(value or "").casefold())
        if len(token) >= 3 and token not in STOPWORDS
    }


def component(place: dict[str, Any], component_types: tuple[str, ...]) -> str | None:
    for item in place.get("addressComponents") or []:
        if any(kind in (item.get("types") or []) for kind in component_types):
            return item.get("longText") or item.get("shortText")
    return None


def normalize_region(value: str | None) -> str | None:
    if not value:
        return None
    direct = REGION_ALIASES.get(value.strip().casefold())
    if direct:
        return direct
    cleaned = re.sub(r"\s+(?:Region|Regional State)$", "", value, flags=re.I).strip()
    key = re.sub(r"[^a-z]+", " ", cleaned.casefold()).strip()
    return REGION_ALIASES.get(key, cleaned)


def score_place(row: dict[str, str], place: dict[str, Any]) -> float:
    country = component(place, ("country",))
    if country and country.casefold() not in {"ethiopia", "et"}:
        return -1.0
    location = place.get("location") or {}
    try:
        lat, lng = float(location["latitude"]), float(location["longitude"])
    except (KeyError, TypeError, ValueError):
        return -1.0
    if not (3.0 <= lat <= 15.5 and 32.5 <= lng <= 48.5):
        return -1.0
    expected = tokens(row.get("name"))
    display = (place.get("displayName") or {}).get("text")
    actual = tokens(f"{display} {place.get('formattedAddress', '')}")
    overlap = len(expected & actual) / max(1, len(expected))
    name_overlap = len(expected & tokens(display)) / max(1, len(expected))
    return round(max(overlap * 0.82, name_overlap * 0.9), 3)


def search(row: dict[str, str], key: str) -> dict[str, Any]:
    payload = json.dumps({
        "textQuery": f"{row.get('name', '').strip()}, Ethiopia",
        "languageCode": "en",
        "regionCode": "ET",
        "pageSize": 5,
    }).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,"
                "places.location,places.addressComponents,places.types"
            ),
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:1000]
        return {"status": "error", "error": f"HTTP {error.code}: {detail}"}
    except (urllib.error.URLError, TimeoutError) as error:
        return {"status": "error", "error": str(error)}
    ranked = sorted(
        ((score_place(row, place), place) for place in data.get("places") or []),
        key=lambda pair: pair[0], reverse=True,
    )
    if not ranked or ranked[0][0] < 0:
        return {"status": "no_match"}
    score, place = ranked[0]
    region = normalize_region(component(place, ("administrative_area_level_1",)))
    city = component(place, ("locality", "postal_town", "administrative_area_level_2", "sublocality"))
    location = place["location"]
    return {
        "status": "candidate",
        "score": score,
        "place_id": place.get("id"),
        "display_name": (place.get("displayName") or {}).get("text"),
        "formatted_address": place.get("formattedAddress"),
        "region": region,
        "city": city,
        "lat": float(location["latitude"]),
        "lng": float(location["longitude"]),
        "types": place.get("types") or [],
    }


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> int:
    args = cli()
    with args.input.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    unresolved = [row for row in rows if not row.get("region") or not row.get("location")]
    unresolved = unresolved[args.offset:]
    if args.limit is not None:
        unresolved = unresolved[:args.limit]
    cache = load_cache(args.cache)
    updates: list[str] = []
    report: list[dict[str, Any]] = []
    for index, row in enumerate(unresolved, 1):
        row_id = str(row.get("id") or "")
        print(f"[{index}/{len(unresolved)}] {row.get('name')}", flush=True)
        result = cache["places"].get(row_id)
        if result is None or result.get("status") == "error":
            result = search(row, args.api_key)
            if result.get("status") != "error":
                cache["places"][row_id] = result
                save_cache(args.cache, cache)
            time.sleep(max(0, args.delay))
        if result.get("status") == "error" and "SearchTextRequest per day" in str(result.get("error")):
            print("Google Places daily Text Search quota exhausted; stopping safely.", file=sys.stderr)
            break
        accepted = bool(
            result.get("status") == "candidate"
            and result.get("region")
            and float(result.get("score") or 0) >= args.min_score
            and UUID_RE.match(row_id)
        )
        if accepted:
            assignments = []
            if not row.get("region"):
                assignments.append(f"region = {sql_quote(result['region'])}")
            if not row.get("city") and result.get("city"):
                assignments.append(f"city = {sql_quote(result['city'])}")
            if not row.get("location"):
                loc = json.dumps({"lat": result["lat"], "lng": result["lng"]}, separators=(",", ":"))
                assignments.append(f"location = {sql_quote(loc)}")
            if assignments:
                updates.append(
                    f"UPDATE public.destinations\nSET {', '.join(assignments)}\n"
                    f"WHERE id = {sql_quote(row_id)}::uuid;"
                )
        report.append({
            "id": row_id,
            "name": row.get("name"),
            "status": result.get("status"),
            "score": result.get("score"),
            "display_name": result.get("display_name"),
            "formatted_address": result.get("formatted_address"),
            "city": result.get("city"),
            "region": result.get("region"),
            "lat": result.get("lat"),
            "lng": result.get("lng"),
            "place_id": result.get("place_id"),
            "types": "|".join(result.get("types") or []),
            "error": result.get("error"),
            "generated_update": accepted,
        })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        "-- Generated by scripts/enrich_destinations_google.py\nBEGIN;\n\n"
        + "\n\n".join(updates) + "\n\nCOMMIT;\n",
        encoding="utf-8",
    )
    args.report.parent.mkdir(parents=True, exist_ok=True)
    with args.report.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(report[0]) if report else ["id", "name"])
        writer.writeheader()
        writer.writerows(report)
    print(f"Done: {len(updates)} updates; {len(unresolved)} unresolved rows reviewed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
