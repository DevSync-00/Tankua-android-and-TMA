from __future__ import annotations

import argparse
import asyncio
import csv
import io
import json
import logging
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import aiohttp
import imagehash
from PIL import Image, ImageOps

from .config import Settings
from .infrastructure import Cache, Http, RateLimiter, Supabase
from .matching import aliases, score
from .models import Candidate, Destination
from .providers import FlickrProvider, GooglePlacesProvider, OpenStreetMapProvider, UnsplashProvider, WikidataProvider, WikimediaProvider, WikipediaProvider

LOG = logging.getLogger("destination-images")


def destination(row: dict) -> Destination:
    loc=row.get("location") or {}
    if isinstance(loc,str):
        try: loc=json.loads(loc)
        except json.JSONDecodeError: loc={}
    lat=loc.get("lat") or loc.get("latitude"); lng=loc.get("lng") or loc.get("longitude")
    return Destination(id=row["id"],name=row["name"],region=row.get("region") or "",city=row.get("city") or "",latitude=float(lat) if lat is not None else None,longitude=float(lng) if lng is not None else None,category=row.get("category") or "")


def optimized(data: bytes) -> tuple[dict[str,bytes],str,int,int]:
    with Image.open(io.BytesIO(data)) as source:
        image=ImageOps.exif_transpose(source).convert("RGB"); width,height=image.size
        digest=str(imagehash.phash(image))
        output={}
        for name,size,quality in (("large",1200,84),("medium",720,82),("small",360,78)):
            variant=image.copy(); variant.thumbnail((size,size),Image.Resampling.LANCZOS)
            buffer=io.BytesIO(); variant.save(buffer,"WEBP",quality=quality,method=6,optimize=True); output[name]=buffer.getvalue()
        return output,digest,width,height


class Runner:
    def __init__(self,s:Settings,client:Supabase,http:Http,cache:Cache,run_id:str,dry_run:bool):
        self.s,self.client,self.http,self.cache,self.run_id,self.dry_run=s,client,http,cache,run_id,dry_run
        self.stats=Counter(); self.hashes:list[imagehash.ImageHash]=[]; self.report_rows=[]
        self.providers=[WikimediaProvider(http,s.max_candidates_per_provider),WikidataProvider(http,s.max_candidates_per_provider),WikipediaProvider(http,s.max_candidates_per_provider),GooglePlacesProvider(http,s.google_api_key,s.max_candidates_per_provider),OpenStreetMapProvider(http,s.max_candidates_per_provider),FlickrProvider(http,s.flickr_api_key,s.max_candidates_per_provider),UnsplashProvider(http,s.unsplash_access_key,s.max_candidates_per_provider)]

    async def one(self,d:Destination,force:bool=False)->None:
        if self.cache.completed(d.id) and not force: self.stats["resumed_skip"]+=1; self.report_rows.append({"id":d.id,"name":d.name,"status":"resumed_skip","candidates":0,"best_score":"","best_source":""}); return
        search_aliases=aliases(d); candidates=[]
        for provider in self.providers:
            try: candidates.extend(await provider.search(d,search_aliases))
            except Exception as e: LOG.warning("provider=%s destination=%s error=%s",provider.name,d.id,e); self.stats[f"provider_error:{provider.name}"]+=1
        for c in candidates: score(d,c,search_aliases)
        candidates.sort(key=lambda x:x.score,reverse=True)
        eligible=[c for c in candidates if not c.rejection_reasons and c.score>=self.s.reject_threshold]
        best=eligible[0] if eligible else None
        LOG.info("destination=%s name=%r candidates=%d eligible=%d best=%s score=%s",d.id,d.name,len(candidates),len(eligible),best.source if best else "none",best.score if best else "-")
        rows=[{"destination_id":d.id,"run_id":self.run_id,"source":c.source,"source_id":c.source_id or None,"title":c.title,"image_url":c.image_url,"original_source_url":c.original_source_url,"photographer":c.photographer or None,"license":c.license,"width":c.width,"height":c.height,"confidence":c.score,"score_breakdown":c.score_breakdown,"rejection_reasons":c.rejection_reasons,"status":("pending" if c is best and c.score>=self.s.reject_threshold and not c.rejection_reasons else "rejected")} for c in candidates]
        if not self.dry_run and rows: await self.client.insert("destination_image_candidates",rows)
        if not best or best.score<self.s.auto_threshold:
            status="review" if best else "failed"; self.stats[status]+=1; self.report_rows.append({"id":d.id,"name":d.name,"status":status,"candidates":len(candidates),"best_score":best.score if best else "","best_source":best.source if best else ""})
            if not self.dry_run: self.cache.finish(d.id,status)
            return
        try:
            async with self.http.session.get(best.image_url,headers={"User-Agent":self.s.user_agent}) as r:
                r.raise_for_status(); raw=await r.read()
            variants,phash,width,height=await asyncio.to_thread(optimized,raw)
            parsed_hash=imagehash.hex_to_hash(phash)
            if any(parsed_hash-existing <= 5 for existing in self.hashes):
                if not self.dry_run: await self.client.patch_candidate(self.run_id,d.id,best.source,best.source_id,"duplicate")
                self.stats["duplicate"]+=1; self.report_rows.append({"id":d.id,"name":d.name,"status":"duplicate","candidates":len(candidates),"best_score":best.score,"best_source":best.source})
                if not self.dry_run: self.cache.finish(d.id,"duplicate")
                return
            self.hashes.append(parsed_hash); slug=d.id
            urls={}
            if not self.dry_run:
                for name,content in variants.items(): urls[name]=await self.client.upload(f"destination-images/{slug}/{name}.webp",content)
                asset={"destination_id":d.id,"source":best.source,"photographer":best.photographer or None,"license":best.license,"width":width,"height":height,"confidence":best.score,"original_source_url":best.original_source_url,"image_url":urls["large"],"thumbnail_url":urls["small"],"medium_url":urls["medium"],"phash":phash,"last_verified_at":datetime.now(timezone.utc).isoformat(),"status":"active"}
                await self.client.insert("destination_image_assets",asset,upsert=True,on_conflict="destination_id")
                await self.client.patch_destination(d.id,{"images":[urls["large"]]})
                await self.client.patch_candidate(self.run_id,d.id,best.source,best.source_id,"approved")
            self.stats["success"]+=1; self.stats[f"source:{best.source}"]+=1; self.report_rows.append({"id":d.id,"name":d.name,"status":"success","candidates":len(candidates),"best_score":best.score,"best_source":best.source})
            if not self.dry_run: self.cache.finish(d.id,"success")
        except Exception as e:
            LOG.exception("destination=%s processing failed",d.id); self.stats["failed"]+=1; self.report_rows.append({"id":d.id,"name":d.name,"status":"processing_error","candidates":len(candidates),"best_score":best.score,"best_source":best.source})


async def run(args:argparse.Namespace)->None:
    settings=Settings.from_env(); timeout=aiohttp.ClientTimeout(total=settings.request_timeout)
    cache=Cache(settings.cache_path); run_id=str(uuid.uuid4())
    async with aiohttp.ClientSession(timeout=timeout) as session:
        client=Supabase(settings,session); http=Http(session,cache,RateLimiter(settings.requests_per_second),settings.user_agent)
        runner=Runner(settings,client,http,cache,run_id,args.dry_run)
        runner.hashes=[imagehash.hex_to_hash(x) for x in await client.phashes()]
        if not args.dry_run: await client.insert("destination_image_runs",{"id":run_id,"status":"running","configuration":{"concurrency":settings.concurrency,"threshold":settings.auto_threshold}})
        rows=await client.destinations(args.limit,args.offset); items=[destination(x) for x in rows]
        queue=asyncio.Queue(); [queue.put_nowait(x) for x in items]
        async def worker():
            while not queue.empty():
                try: item=queue.get_nowait()
                except asyncio.QueueEmpty:return
                try: await runner.one(item,args.force)
                finally: queue.task_done()
        await asyncio.gather(*(worker() for _ in range(settings.concurrency)))
        Path(args.report).parent.mkdir(parents=True,exist_ok=True)
        with open(args.report,"w",newline="",encoding="utf-8") as f:
            fields=["id","name","status","candidates","best_score","best_source"];w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(runner.report_rows)
        summary=Path(args.report).with_name(Path(args.report).stem+"_summary.csv")
        with summary.open("w",newline="",encoding="utf-8") as f:
            w=csv.writer(f);w.writerow(["metric","count"]);w.writerows(sorted(runner.stats.items()))
        if not args.dry_run:
            headers={**client.headers,"Content-Type":"application/json"}
            async with session.patch(f"{settings.supabase_url}/rest/v1/destination_image_runs",params={"id":f"eq.{run_id}"},json={"status":"completed","completed_at":datetime.now(timezone.utc).isoformat(),"statistics":dict(runner.stats)},headers=headers) as r:r.raise_for_status()
        LOG.info("completed %s",dict(runner.stats))


def main()->None:
    p=argparse.ArgumentParser();p.add_argument("--limit",type=int);p.add_argument("--offset",type=int,default=0);p.add_argument("--force",action="store_true");p.add_argument("--dry-run",action="store_true");p.add_argument("--report",default="database/destination_image_pipeline_report.csv");p.add_argument("--log-level",default="INFO")
    args=p.parse_args();logging.basicConfig(level=args.log_level,format="%(asctime)s %(levelname)s %(message)s");asyncio.run(run(args))
