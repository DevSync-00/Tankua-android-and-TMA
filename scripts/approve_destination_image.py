#!/usr/bin/env python3
"""List or apply manually reviewed destination image candidates."""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timezone

import aiohttp
import imagehash

from destination_image_pipeline.config import Settings
from destination_image_pipeline.infrastructure import Supabase
from destination_image_pipeline.pipeline import optimized


async def request_json(session, url, headers, *, params=None):
    async with session.get(url, headers=headers, params=params) as response:
        if response.status >= 300:
            raise RuntimeError(f"Supabase HTTP {response.status}: {await response.text()}")
        return await response.json()


async def list_pending(client: Supabase) -> None:
    params = {
        "select": "id,destination_id,title,source,confidence,image_url,original_source_url,license,photographer,destinations(name)",
        "status": "eq.pending",
        "order": "confidence.desc",
        "limit": "100",
    }
    rows = await request_json(client.session, f"{client.s.supabase_url}/rest/v1/destination_image_candidates", client.headers, params=params)
    if not rows:
        print("No pending candidates.")
        return
    for row in rows:
        destination = row.get("destinations") or {}
        print(f"\nCandidate ID: {row['id']}")
        print(f"Destination:  {destination.get('name', row['destination_id'])}")
        print(f"Confidence:   {float(row['confidence']):.1%}")
        print(f"Source:       {row['source']} — {row.get('license') or 'unknown license'}")
        print(f"Title:        {row['title']}")
        print(f"Preview:      {row['image_url']}")
        print(f"Source page:  {row['original_source_url']}")


async def approve(client: Supabase, candidate_id: int, force: bool) -> None:
    params = {"select": "*", "id": f"eq.{candidate_id}", "limit": "1"}
    rows = await request_json(client.session, f"{client.s.supabase_url}/rest/v1/destination_image_candidates", client.headers, params=params)
    if not rows:
        raise RuntimeError(f"Candidate {candidate_id} does not exist")
    candidate = rows[0]
    if candidate["status"] != "pending" and not force:
        raise RuntimeError(f"Candidate {candidate_id} has status {candidate['status']!r}; use --force only after reviewing it")

    raw = await download_original(client, candidate["image_url"], candidate.get("original_source_url"))
    variants, phash, width, height = await asyncio.to_thread(optimized, raw)
    parsed = imagehash.hex_to_hash(phash)
    existing = [imagehash.hex_to_hash(value) for value in await client.phashes()]
    if any(parsed - item <= 5 for item in existing):
        await patch_candidate(client, candidate_id, {"status": "duplicate", "reviewed_at": datetime.now(timezone.utc).isoformat()})
        raise RuntimeError("Candidate is visually identical to an active destination image; marked duplicate")

    destination_id = candidate["destination_id"]
    urls = {}
    for size, content in variants.items():
        urls[size] = await client.upload(f"destination-images/{destination_id}/{size}.webp", content)
    asset = {
        "destination_id": destination_id,
        "image_url": urls["large"],
        "medium_url": urls["medium"],
        "thumbnail_url": urls["small"],
        "source": candidate["source"],
        "photographer": candidate.get("photographer"),
        "license": candidate["license"],
        "width": width,
        "height": height,
        "confidence": candidate["confidence"],
        "original_source_url": candidate["original_source_url"],
        "phash": phash,
        "status": "active",
        "last_verified_at": datetime.now(timezone.utc).isoformat(),
    }
    await client.insert("destination_image_assets", asset, upsert=True, on_conflict="destination_id")
    await client.patch_destination(destination_id, {"images": [urls["large"]]})
    await patch_candidate(client, candidate_id, {"status": "approved", "reviewed_at": datetime.now(timezone.utc).isoformat()})
    print(f"Approved candidate {candidate_id}")
    print(f"Large:  {urls['large']}")
    print(f"Medium: {urls['medium']}")
    print(f"Small:  {urls['small']}")


async def download_original(client: Supabase, url: str, source_page: str | None) -> bytes:
    # Wikimedia rejects anonymous/default library user agents. Re-quote paths as
    # stored candidate URLs may contain apostrophes, parentheses, or Unicode.
    from yarl import URL
    safe_url = str(URL(url))
    headers = {
        "User-Agent": client.s.user_agent,
        "Accept": "image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8",
    }
    if source_page:
        headers["Referer"] = source_page
    last_error = None
    timeout = aiohttp.ClientTimeout(total=300, connect=30, sock_read=120)
    for attempt in range(4):
        try:
            async with client.session.get(safe_url, headers=headers, allow_redirects=True, timeout=timeout) as response:
                if response.status == 200:
                    content_type = response.headers.get("Content-Type", "")
                    if not content_type.startswith("image/"):
                        raise RuntimeError(f"Expected an image but received {content_type or 'unknown content type'}")
                    return await response.read()
                last_error = RuntimeError(f"Image download HTTP {response.status}: {(await response.text())[:300]}")
                if response.status not in {403, 429, 500, 502, 503, 504}:
                    break
        except (asyncio.TimeoutError, aiohttp.ClientError) as error:
            last_error = error
        await asyncio.sleep(2 ** attempt)
    raise last_error or RuntimeError("Image download failed")


async def patch_candidate(client: Supabase, candidate_id: int, payload: dict) -> None:
    headers = {**client.headers, "Content-Type": "application/json", "Prefer": "return=minimal"}
    async with client.session.patch(
        f"{client.s.supabase_url}/rest/v1/destination_image_candidates",
        params={"id": f"eq.{candidate_id}"}, json=payload, headers=headers,
    ) as response:
        if response.status >= 300:
            raise RuntimeError(await response.text())


async def run(args) -> None:
    settings = Settings.from_env()
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=settings.request_timeout)) as session:
        client = Supabase(settings, session)
        if args.list:
            await list_pending(client)
        elif args.reject_candidate_id is not None:
            await patch_candidate(client,args.reject_candidate_id,{"status":"rejected","reviewed_at":datetime.now(timezone.utc).isoformat(),"rejection_reasons":[args.reason]})
            print(f"Rejected candidate {args.reject_candidate_id}: {args.reason}")
        else:
            await approve(client, args.candidate_id, args.force)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    operation = parser.add_mutually_exclusive_group(required=True)
    operation.add_argument("--list", action="store_true", help="List pending candidates with preview URLs")
    operation.add_argument("--candidate-id", type=int, help="Approve one reviewed candidate")
    operation.add_argument("--reject-candidate-id", type=int, help="Reject one reviewed candidate")
    parser.add_argument("--reason", default="Manual visual review mismatch", help="Reason stored when rejecting a candidate")
    parser.add_argument("--force", action="store_true", help="Approve a non-pending candidate after explicit review")
    asyncio.run(run(parser.parse_args()))


if __name__ == "__main__":
    main()
